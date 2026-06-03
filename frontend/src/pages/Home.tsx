import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/utils/AuthProvider';
import { useToast } from '@/utils/ToastProvider';
import { GroupBuyCard } from '@/components/GroupBuyCard';
import { ArrowRight } from 'lucide-react';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import type { ApiGroupBuy } from '@/types/groupBuy';
import { toFeaturedCard } from '@/utils/groupBuyTransforms';

function FeaturedCardSkeleton() {
  return (
    <div className="rounded border overflow-hidden bg-km-surface border-km-line animate-pulse">
      <div style={{ aspectRatio: '4/3' }} className="bg-km-bg-sub" />
      <div className="px-4 py-4 border-t border-km-line">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-km-line" />
          <div className="h-4 w-10 rounded bg-km-line" />
        </div>
        <div className="mt-2 h-3 w-20 rounded bg-km-line" />
      </div>
    </div>
  );
}

const STATS = [
  ['2,847', 'Active listings'],
  ['18,204', 'Verified members'],
  ['$1.4M', 'Traded last 30d'],
  ['99.2%', 'Ship-on-time rate'],
] as const;

function stagePriority(status: string): number {
  if (status === 'GB') return 0;
  if (status === 'IC') return 1;
  if (status === 'shipping') return 2;
  return 3;
}

function pickFeatured(all: ApiGroupBuy[], count: number): ApiGroupBuy[] {
  const marked = all.filter((gb) => gb.featured);
  const pool =
    marked.length >= count
      ? marked
      : [
          ...marked,
          ...all
            .filter((gb) => !gb.featured)
            .sort((a, b) => stagePriority(a.status) - stagePriority(b.status)),
        ];
  const maxStart = Math.max(0, pool.length - count);
  const start = Math.floor(Math.random() * (maxStart + 1));
  return pool.slice(start, start + count);
}

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { showInfo } = useToast();
  const [groupBuys, setGroupBuys] = useState<ApiGroupBuy[]>([]);
  const [gbLoading, setGbLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiGroupBuy[]>('/api/groupbuys')
      .then((res) => setGroupBuys(res.data))
      .finally(() => setGbLoading(false));
  }, []);

  const isLoading = authLoading || gbLoading;
  const featured = pickFeatured(groupBuys, 4);

  const heroGb = featured[0] ?? null;

  const handleCreateListing = () => {
    if (isAuthenticated) {
      navigate('/create-listing');
    } else {
      showInfo('You must be logged in to create a listing');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-km-bg text-km-ink">
      {/* Hero */}
      <div className="border-b border-km-line px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          <div>
            <h1
              className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-none mb-5 font-km-body"
              style={{ letterSpacing: '-0.04em' }}
            >
              where the boards
              <br />
              change hands.
            </h1>
            <p className="text-base leading-relaxed mb-7 text-km-ink-dim max-w-sm lg:max-w-none">
              A members-only marketplace for enthusiast keyboards. No scalpers,
              no dropshippers — just people who care about the click.
            </p>
            <div className="flex gap-3">
              <Button variant="gold" size="lg" asChild>
                <Link to="/listings">
                  Browse the market <ArrowRight size={14} />
                </Link>
              </Button>
              <Button variant="outline" size="lg" onClick={handleCreateListing}>
                List an item
              </Button>
            </div>
          </div>

          {/* Hero group buy card */}
          {isLoading ? (
            <FeaturedCardSkeleton />
          ) : heroGb ? (
            <GroupBuyCard gb={toFeaturedCard(heroGb)} variant="featured" />
          ) : null}
        </div>
      </div>

      {/* Group buys section */}
      <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-6xl mx-auto w-full">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div className="font-km-mono text-xs uppercase mb-1 text-km-gold tracking-[0.15em]">
              Active runs
            </div>
            <h2 className="text-2xl font-semibold text-km-ink tracking-[-0.02em]">
              Group buys
            </h2>
          </div>
          <Link
            to="/group-buys"
            className="font-km-mono text-xs uppercase transition-colors hover:opacity-80 text-km-ink-mute tracking-[0.1em]"
          >
            All group buys →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading
            ? [0, 1, 2].map((i) => <FeaturedCardSkeleton key={i} />)
            : featured.slice(1).map((gb) => (
                <GroupBuyCard
                  key={gb.id}
                  gb={toFeaturedCard(gb)}
                  variant="featured"
                />
              ))}
        </div>

        {/* Stats strip */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 p-5 sm:p-7 rounded border bg-km-surface border-km-line">
          {STATS.map(([value, label]) => (
            <div key={label}>
              <div
                className="text-3xl font-semibold font-km-body text-km-ink"
                style={{ letterSpacing: '-0.03em' }}
              >
                {value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest font-km-mono text-km-ink-mute tracking-[0.12em]">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
