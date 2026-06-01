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
      className="group block rounded border overflow-hidden transition-all duration-150 bg-km-surface border-km-line hover:border-km-ink hover:-translate-y-0.5"
    >
      {/* Image */}
      <div
        className="relative bg-km-bg-sub"
        style={{
          aspectRatio: '4/3',
          backgroundImage: 'repeating-linear-gradient(-20deg, rgba(212,178,76,0.07) 0, rgba(212,178,76,0.07) 1px, transparent 0, transparent 50%)',
          backgroundSize: '8px 8px',
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-end justify-end p-2 font-km-mono text-[9px] text-km-ink-mute">
            [ photo ]
          </div>
        )}
        {/* Wishlist button */}
        <button
          className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full bg-black/70 text-white border-none cursor-pointer"
          onClick={e => e.preventDefault()}
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
              <span className="ml-1 font-km-mono text-[9px] text-km-gold">OBO</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
