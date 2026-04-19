import { Link } from "react-router-dom"
import { Heart } from "lucide-react"

export interface ListingCardProps {
  id: string
  title: string
  price: number
  offers: boolean
  condition: string
  imageUrl?: string
}

export default function ListingCard({ id, title, price, offers, condition, imageUrl }: ListingCardProps) {
  return (
    <Link
      to={`/listings/${id}`}
      className="group block rounded border overflow-hidden transition-all duration-150"
      style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--km-ink)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--km-line)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Image */}
      <div
        className="relative"
        style={{
          aspectRatio: '4/3',
          background: 'var(--km-bg-sub)',
          backgroundImage: 'repeating-linear-gradient(-20deg, rgba(212,178,76,0.07) 0, rgba(212,178,76,0.07) 1px, transparent 0, transparent 50%)',
          backgroundSize: '8px 8px',
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div
            className="absolute inset-0 flex items-end justify-end p-2 text-xs"
            style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', fontSize: '9px' }}
          >
            [ photo ]
          </div>
        )}
        {/* Wishlist button */}
        <button
          className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full"
          style={{
            background: 'rgba(10,13,31,0.7)',
            color: 'var(--km-ink-mute)',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={e => e.preventDefault()}
        >
          <Heart size={12} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <div
          className="text-xs uppercase tracking-wide mb-1.5"
          style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', letterSpacing: '0.1em', fontSize: '10px' }}
        >
          {condition}
        </div>
        <div
          className="text-sm font-medium leading-tight mb-2 truncate"
          style={{ color: 'var(--km-ink)' }}
        >
          {title}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink)' }}
            >
              {price ? `$${parseFloat(price.toFixed(2))}` : 'Open to Offers'}
            </span>
            {offers && price > 0 && (
              <span
                className="ml-1 text-xs"
                style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-gold)', fontSize: '9px' }}
              >
                OBO
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
