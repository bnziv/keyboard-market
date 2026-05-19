import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface GroupBuy {
  id: string;
  name: string;
  designer: string;
  category: 'Keyboard' | 'Keycaps' | 'Switches';
  stage: 'interest' | 'live' | 'closed' | 'shipping';
  price: number;
  tierPrice: number;
  slots: { filled: number; moq: number; max: number };
  closes: string;
  eta: string;
  hot?: boolean;
  closingSoon?: boolean;
  desc: string;
}

const GROUP_BUYS: GroupBuy[] = [
  {
    id: 'gb-001',
    name: 'Zaku II R2',
    designer: 'protokb',
    category: 'Keyboard',
    stage: 'live',
    price: 950,
    tierPrice: 880,
    slots: { filled: 204, moq: 300, max: 500 },
    closes: '4d 12h',
    eta: 'Q4 2026',
    hot: true,
    desc: 'Round 2 of the cult anodized 65% with side weight inserts and brass plate.',
  },
  {
    id: 'gb-002',
    name: 'GMK Fundamentals',
    designer: 'morii',
    category: 'Keycaps',
    stage: 'live',
    price: 160,
    tierPrice: 145,
    slots: { filled: 612, moq: 500, max: 1500 },
    closes: '11d 03h',
    eta: 'Q1 2027',
    desc: 'Cherry-profile ABS, doubleshot. 9 kits including 40s, Norde, and a metric novelties kit.',
  },
  {
    id: 'gb-003',
    name: 'Hineybush H08v2',
    designer: 'hineybush',
    category: 'Keyboard',
    stage: 'live',
    price: 420,
    tierPrice: 380,
    slots: { filled: 88, moq: 150, max: 250 },
    closes: '2d 18h',
    eta: 'Q3 2026',
    closingSoon: true,
    desc: 'Compact split-spacebar 65% with gasket-mount, polycarb plate and a brass weight option.',
  },
  {
    id: 'gb-004',
    name: 'Cerakey V2 — Pearl',
    designer: 'cerakey',
    category: 'Keycaps',
    stage: 'interest',
    price: 220,
    tierPrice: 195,
    slots: { filled: 312, moq: 800, max: 1200 },
    closes: '23d 06h',
    eta: 'Q2 2027',
    desc: 'Ceramic keycap set in pearl with a sound profile unlike any plastic cap.',
  },
  {
    id: 'gb-005',
    name: 'Switch Drop · Lubed Naevies',
    designer: 'switchlab',
    category: 'Switches',
    stage: 'live',
    price: 78,
    tierPrice: 68,
    slots: { filled: 480, moq: 200, max: 600 },
    closes: '6h 12m',
    eta: 'Ships 2 wks',
    closingSoon: true,
    desc: 'Hand-lubed, filmed Naevies in packs of 70. 3-tier discount based on volume.',
  },
  {
    id: 'gb-006',
    name: 'Frog Pad TKL',
    designer: 'geonworks',
    category: 'Keyboard',
    stage: 'closed',
    price: 1240,
    tierPrice: 1240,
    slots: { filled: 400, moq: 400, max: 400 },
    closes: 'Closed',
    eta: 'Shipping now',
    desc: 'Production complete — currently shipping to participants. Join the waitlist.',
  },
];

type StageFilter = 'all' | 'interest' | 'live' | 'closed' | 'shipping';

const STAGE_TABS: { value: StageFilter; label: string }[] = [
  { value: 'all', label: 'All stages' },
  { value: 'interest', label: 'Interest check' },
  { value: 'live', label: 'Live · taking pledges' },
  { value: 'closed', label: 'In production' },
  { value: 'shipping', label: 'Shipping' },
];

const CATEGORY_PALETTES: Record<string, [string, string]> = {
  Keyboard: ['#1e2a5e', '#3d5af1'],
  Keycaps: ['#3b1f5c', '#8b5cf6'],
  Switches: ['#1a3a2e', '#22c55e'],
};

type BadgeTone = 'neutral' | 'ok' | 'accent';

