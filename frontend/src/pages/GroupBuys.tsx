import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/utils/api';
import NavBar from '@/components/NavBar';
import { StatusBadge } from '@/components/StatusBadge';
import { TabBar } from '@/components/TabBar';
import { BadgeTone } from '@/utils/badgeTones';
import { ArrowRight, ArrowLeft, Loader2, ExternalLink, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ApiGroupBuy {
  id: string;
  topicId: string;
  name: string;
  type: string;
  status: string;
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
  items: { name: string; price: number; currency: string }[];
}

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
  gbStartIso: string | null;
  gbEndIso: string | null;
  eta: string;
  closingSoon: boolean;
  desc: string;
  sourceUrl: string;
  imageUrl: string | null;
  images: string[];
  vendors: { region: string; name: string; url: string }[];
  discordUrl: string | null;
  items: { name: string; price: number; currency: string }[];
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

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    gbStartIso: gb.gbStart,
    gbEndIso: gb.gbEnd,
    closingSoon,
    eta: gb.estimatedFulfillment ?? '—',
    desc: gb.overview ?? '',
    sourceUrl: gb.sourceUrl,
    imageUrl: gb.images?.[0] ?? null,
    images: gb.images ?? [],
    vendors: gb.vendors ?? [],
    discordUrl: gb.discordUrl ?? null,
    items: gb.items ?? [],
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

// ─── Modal ────────────────────────────────────────────────────────────────────

function Carousel({ images, category }: { images: string[]; category: string }) {
  const [active, setActive] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const [bg, fg] = CATEGORY_PALETTES[category] ?? ['#1c1c2e', '#6366f1'];

  const prev = useCallback(() => setActive(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setActive(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const el = thumbsRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [active]);

  if (images.length === 0) {
    return (
      <div style={{
        width: '100%', aspectRatio: '4 / 3', borderRadius: 6, overflow: 'hidden',
        background: `linear-gradient(135deg, ${bg} 0%, ${fg}66 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 8,
          border: '1.5px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--km-font-mono)', fontSize: 12,
          color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          {category.slice(0, 3)}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div style={{ width: '100%', aspectRatio: '4 / 3', position: 'relative', borderRadius: 6, overflow: 'hidden' }}>
        {/* Blurred backdrop */}
        <img
          key={`bg-${active}`}
          src={images[active]}
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            filter: 'blur(18px) brightness(0.55)',
            transform: 'scale(1.08)',
          }}
        />
        {/* Foreground — full image, no crop */}
        <img
          key={active}
          src={images[active]}
          alt={`image ${active + 1}`}
          style={{
            position: 'absolute', inset: 0, zIndex: 1,
            width: '100%', height: '100%',
            objectFit: 'contain',
          }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        {/* Counter */}
        {images.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 10, right: 12, zIndex: 2,
            padding: '3px 8px',
            background: 'rgba(0,0,0,0.55)',
            color: 'rgba(255,255,255,0.8)',
            borderRadius: 4,
            fontFamily: 'var(--km-font-mono)', fontSize: 10,
            letterSpacing: '0.08em',
          }}>
            {active + 1} / {images.length}
          </div>
        )}

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={next}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ArrowRight size={14} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          ref={thumbsRef}
          style={{
            display: 'flex', gap: 6, marginTop: 10,
            overflowX: 'auto', scrollbarWidth: 'none',
          }}
        >
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                flexShrink: 0, width: 72, height: 54, padding: 0,
                borderRadius: 4, overflow: 'hidden', cursor: 'pointer',
                border: `2px solid ${i === active ? 'var(--km-gold)' : 'var(--km-line)'}`,
                opacity: i === active ? 1 : 0.65,
                transition: 'border-color 120ms, opacity 120ms',
                background: 'none',
              }}
            >
              <img
                src={src}
                alt={`view ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupBuyModal({ gb, onClose }: { gb: CardGroupBuy; onClose: () => void }) {
  const [tab, setTab] = useState<'overview' | 'vendors' | 'timeline'>('overview');

  const stageMeta: Record<string, { label: string; tone: BadgeTone }> = {
    interest: { label: 'Interest check', tone: 'neutral' },
    live:     { label: 'Live · pledging', tone: 'ok' },
    closed:   { label: 'In production',  tone: 'accent' },
    shipping: { label: 'Shipping',       tone: 'accent' },
  };
  const meta = stageMeta[gb.stage];

  useEffect(() => {
    const saved = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = saved; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const ctaLabel = {
    interest: 'Express interest →',
    live:     'Join group buy →',
    closed:   'Join waitlist',
    shipping: 'Track shipment →',
  }[gb.stage];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'gbFadeIn 180ms ease',
      }}
    >
      <style>{`
        @keyframes gbFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes gbScaleIn { from { opacity: 0; transform: scale(0.98) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 1100,
          maxHeight: 'calc(100vh - 48px)',
          background: 'var(--km-surface)',
          border: '1px solid var(--km-line)',
          borderRadius: 8,
          boxShadow: '0 40px 120px rgba(0,0,0,0.5)',
          display: 'grid', gridTemplateColumns: '1.1fr 1fr',
          overflow: 'hidden',
          animation: 'gbScaleIn 200ms ease',
        }}
      >
        {/* ── LEFT — Carousel + kits ── */}
        <div style={{
          background: 'var(--km-bg)',
          padding: '24px',
          display: 'flex', flexDirection: 'column', gap: 16,
          borderRight: '1px solid var(--km-line)',
          overflowY: 'auto',
        }}>
          <Carousel images={gb.images} category={gb.category} />

          {gb.items.length > 0 && (
            <div>
              <div style={{
                fontFamily: 'var(--km-font-mono)', fontSize: 10,
                color: 'var(--km-ink-mute)', letterSpacing: '0.15em',
                textTransform: 'uppercase', marginBottom: 10,
              }}>
                Kits & options
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 8,
              }}>
                {gb.items.map((item, i) => (
                  <div key={i} style={{
                    padding: '10px 12px',
                    border: '1px solid var(--km-line)',
                    borderRadius: 4,
                    background: 'var(--km-surface)',
                  }}>
                    <div style={{
                      fontFamily: 'var(--km-font-mono)', fontSize: 9,
                      color: item.price > 0 ? 'var(--km-gold)' : 'var(--km-ink-mute)',
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                    }}>
                      {item.price > 0
                        ? `${item.currency === 'USD' ? '$' : item.currency + ' '}${item.price}`
                        : 'Included'}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--km-ink)', marginTop: 4 }}>
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT — Sticky header + tabs + scrollable body + sticky footer ── */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', maxHeight: 'calc(100vh - 48px)' }}>

          {/* Sticky header */}
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid var(--km-line)',
            display: 'flex', alignItems: 'flex-start', gap: 14,
            flexShrink: 0,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                <StatusBadge tone="neutral">{gb.category}</StatusBadge>
                {gb.closingSoon && <StatusBadge tone="accent">⏱ {gb.closes} left</StatusBadge>}
              </div>
              <h2 style={{
                margin: 0,
                fontFamily: 'var(--km-font-body)', fontSize: 26, fontWeight: 700,
                letterSpacing: '-0.025em', lineHeight: 1.15,
                color: 'var(--km-ink)',
              }}>
                {gb.name}
              </h2>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
                fontFamily: 'var(--km-font-mono)', fontSize: 11,
                color: 'var(--km-ink-mute)', letterSpacing: '0.05em',
              }}>
                by <span style={{ color: 'var(--km-ink)' }}>@{gb.designer}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: '1px solid var(--km-line)',
                color: 'var(--km-ink-dim)', width: 32, height: 32,
                borderRadius: 4, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Tab bar */}
          <div style={{
            display: 'flex', gap: 18, padding: '0 24px',
            borderBottom: '1px solid var(--km-line)',
            flexShrink: 0,
          }}>
            {([
              ['overview', 'Overview'],
              ['vendors',  `Vendors (${gb.vendors.length})`],
            ] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTab(v)}
                style={{
                  padding: '14px 0',
                  fontFamily: 'var(--km-font-mono)', fontSize: 11,
                  color: tab === v ? 'var(--km-ink)' : 'var(--km-ink-mute)',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  fontWeight: tab === v ? 600 : 400,
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${tab === v ? 'var(--km-gold)' : 'transparent'}`,
                  cursor: 'pointer',
                  marginBottom: -1,
                  whiteSpace: 'nowrap',
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Scrollable tab body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', minHeight: 0 }}>

            {/* Overview tab */}
            {tab === 'overview' && (
              <div>
                {gb.desc && (
                  <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.6, color: 'var(--km-ink-dim)' }}>
                    {gb.desc}
                  </p>
                )}

                {/* 2×2 dates grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: 0, border: '1px solid var(--km-line)',
                  borderRadius: 4, overflow: 'hidden', marginBottom: 18,
                }}>
                  {([
                    { label: 'Start date',      value: formatDate(gb.gbStartIso), accent: false },
                    { label: 'End date',         value: formatDate(gb.gbEndIso),   accent: true  },
                    { label: 'Closes in',        value: gb.closes,                accent: false },
                    { label: 'Est. fulfillment', value: gb.eta,                   accent: false },
                  ] as const).map(({ label, value, accent }, i) => (
                    <div key={label} style={{
                      padding: '14px 16px',
                      background: 'var(--km-surface)',
                      borderRight: i % 2 === 0 ? '1px solid var(--km-line)' : 'none',
                      borderTop: i >= 2 ? '1px solid var(--km-line)' : 'none',
                    }}>
                      <div style={{
                        fontFamily: 'var(--km-font-mono)', fontSize: 10,
                        color: accent ? 'var(--km-gold)' : 'var(--km-ink-mute)',
                        letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4,
                      }}>
                        {label}
                      </div>
                      <div style={{ color: 'var(--km-ink)', fontSize: 14, fontWeight: 500 }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {gb.discordUrl && (
                  <a
                    href={gb.discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '8px 14px',
                      background: '#5865F2', color: '#fff',
                      border: 'none', borderRadius: 4,
                      fontFamily: 'var(--km-font-body)', fontSize: 13, fontWeight: 600,
                      textDecoration: 'none', cursor: 'pointer',
                    }}
                  >
                    <svg width="14" height="11" viewBox="0 0 127.14 96.36" fill="currentColor">
                      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15zM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69z"/>
                    </svg>
                    Join Discord
                  </a>
                )}
              </div>
            )}

            {/* Vendors tab */}
            {tab === 'vendors' && (
              <div>
                {gb.vendors.length === 0 ? (
                  <div style={{
                    padding: '32px', textAlign: 'center',
                    color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)', fontSize: 12,
                  }}>
                    No vendor information available.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {gb.vendors.map((v, i) => (
                      <div key={i} style={{
                        padding: '14px 16px',
                        border: '1px solid var(--km-line)', borderRadius: 4,
                        background: 'var(--km-bg)',
                        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 14, alignItems: 'center',
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontFamily: 'var(--km-font-mono)', fontSize: 10,
                            color: 'var(--km-ink-mute)', letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                          }}>
                            {v.region}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, minWidth: 0 }}>
                            <span style={{ color: 'var(--km-ink)', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>
                              {v.name}
                            </span>
                            <span style={{
                              fontFamily: 'var(--km-font-mono)', fontSize: 11, color: 'var(--km-ink-mute)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                            }}>
                              {v.url}
                            </span>
                          </div>
                        </div>
                        <a
                          href={v.url ? (v.url.startsWith('http') ? v.url : `https://${v.url}`) : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '7px 12px',
                            background: 'var(--km-surface)', color: 'var(--km-ink)',
                            border: '1px solid var(--km-line)', borderRadius: 4,
                            fontFamily: 'var(--km-font-body)', fontSize: 12, fontWeight: 600,
                            textDecoration: 'none', cursor: 'pointer', flexShrink: 0,
                            transition: 'border-color 120ms',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--km-ink)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--km-line)')}
                        >
                          Visit ↗
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Sticky footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--km-line)',
            background: 'var(--km-surface)',
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--km-font-mono)', fontSize: 9,
                color: 'var(--km-ink-mute)', letterSpacing: '0.15em',
                textTransform: 'uppercase',
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

            <div style={{ flex: 1 }} />

            {gb.sourceUrl && (
              <a
                href={gb.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 14px',
                  background: 'transparent', color: 'var(--km-ink-dim)',
                  border: '1px solid var(--km-line)', borderRadius: 4,
                  fontFamily: 'var(--km-font-body)', fontSize: 13, fontWeight: 500,
                  textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                View original post <ExternalLink size={12} />
              </a>
            )}

            {gb.sourceUrl && (
              <a
                href={gb.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '11px 16px',
                  borderRadius: 4,
                  fontFamily: 'var(--km-font-body)', fontSize: 13, fontWeight: 700,
                  textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
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
                {ctaLabel}
                {gb.stage !== 'closed' && <ExternalLink size={13} />}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function GroupBuyCard({ gb, onOpen }: { gb: CardGroupBuy; onOpen: () => void }) {
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
      onClick={onOpen}
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
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
          {gb.closingSoon && <StatusBadge tone="accent">⏱ {gb.closes} left</StatusBadge>}
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
          onClick={e => { e.stopPropagation(); onOpen(); }}
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
          {gb.stage === 'closed' && <>View details</>}
          {gb.stage === 'shipping' && <>Track shipment <ArrowRight size={13} /></>}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupBuys() {
  const [stage, setStage] = useState<StageFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('closing-soon');
  const [apiData, setApiData] = useState<ApiGroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    api.get<ApiGroupBuy[]>('/api/groupbuys')
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
  const selectedGb = selectedId ? cards.find(g => g.id === selectedId) ?? null : null;

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
            display: 'flex', marginTop: 32,
            alignItems: 'center', marginBottom: -1,
          }}>
            <TabBar
              tabs={STAGE_TABS.map(({ value, label }) => ({ key: value, label, count: tabCount(value) }))}
              active={stage}
              onChange={setStage}
              variant="body"
            />

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
            {visible.map(g => (
              <GroupBuyCard key={g.id} gb={g} onOpen={() => setSelectedId(g.id)} />
            ))}
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

      {/* Modal */}
      {selectedGb && (
        <GroupBuyModal gb={selectedGb} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
