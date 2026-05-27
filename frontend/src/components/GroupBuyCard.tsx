import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GroupBuyImage } from '@/components/GroupBuyImage';
import { StatusBadge } from '@/components/StatusBadge';
import { BadgeTone } from '@/utils/badgeTones';

export interface CardGroupBuy {
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

const STAGE_BADGE_META: Record<CardGroupBuy['stage'], { label: string; tone: BadgeTone }> = {
  interest: { label: 'Interest check', tone: 'neutral' },
  live:     { label: 'Live',           tone: 'ok' },
  closed:   { label: 'In production',  tone: 'accent' },
  shipping: { label: 'Shipping',       tone: 'accent' },
};

type GroupBuyCardVariant = 'card' | 'featured';

interface GroupBuyCardProps {
  gb: CardGroupBuy;
  variant?: GroupBuyCardVariant;
  onOpen?: () => void;
}

export function GroupBuyCard({ gb, variant = 'card', onOpen }: GroupBuyCardProps) {
  const [hovered, setHovered] = useState(false);
  const meta = STAGE_BADGE_META[gb.stage];

  if (variant === 'featured') {
    return (
      <Link
        to="/group-buys"
        className="block rounded border overflow-hidden"
        style={{
          background: 'var(--km-surface)',
          borderColor: hovered ? 'var(--km-ink)' : 'var(--km-line)',
          transition: 'border-color 150ms ease, transform 150ms ease',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          textDecoration: 'none',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative" style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
          <GroupBuyImage category={gb.category} imageUrl={gb.imageUrl} />
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
          </div>
        </div>
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--km-line)'}}>
          <div className="flex items-center justify-between">
                <div className="font-semibold text-sm" style={{ color: 'var(--km-ink)' }}>
                  {gb.name ?? '—'}
                </div>
                <div className="font-semibold" style={{ color: 'var(--km-gold)', fontFamily: 'var(--km-font-mono)' }}>
                  {gb.price ? `$${gb.price}` : '—'}
                </div>
              </div>
              <div className="mt-1 text-xs" style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>
                {gb ? `by ${gb.designer}` : '—'}
              </div>
        </div>
      </Link>
    );
  }

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
          {gb.category} · by {gb.designer}
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
      </div>
    </div>
  );
}
