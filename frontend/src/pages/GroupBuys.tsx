import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/api';
import { GroupBuyCard, CardGroupBuy } from '@/components/GroupBuyCard';
import { TabBar } from '@/components/TabBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { ApiGroupBuy } from '@/types/groupBuy';
import { toCardData } from '@/utils/groupBuyTransforms';

interface GbCounts {
  IC: number;
  GB: number;
  closed: number;
  total: number;
  closingSoon: number;
}

type StageFilter = 'all' | 'IC' | 'GB' | 'closed';
type SortOption = 'closing-soon' | 'price-asc' | 'price-desc' | 'newest';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest',
  'closing-soon': 'Closing soon',
  'price-asc': 'Price: low → high',
  'price-desc': 'Price: high → low',
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
  { value: 'all', label: 'All stages' },
  { value: 'IC', label: 'Interest check' },
  { value: 'GB', label: 'Live' },
  { value: 'closed', label: 'Closed' },
];

export default function GroupBuys() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<StageFilter>('GB');
  const [sortBy, setSortBy] = useState<SortOption>('closing-soon');
  const [cards, setCards] = useState<CardGroupBuy[]>([]);
  const [counts, setCounts] = useState<GbCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<GbCounts>('/api/groupbuys/counts')
      .then((res) => setCounts(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url =
      stage !== 'all' ? `/api/groupbuys?stage=${stage}` : '/api/groupbuys';
    api
      .get<ApiGroupBuy[]>(url)
      .then((res) => setCards(res.data.map(toCardData)))
      .catch(() => setError('Failed to load group buys.'))
      .finally(() => setLoading(false));
  }, [stage]);

  const visible = sortCards(cards, sortBy);

  const liveCount = counts?.GB ?? 0;
  const closingSoonCount = counts?.closingSoon ?? 0;

  // const tabCount = (v: StageFilter): number | undefined => {
  //   if (!counts) return undefined;
  //   if (v === 'all') return counts.total;
  //   return counts[v];
  // };

  return (
    <div className="min-h-screen flex flex-col bg-km-bg text-km-ink">
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
              <p
                className="mt-3 text-sm text-km-ink-dim leading-[1.55]"
                style={{ maxWidth: 540 }}
              >
                Coordinated manufacturing runs from independent designers and
                vendors. Pay once, wait for production, then it ships to your
                door. Refunded if MOQ isn't met.
              </p>
            </div>

            {/* Stats strip */}
            <div className="flex border border-km-line rounded bg-km-surface overflow-hidden">
              {(
                [
                  [String(liveCount), 'live now'],
                  [String(counts?.total ?? '—'), 'tracked'],
                ] as const
              ).map(([v, l], i) => (
                <div
                  key={l}
                  className={cn(
                    'p-[16px_22px] min-w-[110px]',
                    i < 1 && 'border-r border-km-line',
                  )}
                >
                  {counts === null ? (
                    <Skeleton variant="text" sx={{ fontSize: '22px', lineHeight: 1.5, width: 36 }} />
                  ) : (
                    <div className="font-km-body text-[22px] font-bold text-km-ink tracking-[-0.02em]">
                      {v}
                    </div>
                  )}
                  <div className="font-km-mono text-[9px] text-km-ink-mute tracking-[0.15em] uppercase mt-0.5">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stage filter & sort */}
          <div className="mt-6 sm:mt-8">
            {/* Mobile: two selects side by side */}
            <div className="flex gap-2 pb-4 sm:hidden">
              <Select
                value={stage}
                onValueChange={(v) => setStage(v as StageFilter)}
              >
                <SelectTrigger className="h-8 text-xs border flex-1 gap-2 bg-km-surface border-km-line text-km-ink font-km-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-km-surface border-km-line text-km-ink">
                  {STAGE_TABS.map(({ value, label }) => (
                    <SelectItem
                      key={value}
                      value={value}
                      className="font-km-body text-xs text-km-ink"
                    >
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger className="h-8 text-xs border flex-1 gap-2 bg-km-surface border-km-line text-km-ink font-km-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-km-surface border-km-line text-km-ink">
                  {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
                    ([val, label]) => (
                      <SelectItem
                        key={val}
                        value={val}
                        className="font-km-body text-xs text-km-ink"
                      >
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Desktop: tabs + sort */}
            <div className="hidden sm:flex items-center -mb-px">
              <TabBar
                tabs={STAGE_TABS.map(({ value, label }) => ({
                  key: value,
                  label
                }))}
                active={stage}
                onChange={setStage}
                variant="body"
              />
              <div className="flex-1" />
              <div className="mb-2.5">
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as SortOption)}
                >
                  <SelectTrigger className="h-8 text-xs border gap-2 bg-km-surface border-km-line text-km-ink font-km-body">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-km-surface border-km-line text-km-ink">
                    {(
                      Object.entries(SORT_LABELS) as [SortOption, string][]
                    ).map(([val, label]) => (
                      <SelectItem
                        key={val}
                        value={val}
                        className="font-km-body text-xs text-km-ink"
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1280px] mx-auto p-4 sm:p-8 w-full">
        {/* Closing-soon callout */}
        {closingSoonCount > 0 && (
          <div
            className="flex items-center gap-3 sm:gap-5 p-4 mb-7 border border-dashed border-km-gold rounded bg-km-gold-soft cursor-pointer sm:cursor-default"
            onClick={() => {
              if (window.innerWidth < 640) setStage('GB');
            }}
          >
            <Badge className="hidden sm:flex" variant="accent">
              ⏱ Closing soon
            </Badge>
            <div className="flex-1 text-[13px] text-km-ink">
              <strong>
                {closingSoonCount} group{' '}
                {closingSoonCount === 1 ? 'buy closes' : 'buys close'}
              </strong>{' '}
              in the next 48 hours.
            </div>
            <Button
              variant="gold"
              size="sm"
              className="hidden sm:flex flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setStage('GB');
              }}
            >
              View closing soon <ArrowRight size={13} />
            </Button>
            <ArrowRight
              size={15}
              className="sm:hidden text-km-gold flex-shrink-0"
            />
          </div>
        )}

        {loading && cards.length === 0 ? (
          <div className="grid gap-5 grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <GroupBuyCard key={i} loading />
            ))}
          </div>
        ) : error ? (
          <div className="py-16 px-8 text-center text-km-ink-mute font-km-mono text-[13px]">
            {error}
          </div>
        ) : visible.length > 0 ? (
          <div className="grid gap-5 grid-cols-2 lg:grid-cols-3">
            {visible.map((g) => (
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
