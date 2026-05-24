import NavBar from "@/components/NavBar";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/utils/AuthProvider";
import { useToast } from "@/utils/ToastProvider";
import { ArrowRight } from "lucide-react";

const STATS = [
  ['2,847', 'Active listings'],
  ['18,204', 'Verified members'],
  ['$1.4M', 'Traded last 30d'],
  ['99.2%', 'Ship-on-time rate'],
] as const;

const FEATURED = [
  { title: 'Mode Sonnet — Hibiscus', category: 'Keyboard', price: 540, condition: 'Like New', layout: '65%', seller: 'caelix' },
  { title: 'GMK Olivia++ R2', category: 'Keycaps', price: 165, condition: 'New', seller: 'morii' },
  { title: 'Neo80 R2 — E-White', category: 'Keyboard', price: 890, condition: 'Like New', layout: 'TKL', seller: 'phoss' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showInfo } = useToast();

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

          {/* Hero listing card */}
          <div
            className="rounded-lg overflow-hidden border"
            style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)' }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{
                aspectRatio: '4/3',
                background: 'var(--km-bg-sub)',
                backgroundImage: 'repeating-linear-gradient(-20deg, rgba(212,178,76,0.07) 0, rgba(212,178,76,0.07) 1px, transparent 0, transparent 50%)',
                backgroundSize: '8px 8px',
              }}
            >
              <div
                className="text-xs tracking-widest uppercase"
                style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)' }}
              >
                [ photo ]
              </div>
              <div
                className="absolute top-3 left-3 px-2 py-0.5 text-xs font-medium rounded border"
                style={{
                  fontFamily: 'var(--km-font-mono)',
                  background: 'var(--km-gold-soft)',
                  borderColor: 'var(--km-gold)',
                  color: 'var(--km-gold)',
                  letterSpacing: '0.05em',
                }}
              >
                FEATURED
              </div>
            </div>
            <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--km-line)' }}>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm" style={{ color: 'var(--km-ink)' }}>
                  Mode Sonnet · Hibiscus
                </div>
                <div className="font-semibold" style={{ color: 'var(--km-gold)', fontFamily: 'var(--km-font-mono)' }}>$540</div>
              </div>
              <div className="mt-1 text-xs" style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>
                caelix · 98 rep · listed 2m ago
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured listings */}
      <div className="px-8 py-10 max-w-6xl mx-auto w-full">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div
              className="text-xs uppercase tracking-widest mb-1"
              style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-gold)', letterSpacing: '0.15em' }}
            >
              Hand-picked
            </div>
            <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--km-ink)', letterSpacing: '-0.02em' }}>
              Featured boards
            </h2>
          </div>
          <Link
            to="/listings"
            className="text-xs uppercase tracking-widest transition-colors hover:opacity-80"
            style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', letterSpacing: '0.1em' }}
          >
            All featured →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {FEATURED.map((item, i) => (
            <Link
              to="/listings"
              key={i}
              className="block rounded border overflow-hidden transition-all hover:-translate-y-0.5 group"
              style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--km-ink)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--km-line)')}
            >
              <div
                className="relative flex items-center justify-center"
                style={{
                  aspectRatio: '4/3',
                  background: 'var(--km-bg-sub)',
                  backgroundImage: 'repeating-linear-gradient(-20deg, rgba(212,178,76,0.07) 0, rgba(212,178,76,0.07) 1px, transparent 0, transparent 50%)',
                  backgroundSize: '8px 8px',
                }}
              >
                <div className="text-xs" style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)' }}>
                  [ photo ]
                </div>
                <div
                  className="absolute top-2.5 left-2.5 px-2 py-0.5 text-xs rounded border"
                  style={{
                    fontFamily: 'var(--km-font-mono)',
                    background: 'var(--km-gold-soft)',
                    borderColor: 'var(--km-gold)',
                    color: 'var(--km-gold)',
                    fontSize: '10px',
                    letterSpacing: '0.05em',
                  }}
                >
                  Featured
                </div>
              </div>
              <div className="p-4">
                <div className="flex gap-2 flex-wrap mb-2.5">
                  {[item.category, item.condition, item.layout].filter(Boolean).map((tag, j) => (
                    <span
                      key={j}
                      className="px-2 py-0.5 text-xs rounded border"
                      style={{
                        fontFamily: 'var(--km-font-mono)',
                        background: 'var(--km-surface-2)',
                        borderColor: 'var(--km-line)',
                        color: 'var(--km-ink-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '10px',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="font-semibold text-sm leading-tight" style={{ color: 'var(--km-ink)' }}>
                  {item.title}
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="font-semibold text-lg" style={{ color: 'var(--km-ink)', fontFamily: 'var(--km-font-mono)' }}>
                    ${item.price}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>
                    @{item.seller}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

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
