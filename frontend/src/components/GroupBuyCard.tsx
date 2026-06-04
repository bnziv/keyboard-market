import { Link } from 'react-router-dom';
import { GroupBuyImage } from '@/components/GroupBuyImage';
import { Badge, STAGE_BADGE_META } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export interface CardGroupBuy {
  id: string;
  name: string;
  designer: string;
  category: string;
  stage: 'IC' | 'GB' | 'closed';
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
  items: { name: string; price: number; currency: string; imageUrl?: string }[];
}

type GroupBuyCardVariant = 'card' | 'featured';

type GroupBuyCardProps =
  | { loading: true; variant?: GroupBuyCardVariant; onOpen?: () => void; gb?: never }
  | { loading?: false; gb: CardGroupBuy; variant?: GroupBuyCardVariant; onOpen?: () => void };

export function GroupBuyCard({
  gb,
  variant = 'card',
  onOpen,
  loading,
}: GroupBuyCardProps) {
  if (loading) {
    if (variant === 'featured') {
      return (
        <div className="rounded border overflow-hidden bg-km-surface border-km-line animate-pulse">
          <Skeleton variant="rectangular" sx={{ width: '100%', aspectRatio: '4/3', height: 'auto', borderRadius: 0, border: '1px solid var(--km-line)' }} />
          <div className="px-4 py-3 border-t border-km-line">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" sx={{ fontSize: '0.875rem', lineHeight: '1.25rem', width: 112 }} />
              <Skeleton variant="text" sx={{ fontSize: '1rem', lineHeight: '1.5rem', width: 40 }} />
            </div>
            <Skeleton variant="text" sx={{ fontSize: '0.75rem', lineHeight: '1rem', width: 80, mt: '4px' }} />
          </div>
        </div>
      );
    }

    return (
      <div className="bg-km-surface border border-km-line rounded-[6px] overflow-hidden flex flex-col animate-pulse">
        <Skeleton variant="rectangular" sx={{ width: '100%', aspectRatio: '16/10', height: 'auto', borderRadius: 0, bgcolor: 'var(--km-bg-sub)' }} />
        <div className="px-5 pt-[18px] pb-5 flex flex-col flex-1">
          <Skeleton variant="text" sx={{ fontSize: '10px', lineHeight: 1.2, width: 96 }} />
          <Skeleton variant="text" sx={{ fontSize: '19px', lineHeight: 1.25, width: 160, mt: '4px' }} />
          <div className="mt-2 mb-4 flex-1 flex flex-col gap-1.5">
            <Skeleton variant="text" sx={{ fontSize: '13px', lineHeight: 1.5 }} />
            <Skeleton variant="text" sx={{ fontSize: '13px', lineHeight: 1.5, width: '75%' }} />
            <Skeleton variant="text" sx={{ fontSize: '13px', lineHeight: 1.5, width: '83%' }} />
          </div>
          <div className="flex items-end justify-between mt-auto gap-3.5">
            <div>
              <Skeleton variant="text" sx={{ fontSize: '9px', lineHeight: 1.2, width: 56, mb: '2px' }} />
              <Skeleton variant="text" sx={{ fontSize: '22px', lineHeight: 1.2, width: 64 }} />
            </div>
            <div className="flex flex-col items-end">
              <Skeleton variant="text" sx={{ fontSize: '9px', lineHeight: 1.2, width: 56, mb: '2px' }} />
              <Skeleton variant="text" sx={{ fontSize: '0.875rem', lineHeight: '1.25rem', width: 56 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const meta = STAGE_BADGE_META[gb.stage];

  if (variant === 'featured') {
    return (
      <Link
        to={`/group-buys/${gb.id}`}
        className="block rounded border overflow-hidden transition-all duration-150 bg-km-surface border-km-line hover:border-km-ink hover:-translate-y-0.5 no-underline"
      >
        <div
          className="relative"
          style={{ aspectRatio: '4/3', overflow: 'hidden' }}
        >
          <GroupBuyImage category={gb.category} imageUrl={gb.imageUrl} />
          <div className="absolute top-2.5 left-2.5">
            <Badge variant={meta.tone}>{meta.label}</Badge>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-km-line">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm text-km-ink">
              {gb.name ?? '—'}
            </div>
            <div className="font-semibold font-km-mono text-km-gold">
              {gb.price ? `$${gb.price}` : '—'}
            </div>
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
      <div
        style={{
          aspectRatio: '16/10',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <GroupBuyImage category={gb.category} imageUrl={gb.imageUrl} />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <Badge variant={meta.tone}>{meta.label}</Badge>
          {gb.closingSoon && <Badge variant="accent">⏱ {gb.closes} left</Badge>}
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

        <p className="mt-2 mb-4 text-[13px] text-km-ink-dim leading-[1.5] flex-1 line-clamp-3">
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
            <div
              className={`font-km-mono text-sm font-semibold ${gb.closingSoon ? 'text-km-gold' : 'text-km-ink'}`}
            >
              {gb.closes}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
