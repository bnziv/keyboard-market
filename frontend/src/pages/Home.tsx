import { useState, useEffect } from 'react';
import NavBar from "@/components/NavBar";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/utils/AuthProvider";
import { useToast } from "@/utils/ToastProvider";
import { GroupBuyCard, CardGroupBuy } from "@/components/GroupBuyCard";
import { ArrowRight, Loader2 } from "lucide-react";
import api from "@/utils/api";

const STATS = [
  ['2,847', 'Active listings'],
  ['18,204', 'Verified members'],
  ['$1.4M', 'Traded last 30d'],
  ['99.2%', 'Ship-on-time rate'],
] as const;

interface GroupBuy {
  id: string;
  name: string;
  type: string;
  status: string;
  basePrice: { amount: number; currency: string } | null;
  designer: string;
  images: string[];
}

function stagePriority(status: string): number {
  if (status === 'GB') return 0;
  if (status === 'IC') return 1;
  if (status === 'shipping') return 2;
  return 3;
}

function mapStage(status: string): CardGroupBuy['stage'] {
  if (status === 'GB') return 'live';
  if (status === 'IC') return 'interest';
  if (status === 'shipping') return 'shipping';
  return 'closed';
}

function toFeaturedCard(gb: GroupBuy): CardGroupBuy {
  const category = gb.type ? gb.type.charAt(0).toUpperCase() + gb.type.slice(1) : 'Keyboard';
  return {
    id: gb.id, name: gb.name, designer: gb.designer,
    category, stage: mapStage(gb.status),
    price: gb.basePrice?.amount ?? 0,
    imageUrl: gb.images?.[0] ?? null,
    images: gb.images ?? [],
    closes: '—', closingSoon: false, eta: '—', desc: '',
    gbStartMs: null, gbEndMs: null, gbStartIso: null, gbEndIso: null,
    sourceUrl: '', vendors: [], discordUrl: null, items: [],
  };
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showInfo } = useToast();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [gbLoading, setGbLoading] = useState(true);

  useEffect(() => {
    api.get<GroupBuy[]>('/api/groupbuys')
      .then(res => setGroupBuys(res.data))
      .finally(() => setGbLoading(false));
  }, []);

  const featured = [...groupBuys]
    .sort((a, b) => stagePriority(a.status) - stagePriority(b.status))
    .slice(0, 3);

  const heroGb = featured[0] ?? null;

  const handleCreateListing = () => {
    if (isAuthenticated) {
      navigate('/create-listing');
    } else {
      showInfo('You must be logged in to create a listing');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--km-bg)', color: 'var(--km-ink)' }}>
      <NavBar activePage="home" />

      {/* Hero */}
      <div className="border-b px-8 py-12" style={{ borderColor: 'var(--km-line)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-10 items-center">
          <div>
            <h1
              className="text-7xl font-bold leading-none tracking-tight mb-5"
              style={{ fontFamily: 'var(--km-font-body)', letterSpacing: '-0.04em' }}
            >
              where the boards<br />change hands.
            </h1>
            <p className="text-base leading-relaxed mb-7" style={{ color: 'var(--km-ink-dim)', maxWidth: '480px' }}>
              A members-only marketplace for enthusiast keyboards. No scalpers,
              no dropshippers — just people who care about the click.
            </p>
            <div className="flex gap-3">
              <Link
                to="/listings"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded transition-opacity hover:opacity-90"
                style={{
                  background: 'var(--km-gold)',
                  color: 'var(--km-bg)',
                  fontFamily: 'var(--km-font-body)',
                }}
              >
                Browse the market <ArrowRight size={14} />
              </Link>
              <button
                onClick={handleCreateListing}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded border transition-colors hover:border-white/40"
                style={{
                  background: 'transparent',
                  color: 'var(--km-ink-dim)',
                  borderColor: 'var(--km-line-strong)',
                  fontFamily: 'var(--km-font-body)',
                  cursor: 'pointer',
                }}
              >
                List an item
              </button>
            </div>
          </div>

          {/* Hero group buy card */}
          {gbLoading ? (
            <div className="rounded-lg overflow-hidden border" style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)' }}>
              <div style={{
                aspectRatio: '4/3', width: '100%',
                background: 'var(--km-bg-sub)',
                backgroundImage: 'repeating-linear-gradient(-20deg, rgba(212,178,76,0.07) 0, rgba(212,178,76,0.07) 1px, transparent 0, transparent 50%)',
                backgroundSize: '8px 8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div className="text-xs tracking-widest uppercase" style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)' }}>
                  [ loading ]
                </div>
              </div>
            </div>
          ) : heroGb ? (
            <GroupBuyCard gb={toFeaturedCard(heroGb)} variant="featured" />
          ) : null}
        </div>
      </div>

      {/* Group buys section */}
      <div className="px-8 py-10 max-w-6xl mx-auto w-full">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div
              className="text-xs uppercase tracking-widest mb-1"
              style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-gold)', letterSpacing: '0.15em' }}
            >
              Active runs
            </div>
            <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--km-ink)', letterSpacing: '-0.02em' }}>
              Group buys
            </h2>
          </div>
          <Link
            to="/group-buys"
            className="text-xs uppercase tracking-widest transition-colors hover:opacity-80"
            style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', letterSpacing: '0.1em' }}
          >
            All group buys →
          </Link>
        </div>

        {gbLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--km-ink-mute)' }} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {featured.map(gb => (
              <GroupBuyCard key={gb.id} gb={toFeaturedCard(gb)} variant="featured" />
            ))}
          </div>
        )}

        {/* Stats strip */}
        <div
          className="mt-12 grid grid-cols-4 gap-8 p-7 rounded border"
          style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)' }}
        >
          {STATS.map(([value, label]) => (
            <div key={label}>
              <div
                className="text-3xl font-semibold"
                style={{ fontFamily: 'var(--km-font-body)', letterSpacing: '-0.03em', color: 'var(--km-ink)' }}
              >
                {value}
              </div>
              <div
                className="mt-1 text-xs uppercase tracking-widest"
                style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', letterSpacing: '0.12em' }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