const BADGE_TONES: Record<BadgeTone, { bg: string; fg: string; border: string }> = {
  neutral: { bg: 'var(--km-surface-2)', fg: 'var(--km-ink-dim)', border: 'var(--km-line)' },
  accent:  { bg: 'var(--km-gold-soft)',  fg: 'var(--km-gold)',    border: 'var(--km-gold)' },
  ok:      { bg: 'transparent',          fg: 'var(--km-ok)',      border: 'var(--km-ok)' },
};

function GroupBuyImage({ category }: { category: string }) {
  const [bg, fg] = CATEGORY_PALETTES[category] ?? ['#1c1c2e', '#6366f1'];
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

function GroupBuyCard({ gb }: { gb: GroupBuy }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const overMOQ = gb.slots.filled >= gb.slots.moq;
  const slotsPct = Math.min(100, Math.round((gb.slots.filled / gb.slots.max) * 100));
  const moqMarkerPct = Math.min(100, (gb.slots.moq / gb.slots.max) * 100);

  const stageMeta: Record<string, { label: string; tone: BadgeTone }> = {
    interest: { label: 'Interest check', tone: 'neutral' },
    live: { label: 'Live · pledging', tone: 'ok' },
    closed: { label: 'In production', tone: 'accent' },
    shipping: { label: 'Shipping', tone: 'accent' },
  };
  const meta = stageMeta[gb.stage];

  return (
    <div
      onClick={() => navigate('/listings')}
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
        <GroupBuyImage category={gb.category} />
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <StagePill tone={meta.tone}>{meta.label}</StagePill>
          {gb.hot && <StagePill tone="accent">🔥 Hot</StagePill>}
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
          {gb.desc}
        </p>

        {/* Progress block */}
        <div style={{
          padding: '14px 16px',
          background: 'var(--km-surface-2)',
          border: '1px solid var(--km-line)',
          borderRadius: 4,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', marginBottom: 8,
          }}>
            <div style={{
              fontFamily: 'var(--km-font-mono)', fontSize: 11, fontWeight: 600,
              color: overMOQ ? 'var(--km-ok)' : 'var(--km-ink-dim)',
            }}>
              {overMOQ ? '✓ MOQ MET' : 'PROGRESS TO MOQ'}
            </div>
            <div style={{
              fontFamily: 'var(--km-font-mono)', fontSize: 11, fontWeight: 600,
              color: 'var(--km-ink)',
            }}>
              {gb.slots.filled} / {gb.slots.moq}
            </div>
          </div>

          {/* Bar */}
          <div style={{
            position: 'relative', height: 6,
            background: 'var(--km-line)', borderRadius: 3, overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${slotsPct}%`,
              background: overMOQ ? 'var(--km-ok)' : 'var(--km-gold)',
              borderRadius: 3,
              transition: 'width 300ms ease',
            }} />
            {/* MOQ marker */}
            <div style={{
              position: 'absolute', left: `${moqMarkerPct}%`,
              top: -2, bottom: -2, width: 2,
              background: 'var(--km-ink)', opacity: 0.35,
            }} />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--km-font-mono)', fontSize: 9,
            color: 'var(--km-ink-mute)', marginTop: 6, letterSpacing: '0.05em',
          }}>
            <span>0</span>
            <span>MOQ · {gb.slots.moq}</span>
            <span>Cap · {gb.slots.max}</span>
          </div>
        </div>

        {/* Price + countdown */}
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', marginTop: 16, gap: 14,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--km-font-mono)', fontSize: 9,
              color: 'var(--km-ink-mute)', letterSpacing: '0.15em',
              textTransform: 'uppercase', marginBottom: 2,
            }}>
              {gb.tierPrice < gb.price ? 'Current tier' : 'Price'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{
                fontFamily: 'var(--km-font-body)', fontSize: 22, fontWeight: 700,
                color: 'var(--km-ink)', letterSpacing: '-0.02em',
              }}>
                ${gb.tierPrice}
              </span>
              {gb.tierPrice < gb.price && (
                <span style={{
                  fontFamily: 'var(--km-font-mono)', fontSize: 11,
                  color: 'var(--km-ink-mute)', textDecoration: 'line-through',
                }}>
                  ${gb.price}
                </span>
              )}
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
          onClick={e => { e.stopPropagation(); navigate('/listings'); }}
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
          {gb.stage === 'live' && <>Join group buy · ${gb.tierPrice} <ArrowRight size={13} /></>}
          {gb.stage === 'closed' && <>Join waitlist</>}
          {gb.stage === 'shipping' && <>Track shipment <ArrowRight size={13} /></>}
        </button>
      </div>
    </div>
  );
}

export default function GroupBuys() {
  const [stage, setStage] = useState<StageFilter>('all');

  const stageCounts = GROUP_BUYS.reduce<Record<string, number>>((acc, g) => {
    acc[g.stage] = (acc[g.stage] ?? 0) + 1;
    return acc;
  }, {});

  const tabCount = (v: StageFilter) => (v === 'all' ? GROUP_BUYS.length : stageCounts[v] ?? 0);

  const visible = GROUP_BUYS.filter(g => stage === 'all' || g.stage === stage);
  const closingSoonCount = GROUP_BUYS.filter(g => g.closingSoon).length;

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

          {/* Kicker */}
          <div style={{
            fontFamily: 'var(--km-font-mono)', fontSize: 11,
            color: 'var(--km-gold)', letterSpacing: '0.2em',
            textTransform: 'uppercase', marginBottom: 12,
          }}>
            · Coordinated runs · pre-orders ·
          </div>

          {/* Title row */}
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
                ['12', 'live now'],
                ['$284k', 'pledged'],
                ['1.6k', 'participants'],
                ['98%', 'fulfilled'],
              ] as const).map(([v, l], i) => (
                <div key={l} style={{
                  padding: '16px 22px',
                  borderRight: i < 3 ? '1px solid var(--km-line)' : 'none',
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

            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 13px',
              border: '1px solid var(--km-line)',
              borderRadius: 4,
              fontSize: 12, color: 'var(--km-ink-dim)',
              background: 'var(--km-surface)', cursor: 'pointer',
              fontFamily: 'var(--km-font-body)',
              marginBottom: 4,
              outline: 'none',
            }}>
              Sort:{' '}
              <span style={{ color: 'var(--km-ink)', fontWeight: 500 }}>Closing soon</span>
              <ChevronDown size={12} />
            </button>
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
              close in the next 24 hours. Pledge before the window shuts — there are no late drops.
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

        {/* Cards grid */}
        {visible.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}>
            {visible.map(g => <GroupBuyCard key={g.id} gb={g} />)}
          </div>
        ) : (
          <div style={{
            padding: '64px 32px',
            textAlign: 'center',
            color: 'var(--km-ink-mute)',
            fontFamily: 'var(--km-font-mono)', fontSize: 13,
          }}>
            No group buys in this stage right now.
          </div>
        )}

        {/* Designer CTA */}
        <div style={{
          marginTop: 48, padding: '36px 40px',
          border: '1px solid var(--km-line)',
          borderRadius: 4,
          background: 'var(--km-surface)',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 40, alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--km-font-mono)', fontSize: 11,
              color: 'var(--km-gold)', letterSpacing: '0.2em',
              textTransform: 'uppercase', marginBottom: 10,
            }}>
              For designers
            </div>
            <h3 style={{
              margin: 0,
              fontFamily: 'var(--km-font-body)', fontSize: 24, fontWeight: 700,
              letterSpacing: '-0.02em', color: 'var(--km-ink)',
            }}>
              Host your next run with us
            </h3>
            <p style={{
              marginTop: 10, color: 'var(--km-ink-dim)',
              fontSize: 14, lineHeight: 1.55, maxWidth: 520,
            }}>
              We handle escrow, identity verification, fulfilment logistics, and refunds
              if the run doesn't hit MOQ. You focus on the design.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button style={{
              padding: '11px 24px',
              border: '1px solid var(--km-line)',
              borderRadius: 4,
              background: 'transparent',
              color: 'var(--km-ink-dim)',
              fontSize: 14, fontWeight: 500,
              fontFamily: 'var(--km-font-body)',
              cursor: 'pointer',
            }}>
              Read the guide
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '11px 24px',
              background: 'var(--km-gold)',
              color: 'var(--km-bg)',
              border: 'none', borderRadius: 4,
              fontSize: 14, fontWeight: 600,
              fontFamily: 'var(--km-font-body)',
              cursor: 'pointer',
            }}>
              Apply to host <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
