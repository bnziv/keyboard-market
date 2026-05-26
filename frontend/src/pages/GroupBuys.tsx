import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/utils/api';
import NavBar from '@/components/NavBar';
import { GroupBuyCard, CardGroupBuy } from '@/components/GroupBuyCard';
import { CATEGORY_PALETTES } from '@/components/GroupBuyImage';
import { StatusBadge } from '@/components/StatusBadge';
import { TabBar } from '@/components/TabBar';
import { BadgeTone } from '@/utils/badgeTones';
import { ArrowRight, ArrowLeft, Loader2, ExternalLink, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

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

// ─── Carousel ─────────────────────────────────────────────────────────────────

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
      <div
        className="w-full rounded-[6px] overflow-hidden flex items-center justify-center"
        style={{
          aspectRatio: '4 / 3',
          background: `linear-gradient(135deg, ${bg} 0%, ${fg}66 100%)`,
        }}
      >
        <div className="w-[72px] h-[72px] rounded-[8px] flex items-center justify-center font-km-mono text-xs tracking-[0.12em] uppercase"
          style={{
            border: '1.5px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          {category.slice(0, 3)}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div className="w-full relative rounded-[6px] overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
        {/* Blurred backdrop */}
        <img
          key={`bg-${active}`}
          src={images[active]}
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-[1.08]"
          style={{ filter: 'blur(18px) brightness(0.55)' }}
        />
        {/* Foreground */}
        <img
          key={active}
          src={images[active]}
          alt={`image ${active + 1}`}
          className="absolute inset-0 z-[1] w-full h-full object-contain"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        {/* Counter */}
        {images.length > 1 && (
          <div
            className="absolute bottom-2.5 right-3 z-[2] px-2 py-[3px] rounded font-km-mono text-[10px] tracking-[0.08em]"
            style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.8)' }}
          >
            {active + 1} / {images.length}
          </div>
        )}

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-[2] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-white"
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={next}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-[2] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-white"
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}
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
          className="flex gap-1.5 mt-2.5 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                'flex-shrink-0 p-0 rounded overflow-hidden cursor-pointer border-2 bg-transparent transition-[border-color,opacity] duration-[120ms]',
                i === active ? 'border-km-gold opacity-100' : 'border-km-line opacity-[0.65]'
              )}
              style={{ width: 72, height: 54 }}
            >
              <img
                src={src}
                alt={`view ${i + 1}`}
                className="w-full h-full object-cover block"
                onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function GroupBuyModal({ gb, onClose }: { gb: CardGroupBuy; onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<'overview' | 'vendors'>('overview');

  const stageMeta: Record<string, { label: string; tone: BadgeTone }> = {
    interest: { label: 'Interest check', tone: 'neutral' },
    live:     { label: 'Live', tone: 'ok' },
    closed:   { label: 'In production',  tone: 'accent' },
    shipping: { label: 'Shipping',       tone: 'accent' },
  };
  const meta = stageMeta[gb.stage];

  return (
    <Dialog.Root open={open} onOpenChange={o => !o && setOpen(false)}>
      <Dialog.Portal forceMount>
        <Dialog.Overlay
          className="gb-overlay fixed inset-0 z-[1000] bg-black/[0.72] backdrop-blur-[6px] flex items-center justify-center p-6"
        >
          <Dialog.Content
            className="gb-content w-full max-w-[1100px] bg-km-surface border border-km-line rounded-[8px] shadow-[0_40px_120px_rgba(0,0,0,0.5)] grid overflow-hidden"
            onAnimationEnd={() => { if (!open) onClose(); }}
            style={{ maxHeight: 'calc(100vh - 48px)', gridTemplateColumns: '1.1fr 1fr' }}
          >
            <Dialog.Title className="sr-only">{gb.name}</Dialog.Title>

            {/* ── LEFT — Carousel + kits ── */}
            <div className="bg-km-bg p-6 flex flex-col gap-4 border-r border-km-line overflow-y-auto">
              <Carousel images={gb.images} category={gb.category} />

              {gb.items.length > 0 && (
                <div>
                  <div className="font-km-mono text-[10px] text-km-ink-mute tracking-[0.15em] uppercase mb-2.5">
                    Kits & options
                  </div>
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                    {gb.items.map((item, i) => (
                      <div key={i} className="p-[10px_12px] border border-km-line rounded bg-km-surface">
                        <div className={cn('font-km-mono text-[9px] tracking-[0.1em] uppercase', item.price > 0 ? 'text-km-gold' : 'text-km-ink-mute')}>
                          {item.price > 0
                            ? `${item.currency === 'USD' ? '$' : item.currency + ' '}${item.price}`
                            : 'Included'}
                        </div>
                        <div className="text-[13px] font-semibold text-km-ink mt-1">
                          {item.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT — Sticky header + tabs + scrollable body + sticky footer ── */}
            <div className="flex flex-col min-h-0 overflow-hidden" style={{ maxHeight: 'calc(100vh - 48px)' }}>

              {/* Sticky header */}
              <div className="p-[20px_24px] border-b border-km-line flex items-start gap-3.5 flex-shrink-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                    <StatusBadge tone="neutral">{gb.category}</StatusBadge>
                    {gb.closingSoon && <StatusBadge tone="accent">⏱ {gb.closes} left</StatusBadge>}
                  </div>
                  <h2 className="m-0 font-km-body text-[26px] font-bold tracking-[-0.025em] leading-[1.15] text-km-ink">
                    {gb.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1.5 font-km-mono text-[11px] text-km-ink-mute tracking-[0.05em]">
                    by <span className="text-km-ink">@{gb.designer}</span>
                  </div>
                </div>
                <Dialog.Close asChild>
                  <Button variant="surface" size="icon" aria-label="Close" className="flex-shrink-0">
                    <X size={14} />
                  </Button>
                </Dialog.Close>
              </div>

              {/* Tab bar */}
              <div className="flex gap-[18px] px-6 border-b border-km-line flex-shrink-0">
                {([
                  ['overview', 'Overview'],
                  ['vendors',  `Vendors (${gb.vendors.length})`],
                ] as const).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setTab(v)}
                    className={cn(
                      'py-3.5 font-km-mono text-[11px] tracking-[0.1em] uppercase bg-none border-none border-b-2 cursor-pointer whitespace-nowrap -mb-px',
                      tab === v ? 'text-km-ink font-semibold border-km-gold' : 'text-km-ink-mute font-normal border-transparent'
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {/* Scrollable tab body */}
              <div className="flex-1 overflow-y-auto p-[20px_24px] min-h-0">

                {/* Overview tab */}
                {tab === 'overview' && (
                  <div>
                    {gb.desc && (
                      <p className="m-0 mb-[18px] text-sm leading-[1.6] text-km-ink-dim">
                        {gb.desc}
                      </p>
                    )}

                    {/* 2×2 dates grid */}
                    <div
                      className="grid border border-km-line rounded overflow-hidden mb-[18px]"
                      style={{ gridTemplateColumns: '1fr 1fr', gap: 0 }}
                    >
                      {([
                        { label: 'Start date',      value: formatDate(gb.gbStartIso), accent: false },
                        { label: 'End date',         value: formatDate(gb.gbEndIso),   accent: true  },
                        { label: 'Closes in',        value: gb.closes,                accent: false },
                        { label: 'Est. fulfillment', value: gb.eta,                   accent: false },
                      ] as const).map(({ label, value, accent }, i) => (
                        <div
                          key={label}
                          className={cn(
                            'p-[14px_16px] bg-km-surface',
                            i % 2 === 0 && 'border-r border-km-line',
                            i >= 2 && 'border-t border-km-line'
                          )}
                        >
                          <div className={cn('font-km-mono text-[10px] tracking-[0.12em] uppercase mb-1', accent ? 'text-km-gold' : 'text-km-ink-mute')}>
                            {label}
                          </div>
                          <div className="text-km-ink text-sm font-medium">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {gb.discordUrl && (
                      <Button size="sm" asChild style={{ background: '#5865F2', color: '#fff' }}>
                        <a
                          href={gb.discordUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg width="14" height="11" viewBox="0 0 127.14 96.36" fill="currentColor">
                            <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15zM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69z"/>
                          </svg>
                          Join Discord
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {/* Vendors tab */}
                {tab === 'vendors' && (
                  <div>
                    {gb.vendors.length === 0 ? (
                      <div className="p-8 text-center text-km-ink-mute font-km-mono text-xs">
                        No vendor information available.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {gb.vendors.map((v, i) => (
                          <div
                            key={i}
                            className="p-[14px_16px] border border-km-line rounded bg-km-bg grid gap-3.5 items-center"
                            style={{ gridTemplateColumns: 'minmax(0, 1fr) auto' }}
                          >
                            <div className="min-w-0">
                              <div className="font-km-mono text-[10px] text-km-ink-mute tracking-[0.12em] uppercase">
                                {v.region}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 min-w-0">
                                <span className="text-km-ink font-semibold text-sm whitespace-nowrap">
                                  {v.name}
                                </span>
                                <span className="font-km-mono text-[11px] text-km-ink-mute overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                                  {v.url}
                                </span>
                              </div>
                            </div>
                            <Button variant="surface" size="sm" asChild>
                              <a
                                href={v.url ? (v.url.startsWith('http') ? v.url : `https://${v.url}`) : undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                              >
                                Visit ↗
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Sticky footer */}
              <div className="p-[16px_24px] border-t border-km-line bg-km-surface flex items-center gap-2.5 flex-shrink-0">
                <div>
                  <div className="font-km-mono text-[9px] text-km-ink-mute tracking-[0.15em] uppercase">
                    Base price
                  </div>
                  <div className="font-km-body text-[22px] font-bold text-km-ink tracking-[-0.02em]">
                    {gb.price > 0 ? `$${gb.price}` : '—'}
                  </div>
                </div>

                <div className="flex-1" />

                {gb.sourceUrl && (
                  <Button variant="gold" asChild>
                    <a
                      href={gb.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      View original post <ExternalLink size={12} />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
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

  const selectedGb = selectedId ? cards.find(g => g.id === selectedId) ?? null : null;

  return (
    <div className="min-h-screen flex flex-col bg-km-bg text-km-ink">
      <NavBar activePage="groupbuys" />

      {/* Page header */}
      <div className="border-b border-km-line bg-km-surface px-8 pt-10 pb-0">
        <div className="max-w-[1280px] mx-auto">

          <div className="font-km-mono text-[11px] text-km-gold tracking-[0.2em] uppercase mb-3">
            · Coordinated runs · pre-orders ·
          </div>

          <div className="flex items-end justify-between gap-10 flex-wrap">
            <div>
              <h1 className="m-0 font-km-body text-[42px] font-bold tracking-[-0.03em] leading-none text-km-ink">
                Group buys
              </h1>
              <p className="mt-3 text-sm text-km-ink-dim leading-[1.55]" style={{ maxWidth: 540 }}>
                Coordinated manufacturing runs from independent designers and vendors. Pay once,
                wait for production, then it ships to your door. Refunded if MOQ isn't met.
              </p>
            </div>

            {/* Stats strip */}
            <div className="flex border border-km-line rounded bg-km-surface overflow-hidden">
              {([
                [String(liveCount), 'live now'],
                [String(cards.length), 'tracked'],
              ] as const).map(([v, l], i) => (
                <div
                  key={l}
                  className={cn('p-[16px_22px] min-w-[110px]', i < 1 && 'border-r border-km-line')}
                >
                  <div className="font-km-body text-[22px] font-bold text-km-ink tracking-[-0.02em]">
                    {v}
                  </div>
                  <div className="font-km-mono text-[9px] text-km-ink-mute tracking-[0.15em] uppercase mt-0.5">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stage tabs */}
          <div className="flex mt-8 items-center -mb-px">
            <TabBar
              tabs={STAGE_TABS.map(({ value, label }) => ({ key: value, label, count: tabCount(value) }))}
              active={stage}
              onChange={setStage}
              variant="body"
            />

            <div className="flex-1" />

            <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
              <SelectTrigger className="self-center mb-2.5 h-auto w-auto py-[7px] pl-[13px] pr-[10px] gap-3 border-none text-xs text-km-ink bg-km-surface font-km-body shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-km-surface border border-km-line rounded text-km-ink">
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([val, label]) => (
                  <SelectItem key={val} value={val} className="font-km-body text-xs cursor-pointer">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1280px] mx-auto p-8 w-full">

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-km-ink-mute" />
          </div>
        ) : error ? (
          <div className="py-16 px-8 text-center text-km-ink-mute font-km-mono text-[13px]">
            {error}
          </div>
        ) : visible.length > 0 ? (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {visible.map(g => (
              <GroupBuyCard key={g.id} gb={g} onOpen={() => setSelectedId(g.id)} />
            ))}
          </div>
        ) : (
          <div className="py-16 px-8 text-center text-km-ink-mute font-km-mono text-[13px]">
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
