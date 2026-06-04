import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface ListingData {
  id: string;
  title: string;
  price: number;
  offers: boolean;
  condition: string;
  imageUrl?: string;
}

export type ListingCardProps = { loading: true } | ({ loading?: false } & ListingData);

export default function ListingCard(props: ListingCardProps) {
  if (props.loading) {
    return (
      <div className="rounded border overflow-hidden bg-km-surface border-km-line animate-pulse">
        <Skeleton variant="rectangular" sx={{ width: '100%', aspectRatio: '4/3', height: 'auto', borderRadius: 0, bgcolor: 'var(--km-bg-sub)' }} />
        <div className="p-3">
          {/* text-[10px], lineHeight ~1.2 → 12px, mb-1.5 */}
          <Skeleton variant="text" sx={{ fontSize: '10px', lineHeight: 1.2, width: 64, mb: '6px' }} />
          {/* text-sm leading-tight → 14px / 1.25 → 17.5px, mb-2 */}
          <Skeleton variant="text" sx={{ fontSize: '0.875rem', lineHeight: 1.25, width: '75%', mb: '8px' }} />
          {/* text-sm → 14px / 1.25rem → 20px */}
          <Skeleton variant="text" sx={{ fontSize: '0.875rem', lineHeight: '1.25rem', width: 80 }} />
        </div>
      </div>
    );
  }

  const { id, title, price, offers, condition, imageUrl } = props;

  return (
    <Link
      to={`/listings/${id}`}
      className="group block rounded border overflow-hidden transition-all duration-150 bg-km-surface border-km-line hover:border-km-ink hover:-translate-y-0.5"
    >
      {/* Image */}
      <div
        className="relative bg-km-bg-sub"
        style={{
          aspectRatio: '4/3',
          backgroundImage:
            'repeating-linear-gradient(-20deg, rgba(212,178,76,0.07) 0, rgba(212,178,76,0.07) 1px, transparent 0, transparent 50%)',
          backgroundSize: '8px 8px',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-end justify-end p-2 font-km-mono text-[9px] text-km-ink-mute">
            [ photo ]
          </div>
        )}
        {/* Wishlist button */}
        <button
          className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full bg-black/70 text-white border-none cursor-pointer"
          onClick={(e) => e.preventDefault()}
        >
          <Heart size={12} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="font-km-mono text-[10px] text-km-ink-mute uppercase tracking-[0.1em] mb-1.5">
          {condition}
        </div>
        <div className="text-sm font-medium leading-tight mb-2 truncate text-km-ink">
          {title}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-km-mono text-sm font-semibold text-km-ink">
              {price ? `$${(price / 100).toFixed(2)}` : 'Open to Offers'}
            </span>
            {offers && price > 0 && (
              <span className="ml-1 font-km-mono text-[9px] text-km-gold">
                OBO
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
