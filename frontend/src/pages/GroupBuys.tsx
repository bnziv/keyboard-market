import { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '@/components/NavBar';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import API_URL from '@/utils/config';

// Shape returned by the Spring Boot API (mirrors the MongoDB document)
interface ApiGroupBuy {
  id: string;
  topicId: string;
  name: string;
  type: string;         // keyboard | keycaps | switches | accessories
  status: string;       // IC | GB | closed | shipping | fulfilled
  gbStart: string | null;
  gbEnd: string | null;
  estimatedFulfillment: string | null;
  basePrice: { amount: number; currency: string } | null;
  designer: string;
  overview: string | null;
  images: string[];
  sourceUrl: string;
  vendors: { region: string; name: string; url: string }[];
  discordUrl: string | null;
}

// Shape consumed by GroupBuyCard
interface CardGroupBuy {
  id: string;
  name: string;
  designer: string;
  category: string;
  stage: 'interest' | 'live' | 'closed' | 'shipping';
  price: number;
  closes: string;
  gbStartMs: number | null;
  gbEndMs: number | null;
  eta: string;
  closingSoon: boolean;
  desc: string;
  sourceUrl: string;
  imageUrl: string | null;
}

function mapStatus(status: string): CardGroupBuy['stage'] {
  switch (status) {
    case 'IC': return 'interest';
    case 'GB': return 'live';
    case 'shipping': return 'shipping';
    case 'closed':
    case 'fulfilled':
    default:
      return 'closed';
  }
}

function capitalizeType(type: string): string {
  if (!type) return 'Keyboard';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function computeCloses(gbEnd: string | null): { label: string; soon: boolean } {
  if (!gbEnd) return { label: '—', soon: false };
  const end = new Date(gbEnd);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return { label: 'Closed', soon: false };
  const diffHours = diffMs / (1000 * 60 * 60);
  const days = Math.floor(diffHours / 24);
  const hours = Math.floor(diffHours % 24);
  const label = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  return { label, soon: diffHours <= 48 };
}

function toCardData(gb: ApiGroupBuy): CardGroupBuy {
  const { label: closes, soon: closingSoon } = computeCloses(gb.gbEnd);
  const stage = closes === 'Closed' ? 'closed' : mapStatus(gb.status);
  return {
    id: gb.id,
    name: gb.name,
    designer: gb.designer ?? '—',
    category: capitalizeType(gb.type),
    stage,
    price: gb.basePrice?.amount ?? 0,
    closes,
    gbStartMs: gb.gbStart ? new Date(gb.gbStart).getTime() : null,
    gbEndMs: gb.gbEnd ? new Date(gb.gbEnd).getTime() : null,
    closingSoon,
    eta: gb.estimatedFulfillment ?? '—',
    desc: gb.overview ?? '',
    sourceUrl: gb.sourceUrl,
    imageUrl: gb.images?.[0] ?? null,
  };
}

type StageFilter = 'all' | 'interest' | 'live' | 'closed';
type SortOption = 'closing-soon' | 'price-asc' | 'price-desc' | 'newest';

const SORT_LABELS: Record<SortOption, string> = {
  'newest':       'Newest',
  'closing-soon': 'Closing soon',
  'price-asc':    'Price: low → high',
  'price-desc':   'Price: high → low',
};

function sortCards(cards: CardGroupBuy[], sortBy: SortOption): CardGroupBuy[] {
  return [...cards].sort((a, b) => {
    if (sortBy === 'newest') {
      if (a.gbStartMs === null && b.gbStartMs === null) return 0;
      if (a.gbStartMs === null) return 1;
      if (b.gbStartMs === null) return -1;
      return b.gbStartMs - a.gbStartMs;
    }
    if (sortBy === 'closing-soon') {
      if (a.gbEndMs === null && b.gbEndMs === null) return 0;
      if (a.gbEndMs === null) return 1;
      if (b.gbEndMs === null) return -1;
      return a.gbEndMs - b.gbEndMs;
    }
    if (sortBy === 'price-asc') {
      if (a.price === 0 && b.price === 0) return 0;
      if (a.price === 0) return 1;
      if (b.price === 0) return -1;
      return a.price - b.price;
    }
    if (sortBy === 'price-desc') {
      if (a.price === 0 && b.price === 0) return 0;
      if (a.price === 0) return 1;
      if (b.price === 0) return -1;
      return b.price - a.price;
    }
    return 0;
  });
}

const STAGE_TABS: { value: StageFilter; label: string }[] = [
  { value: 'all',      label: 'All stages' },
  { value: 'interest', label: 'Interest check' },
  { value: 'live',     label: 'Live' },
  { value: 'closed',   label: 'Closed' },
];

const CATEGORY_PALETTES: Record<string, [string, string]> = {
  Keyboard:    ['#1e2a5e', '#3d5af1'],
  Keycaps:     ['#3b1f5c', '#8b5cf6'],
  Switches:    ['#1a3a2e', '#22c55e'],
  Accessories: ['#3a2a1a', '#f59e0b'],
};

type BadgeTone = 'neutral' | 'ok' | 'accent';

const BADGE_TONES: Record<BadgeTone, { bg: string; fg: string; border: string }> = {
  neutral: { bg: 'var(--km-surface-2)', fg: 'var(--km-ink-dim)', border: 'var(--km-line)' },
  accent:  { bg: 'var(--km-gold-soft)',  fg: 'var(--km-gold)',    border: 'var(--km-gold)' },
  ok:      { bg: 'color-mix(in srgb, var(--km-ok) 20%, var(--km-surface))', fg: 'var(--km-ok)', border: 'var(--km-ok)' },
};

function GroupBuyImage({ category, imageUrl }: { category: string; imageUrl: string | null }) {
  const [bg, fg] = CATEGORY_PALETTES[category] ?? ['#1c1c2e', '#6366f1'];
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={category}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div style={{
      width: '100%', height: '100%',
      background: `linear-gradient(135deg, ${bg} 0%, ${fg}66 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 60, height: 60,
        border: '1.5px solid rgba(255,255,255,0.15)',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--km-font-mono)', fontSize: 10,
        color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        {category.slice(0, 3)}
      </div>
    </div>
  );
}

function StagePill({ children, tone }: { children: React.ReactNode; tone: BadgeTone }) {
  const t = BADGE_TONES[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px',
      fontFamily: 'var(--km-font-mono)', fontSize: 10,
      letterSpacing: '0.05em', textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      background: t.bg, color: t.fg,
      border: `1px solid ${t.border}`,
      borderRadius: 4,
    }}>
      {children}
    </span>
  );
}

function GroupBuyCard({ gb }: { gb: CardGroupBuy }) {
  const [hovered, setHovered] = useState(false);

  const stageMeta: Record<string, { label: string; tone: BadgeTone }> = {
    interest: { label: 'Interest check', tone: 'neutral' },
    live:     { label: 'Live', tone: 'ok' },
    closed:   { label: 'In production', tone: 'accent' },
    shipping: { label: 'Shipping', tone: 'accent' },
  };
  const meta = stageMeta[gb.stage];

  return (
    <div
      onClick={() => window.open(gb.sourceUrl, '_blank', 'noopener')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--km-surface)',
        border: `1px solid ${hovered ? 'var(--km-ink)' : 'var(--km-line)'}`,
        borderRadius: 6,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        transition: 'border-color 150ms ease',
      }}
    >
      {/* Image */}
      <div style={{ aspectRatio: '16/10', position: 'relative', overflow: 'hidden' }}>
        <GroupBuyImage category={gb.category} imageUrl={gb.imageUrl} />
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <StagePill tone={meta.tone}>{meta.label}</StagePill>
          {gb.closingSoon && <StagePill tone="accent">⏱ {gb.closes} left</StagePill>}
        </div>
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          padding: '4px 10px',
          background: 'rgba(0,0,0,0.65)',
          color: '#fff',
          borderRadius: 4,
          fontFamily: 'var(--km-font-mono)', fontSize: 11,
          letterSpacing: '0.05em',
        }}>
          {gb.eta}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{
          fontFamily: 'var(--km-font-mono)', fontSize: 10,
          color: 'var(--km-ink-mute)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {gb.category} · by @{gb.designer}
        </div>

        <div style={{
          fontFamily: 'var(--km-font-body)', fontSize: 19, fontWeight: 600,
          color: 'var(--km-ink)', marginTop: 4, lineHeight: 1.2,
          letterSpacing: '-0.02em',
        }}>
          {gb.name}
        </div>

        <p style={{
          margin: '8px 0 16px', fontSize: 13,
          color: 'var(--km-ink-dim)', lineHeight: 1.5, flex: 1,
        }}>
          {gb.desc || 'No description available.'}
        </p>

        {/* Price + countdown */}
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', marginTop: 'auto', gap: 14,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--km-font-mono)', fontSize: 9,
              color: 'var(--km-ink-mute)', letterSpacing: '0.15em',
              textTransform: 'uppercase', marginBottom: 2,
            }}>
              Base price
            </div>
            <div style={{
              fontFamily: 'var(--km-font-body)', fontSize: 22, fontWeight: 700,
              color: 'var(--km-ink)', letterSpacing: '-0.02em',
            }}>
              {gb.price > 0 ? `$${gb.price}` : '—'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'var(--km-font-mono)', fontSize: 9,
              color: 'var(--km-ink-mute)', letterSpacing: '0.15em',
              textTransform: 'uppercase', marginBottom: 2,
            }}>
              {gb.stage === 'closed' ? 'Status' : 'Closes in'}
            </div>
            <div style={{
              fontFamily: 'var(--km-font-mono)', fontSize: 14, fontWeight: 600,
              color: gb.closingSoon ? 'var(--km-gold)' : 'var(--km-ink)',
            }}>
              {gb.closes}
            </div>
          </div>
        </div>

        {/* CTA button */}
        <button
          onClick={e => { e.stopPropagation(); window.open(gb.sourceUrl, '_blank', 'noopener'); }}
          style={{
            marginTop: 14, width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 4,
            fontFamily: 'var(--km-font-body)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'opacity 150ms',
            ...(gb.stage === 'closed'
              ? {
                  background: 'var(--km-surface-2)',
                  color: 'var(--km-ink-dim)',
                  border: '1px solid var(--km-line)',
                }
              : {
                  background: 'var(--km-gold)',
                  color: 'var(--km-bg)',
                  border: 'none',
                }),
          }}
        >
          {gb.stage === 'interest' && <>Express interest <ArrowRight size={13} /></>}
          {gb.stage === 'live' && <>Join group buy · {gb.price > 0 ? `$${gb.price}` : 'view'} <ArrowRight size={13} /></>}
          {gb.stage === 'closed' && <>Join waitlist</>}
          {gb.stage === 'shipping' && <>Track shipment <ArrowRight size={13} /></>}
        </button>
      </div>
    </div>
  );
}

export default function GroupBuys() {
  const [stage, setStage] = useState<StageFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('closing-soon');
  const [apiData, setApiData] = useState<ApiGroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get<ApiGroupBuy[]>(`${API_URL}/api/groupbuys`)
      .then(res => setApiData(res.data))
      .catch(() => setError('Failed to load group buys.'))
      .finally(() => setLoading(false));
  }, []);

  const cards = apiData.map(toCardData);
  const liveCount = cards.filter(g => g.stage === 'live').length;

  const stageCounts = cards.reduce<Record<string, number>>((acc, g) => {
    acc[g.stage] = (acc[g.stage] ?? 0) + 1;
    return acc;
  }, {});

  const tabCount = (v: StageFilter) => {
    if (v === 'all') return cards.length;
    if (v === 'closed') return (stageCounts['closed'] ?? 0) + (stageCounts['shipping'] ?? 0);
    return stageCounts[v] ?? 0;
  };
  const visible = sortCards(
    cards.filter(g =>
      stage === 'all' ||
      (stage === 'closed' ? g.stage === 'closed' || g.stage === 'shipping' : g.stage === stage)
    ),
    sortBy,
  );
  const closingSoonCount = cards.filter(g => g.closingSoon).length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--km-bg)', color: 'var(--km-ink)' }}>
      <NavBar activePage="groupbuys" />

      {/* Page header */}
      <div style={{
        borderBottom: '1px solid var(--km-line)',
        background: 'var(--km-surface)',
        padding: '40px 32px 0',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          <div style={{
            fontFamily: 'var(--km-font-mono)', fontSize: 11,
            color: 'var(--km-gold)', letterSpacing: '0.2em',
            textTransform: 'uppercase', marginBottom: 12,
          }}>
            · Coordinated runs · pre-orders ·
          </div>

          <div style={{
            display: 'flex', alignItems: 'flex-end',
            justifyContent: 'space-between', gap: 40, flexWrap: 'wrap',
          }}>
            <div>
              <h1 style={{
                margin: 0,
                fontFamily: 'var(--km-font-body)', fontSize: 42, fontWeight: 700,
                letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--km-ink)',
              }}>
                Group buys
              </h1>
              <p style={{
                marginTop: 12, maxWidth: 540,
                fontSize: 14, color: 'var(--km-ink-dim)', lineHeight: 1.55,
              }}>
                Coordinated manufacturing runs from independent designers and vendors. Pay once,
                wait for production, then it ships to your door. Refunded if MOQ isn't met.
              </p>
            </div>

            {/* Stats strip */}
            <div style={{
              display: 'flex',
              border: '1px solid var(--km-line)',
              borderRadius: 4,
              background: 'var(--km-surface)',
              overflow: 'hidden',
            }}>
              {([
                [String(liveCount), 'live now'],
                [String(cards.length), 'tracked'],
              ] as const).map(([v, l], i) => (
                <div key={l} style={{
                  padding: '16px 22px',
                  borderRight: i < 1 ? '1px solid var(--km-line)' : 'none',
                  minWidth: 110,
                }}>
                  <div style={{
                    fontFamily: 'var(--km-font-body)', fontSize: 22, fontWeight: 700,
                    color: 'var(--km-ink)', letterSpacing: '-0.02em',
                  }}>
                    {v}
                  </div>
                  <div style={{
                    fontFamily: 'var(--km-font-mono)', fontSize: 9,
                    color: 'var(--km-ink-mute)', letterSpacing: '0.15em',
                    textTransform: 'uppercase', marginTop: 2,
                  }}>
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stage tabs */}
          <div style={{
            display: 'flex', gap: 2, marginTop: 32,
            alignItems: 'center', marginBottom: -1,
          }}>
            {STAGE_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStage(value)}
                style={{
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: stage === value ? 600 : 400,
                  color: stage === value ? 'var(--km-ink)' : 'var(--km-ink-dim)',
                  background: 'none',
                  outline: 'none',
                  borderWidth: '0 0 2px 0',
                  borderStyle: 'solid',
                  borderColor: stage === value ? 'var(--km-gold)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'var(--km-font-body)',
                  whiteSpace: 'nowrap',
                  transition: 'color 150ms',
                }}
              >
                {label}
                <span style={{
                  fontFamily: 'var(--km-font-mono)', fontSize: 10,
                  color: 'var(--km-ink-mute)',
                  background: stage === value ? 'var(--km-gold-soft)' : 'var(--km-surface-2)',
                  padding: '1px 6px', borderRadius: 8,
                  transition: 'background 150ms',
                }}>
                  {tabCount(value)}
                </span>
              </button>
            ))}

            <div style={{ flex: 1 }} />

            <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
              <SelectTrigger style={{
                alignSelf: 'center',
                marginBottom: 10,
                height: 'auto',
                width: 'auto',
                padding: '7px 10px 7px 13px',
                gap: 12,
                border: 'none',
                fontSize: 12,
                color: 'var(--km-ink)',
                background: 'var(--km-surface)',
                fontFamily: 'var(--km-font-body)',
                boxShadow: 'none',
              }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{
                background: 'var(--km-surface)',
                border: '1px solid var(--km-line)',
                borderRadius: 4,
                color: 'var(--km-ink)',
              }}>
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([val, label]) => (
                  <SelectItem key={val} value={val} style={{
                    fontFamily: 'var(--km-font-body)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px', width: '100%' }}>

        {/* Closing-soon callout */}
        {closingSoonCount > 0 && (
          <div style={{
            padding: '20px 24px', marginBottom: 28,
            border: '1px dashed var(--km-gold)',
            borderRadius: 4,
            background: 'var(--km-gold-soft)',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              fontFamily: 'var(--km-font-mono)', fontSize: 11,
              color: 'var(--km-gold)', letterSpacing: '0.2em', textTransform: 'uppercase',
              padding: '6px 10px',
              border: '1px solid var(--km-gold)',
              borderRadius: 4,
              whiteSpace: 'nowrap',
            }}>
              ⏱ Closing soon
            </div>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--km-ink)' }}>
              <strong>{closingSoonCount} group {closingSoonCount === 1 ? 'buy' : 'buys'}</strong>{' '}
              close in the next 48 hours.
            </div>
            <button
              onClick={() => setStage('live')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px',
                background: 'var(--km-gold)',
                color: 'var(--km-bg)',
                border: 'none', borderRadius: 4,
                fontSize: 13, fontWeight: 600,
                fontFamily: 'var(--km-font-body)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              View closing soon <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Loading / error / cards */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--km-ink-mute)' }} />
          </div>
        ) : error ? (
          <div style={{
            padding: '64px 32px', textAlign: 'center',
            color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)', fontSize: 13,
          }}>
            {error}
          </div>
        ) : visible.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {visible.map(g => <GroupBuyCard key={g.id} gb={g} />)}
          </div>
        ) : (
          <div style={{
            padding: '64px 32px', textAlign: 'center',
            color: 'var(--km-ink-mute)',
            fontFamily: 'var(--km-font-mono)', fontSize: 13,
          }}>
            No group buys in this stage right now.
          </div>
        )}

      </div>
    </div>
  );
}
