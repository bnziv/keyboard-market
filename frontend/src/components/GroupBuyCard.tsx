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
  const meta = STAGE_BADGE_META[gb.stage];

  if (variant === 'featured') {
    return (
      <Link
        to="/group-buys"
        className="block rounded border overflow-hidden transition-all duration-150 bg-km-surface border-km-line hover:border-km-ink hover:-translate-y-0.5 no-underline"
      >
        <div className="relative" style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
          <GroupBuyImage category={gb.category} imageUrl={gb.imageUrl} />
          <div className="absolute top-2.5 left-2.5">
            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-km-line">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm text-km-ink">{gb.name ?? '—'}</div>
            <div className="font-semibold font-km-mono text-km-gold">{gb.price ? `$${gb.price}` : '—'}</div>
          </div>
          <div className="mt-1 text-xs font-km-mono text-km-ink-mute">
            {gb ? `by ${gb.designer}` : '—'}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div
      onClick={onOpen}
      className="bg-km-surface border border-km-line hover:border-km-ink rounded-[6px] overflow-hidden cursor-pointer flex flex-col transition-colors duration-150"
    >
      {/* Image */}
      <div style={{ aspectRatio: '16/10', position: 'relative', overflow: 'hidden' }}>
        <GroupBuyImage category={gb.category} imageUrl={gb.imageUrl} />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
          {gb.closingSoon && <StatusBadge tone="accent">⏱ {gb.closes} left</StatusBadge>}
        </div>
        <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/65 text-white rounded font-km-mono text-[11px] tracking-[0.05em]">
          {gb.eta}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-[18px] pb-5 flex flex-col flex-1">
        <div className="font-km-mono text-[10px] text-km-ink-mute tracking-[0.1em] uppercase">
          {gb.category} · by {gb.designer}
        </div>

        <div className="font-km-body text-[19px] font-semibold text-km-ink mt-1 leading-tight tracking-[-0.02em]">
          {gb.name}
        </div>

        <p className="mt-2 mb-4 text-[13px] text-km-ink-dim leading-[1.5] flex-1">
          {gb.desc || 'No description available.'}
        </p>

        {/* Price + countdown */}
        <div className="flex items-end justify-between mt-auto gap-3.5">
          <div>
            <div className="font-km-mono text-[9px] text-km-ink-mute tracking-[0.15em] uppercase mb-0.5">
              Base price
            </div>
            <div className="font-km-body text-[22px] font-bold text-km-ink tracking-[-0.02em]">
              {gb.price > 0 ? `$${gb.price}` : '—'}
            </div>
          </div>

          <div className="text-right">
            <div className="font-km-mono text-[9px] text-km-ink-mute tracking-[0.15em] uppercase mb-0.5">
              {gb.stage === 'closed' ? 'Status' : 'Closes in'}
            </div>
            <div className={`font-km-mono text-sm font-semibold ${gb.closingSoon ? 'text-km-gold' : 'text-km-ink'}`}>
              {gb.closes}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
