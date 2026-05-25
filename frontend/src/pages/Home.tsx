import { useState, useEffect } from 'react';
import NavBar from "@/components/NavBar";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/utils/AuthProvider";
import { useToast } from "@/utils/ToastProvider";
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

const STAGE_META: Record<string, { label: string; bg: string; fg: string; border: string }> = {
  GB:       { label: 'Live',           bg: 'color-mix(in srgb, var(--km-ok) 20%, var(--km-surface))', fg: 'var(--km-ok)',   border: 'var(--km-ok)' },
  IC:       { label: 'Interest check', bg: 'var(--km-surface-2)', fg: 'var(--km-ink-dim)', border: 'var(--km-line)' },
  shipping: { label: 'Shipping',       bg: 'var(--km-gold-soft)',  fg: 'var(--km-gold)',    border: 'var(--km-gold)' },
};

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  keyboard:    ['#1e2a5e', '#3d5af1'],
  keycaps:     ['#3b1f5c', '#8b5cf6'],
  switches:    ['#1a3a2e', '#22c55e'],
  accessories: ['#3a2a1a', '#f59e0b'],
};

function stagePriority(status: string): number {
  if (status === 'GB') return 0;
  if (status === 'IC') return 1;
  if (status === 'shipping') return 2;
  return 3;
}

function GbImage({ type, images }: { type: string; images: string[] }) {
  const imageUrl = images?.[0] ?? null;
  const [bg, fg] = CATEGORY_GRADIENTS[type?.toLowerCase()] ?? ['#1c1c2e', '#6366f1'];

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={type}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
        width: 48, height: 48,
        border: '1.5px solid rgba(255,255,255,0.15)',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--km-font-mono)', fontSize: 9,
        color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        {type?.slice(0, 3) ?? '—'}
      </div>
    </div>
  );
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
  const heroMeta = heroGb ? (STAGE_META[heroGb.status] ?? STAGE_META.IC) : null;

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
          <div
            className="rounded-lg overflow-hidden border"
            style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)' }}
          >
            <div className="relative" style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
              {heroGb ? (
                <GbImage type={heroGb.type} images={heroGb.images} />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  background: 'var(--km-bg-sub)',
                  backgroundImage: 'repeating-linear-gradient(-20deg, rgba(212,178,76,0.07) 0, rgba(212,178,76,0.07) 1px, transparent 0, transparent 50%)',
                  backgroundSize: '8px 8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div className="text-xs tracking-widest uppercase" style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)' }}>
                    [ loading ]
                  </div>
                </div>
              )}
              {heroMeta && (
                <div
                  className="absolute top-3 left-3 px-2 py-0.5 rounded border"
                  style={{
                    fontFamily: 'var(--km-font-mono)',
                    background: heroMeta.bg,
                    borderColor: heroMeta.border,
                    color: heroMeta.fg,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    fontSize: 10,
                  }}
                >
                  {heroMeta.label}
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--km-line)' }}>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm" style={{ color: 'var(--km-ink)' }}>
                  {heroGb?.name ?? '—'}
                </div>
                <div className="font-semibold" style={{ color: 'var(--km-gold)', fontFamily: 'var(--km-font-mono)' }}>
                  {heroGb?.basePrice?.amount ? `$${heroGb.basePrice.amount}` : '—'}
                </div>
              </div>
              <div className="mt-1 text-xs" style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>
                {heroGb ? `by @${heroGb.designer}` : '—'}
              </div>
            </div>
          </div>
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
            {featured.map((gb) => {
              const meta = STAGE_META[gb.status] ?? STAGE_META.IC;
              const category = gb.type ? gb.type.charAt(0).toUpperCase() + gb.type.slice(1) : 'Keyboard';
              return (
                <Link
                  to="/group-buys"
                  key={gb.id}
                  className="block rounded border overflow-hidden transition-all hover:-translate-y-0.5"
                  style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--km-ink)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--km-line)')}
                >
                  <div className="relative" style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                    <GbImage type={gb.type} images={gb.images} />
                    <div
                      className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded border"
                      style={{
                        fontFamily: 'var(--km-font-mono)',
                        background: meta.bg,
                        borderColor: meta.border,
                        color: meta.fg,
                        fontSize: 10,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {meta.label}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex gap-2 flex-wrap mb-2.5">
                      <span
                        className="px-2 py-0.5 rounded border"
                        style={{
                          fontFamily: 'var(--km-font-mono)',
                          background: 'var(--km-surface-2)',
                          borderColor: 'var(--km-line)',
                          color: 'var(--km-ink-dim)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontSize: 10,
                        }}
                      >
                        {category}
                      </span>
                    </div>
                    <div className="font-semibold text-sm leading-tight" style={{ color: 'var(--km-ink)' }}>
                      {gb.name}
                    </div>
                    <div className="flex items-baseline justify-between mt-3">
                      <span className="font-semibold text-lg" style={{ color: 'var(--km-ink)', fontFamily: 'var(--km-font-mono)' }}>
                        {gb.basePrice?.amount ? `$${gb.basePrice.amount}` : '—'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>
                        @{gb.designer}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
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
