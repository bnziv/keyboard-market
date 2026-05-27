import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/api';
import NavBar from '@/components/NavBar';
import { GroupBuyCard, CardGroupBuy } from '@/components/GroupBuyCard';
import { TabBar } from '@/components/TabBar';
import { Loader2, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export default function GroupBuys() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<StageFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('closing-soon');
  const [apiData, setApiData] = useState<ApiGroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<ApiGroupBuy[]>('/api/groupbuys')
      .then(res => setApiData(res.data))
      .catch(() => setError('Failed to load group buys.'))
      .finally(() => setLoading(false));
  }, []);

  const cards = apiData.map(toCardData);
  const liveCount = cards.filter(g => g.stage === 'live').length;
  const closingSoonCount = cards.filter(g => g.closingSoon).length;

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

  return (
    <div className="min-h-screen flex flex-col bg-km-bg text-km-ink">
      <NavBar activePage="groupbuys" />

      {/* Page header */}
      <div className="border-b border-km-line bg-km-surface px-4 sm:px-8 pt-8 sm:pt-10 pb-0">
        <div className="max-w-[1280px] mx-auto">

          <div className="font-km-mono text-[11px] text-km-gold tracking-[0.2em] uppercase mb-3">
            · Coordinated runs · pre-orders ·
          </div>

          <div className="flex items-start sm:items-end justify-between gap-5 sm:gap-10 flex-wrap">
            <div>
              <h1 className="m-0 font-km-body text-[32px] sm:text-[42px] font-bold tracking-[-0.03em] leading-none text-km-ink">
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
          <div className="flex mt-6 sm:mt-8 items-center -mb-px overflow-x-auto">
            <div className="flex-shrink-0">
              <TabBar
                tabs={STAGE_TABS.map(({ value, label }) => ({ key: value, label, count: tabCount(value) }))}
                active={stage}
                onChange={setStage}
                variant="body"
              />
            </div>

            <div className="flex-1 min-w-4" />

            <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
              <SelectTrigger className="flex-shrink-0 self-center mb-2.5 h-auto w-auto py-[7px] pl-[13px] pr-[10px] gap-3 border-none text-xs text-km-ink bg-km-surface font-km-body shadow-none">
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
      <div className="max-w-[1280px] mx-auto p-4 sm:p-8 w-full">

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
              <GroupBuyCard
                key={g.id}
                gb={g}
                onOpen={() => navigate(`/group-buys/${g.id}`, { state: g })}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 px-8 text-center text-km-ink-mute font-km-mono text-[13px]">
            No group buys in this stage right now.
          </div>
        )}

      </div>
    </div>
  );
}
