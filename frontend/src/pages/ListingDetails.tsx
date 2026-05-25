import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import NavBar from "@/components/NavBar"
import { MessageCircle, Heart, Share2, Shield } from "lucide-react"
import { useToast } from "@/utils/ToastProvider"
import { formatDate, titleCase } from "@/utils/helpers"
import { useAuth } from "@/utils/AuthProvider"
import { useChat } from '@/utils/ChatProvider'
import api from "@/utils/api"

interface Listing {
    id: string
    title: string
    price: number
    offers: boolean
    description: string
    condition: string
    imageUrl: string
    seller: {
        id: string
        username: string
        dateJoined: string
        totalListings: number
    }
    createdOn: string
}

const TABS = ['description', 'shipping', 'seller'] as const;
type Tab = typeof TABS[number];

export default function ListingDetailsPage() {
    const params = useParams()
    const id = params.id as string
    const { showInfo, showError } = useToast()
    const [listing, setListing] = useState<Listing>({} as Listing)
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<Tab>('description')
    const { user, isAuthenticated } = useAuth()
    const { startChat } = useChat()
    const navigate = useNavigate()
    const isMounted = useRef(false)

    useEffect(() => {
        api.get(`/api/listings/details/${id}`)
            .then(res => { setListing(res.data); setLoading(false); })
            .catch(() => {
                if (!isMounted.current) showError("Listing not found")
                isMounted.current = true
                setLoading(false)
                navigate("/listings")
            })
    }, [id])

    const handleContactSeller = () => {
        if (!isAuthenticated) { showError("Please login to contact the seller"); return }
        if (user?.id === listing.seller.id) { showInfo("This is your own listing"); return }
        startChat(listing.seller.id, listing.seller.username)
    }

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        showInfo("Link copied to clipboard")
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col" style={{ background: 'var(--km-bg)' }}>
                <NavBar activePage="listings" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-sm" style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>
                        Loading listing…
                    </div>
                </div>
            </div>
        )
    }

    const sellerInitial = (listing.seller?.username?.[0] ?? '?').toUpperCase()

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--km-bg)', color: 'var(--km-ink)' }}>
            <NavBar activePage="listings" />
            <main className="flex-1 max-w-6xl mx-auto w-full px-8 py-6 pb-16">
                {/* Breadcrumb */}
                <div
                    className="flex items-center gap-2 mb-5 text-xs"
                    style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)' }}
                >
                    <Link to="/listings" className="transition-colors hover:text-[var(--km-ink)]" style={{ color: 'var(--km-ink-mute)' }}>
                        ← Browse
                    </Link>
                    <span>/</span>
                    <span style={{ color: 'var(--km-ink)' }}>{listing.title}</span>
                </div>

                <div className="grid gap-10" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
                    {/* Left — image + tabs */}
                    <div>
                        {/* Main image */}
                        <div
                            className="rounded border overflow-hidden"
                            style={{
                                aspectRatio: '4/3',
                                background: 'var(--km-bg-sub)',
                                borderColor: 'var(--km-line)',
                                position: 'relative',
                            }}
                        >
                            {listing.imageUrl ? (
                                <>
                                    <div className="absolute inset-0 overflow-hidden">
                                        <img src={listing.imageUrl} className="object-cover blur-md scale-110 opacity-30 w-full h-full" />
                                    </div>
                                    <img src={listing.imageUrl} alt={listing.title} className="relative w-full h-full object-contain" />
                                </>
                            ) : (
                                <div
                                    className="absolute inset-0 flex items-center justify-center text-xs"
                                    style={{
                                        fontFamily: 'var(--km-font-mono)',
                                        color: 'var(--km-ink-mute)',
                                        backgroundImage: 'repeating-linear-gradient(-20deg, rgba(212,178,76,0.07) 0, rgba(212,178,76,0.07) 1px, transparent 0, transparent 50%)',
                                        backgroundSize: '8px 8px',
                                    }}
                                >
                                    [ no photo ]
                                </div>
                            )}
                        </div>

                        {/* Tabbed info panel */}
                        <div
                            className="mt-5 rounded border overflow-hidden"
                            style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)' }}
                        >
                            <div className="flex gap-5 px-5 pt-1 border-b" style={{ borderColor: 'var(--km-line)' }}>
                                {TABS.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTab(t)}
                                        className="py-3 text-xs font-medium transition-colors"
                                        style={{
                                            fontFamily: 'var(--km-font-mono)',
                                            letterSpacing: '0.1em',
                                            textTransform: 'uppercase',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: tab === t ? 'var(--km-ink)' : 'var(--km-ink-mute)',
                                            borderBottom: tab === t ? '2px solid var(--km-gold)' : '2px solid transparent',
                                            fontSize: '10px',
                                            fontWeight: tab === t ? 600 : 400,
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <div className="p-5">
                                {tab === 'description' && (
                                    <div
                                        className="text-sm leading-relaxed whitespace-pre-line"
                                        style={{ color: 'var(--km-ink-dim)', lineHeight: 1.65 }}
                                    >
                                        {listing.description || 'No description provided.'}
                                    </div>
                                )}
                                {tab === 'shipping' && (
                                    <div className="text-sm" style={{ color: 'var(--km-ink-dim)', lineHeight: 1.6 }}>
                                        <p>Shipping details provided by the seller. Contact them for specifics.</p>
                                    </div>
                                )}
                                {tab === 'seller' && (
                                    <div className="text-sm" style={{ color: 'var(--km-ink-dim)', lineHeight: 1.6 }}>
                                        <p>
                                            Member since {listing.seller.dateJoined ? formatDate(listing.seller.dateJoined) : 'N/A'} ·{' '}
                                            {listing.seller.totalListings} total listings.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right — purchase panel */}
                    <div className="flex flex-col gap-4" style={{ position: 'sticky', top: '72px', alignSelf: 'start' }}>
                        {/* Badges */}
                        <div className="flex gap-2 flex-wrap">
                            {[listing.condition && titleCase(listing.condition)].filter(Boolean).map((tag, i) => (
                                <span
                                    key={i}
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

                        {/* Title */}
                        <h1
                            className="text-3xl font-semibold leading-tight"
                            style={{ letterSpacing: '-0.02em', color: 'var(--km-ink)', lineHeight: 1.1 }}
                        >
                            {listing.title}
                        </h1>

                        <div
                            className="text-xs"
                            style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)' }}
                        >
                            {listing.createdOn ? `Listed ${formatDate(listing.createdOn)}` : ''}
                        </div>

                        {/* Price panel */}
                        <div
                            className="p-5 rounded border"
                            style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)' }}
                        >
                            <div className="mb-1 text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', fontSize: '10px', letterSpacing: '0.15em' }}>
                                ASK
                            </div>
                            <div
                                className="text-5xl font-semibold mb-1"
                                style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink)', letterSpacing: '-0.02em' }}
                            >
                                {listing.price ? `$${parseFloat(listing.price.toFixed(2))}` : 'Open to Offers'}
                            </div>
                            {listing.offers && listing.price > 0 && (
                                <div className="text-xs mb-4" style={{ color: 'var(--km-gold)', fontFamily: 'var(--km-font-mono)' }}>
                                    or best offer
                                </div>
                            )}

                            <div className="flex gap-2 mt-4">
                                <button
                                    className="flex-1 py-2.5 text-sm font-semibold rounded transition-opacity hover:opacity-90"
                                    style={{
                                        background: 'var(--km-ink)',
                                        color: 'var(--km-bg)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--km-font-body)',
                                    }}
                                >
                                    {listing.price ? `Buy for $${parseFloat(listing.price.toFixed(2))}` : 'Make an offer'}
                                </button>
                                {listing.offers && listing.price > 0 && (
                                    <button
                                        className="flex-1 py-2.5 text-sm font-medium rounded border transition-colors hover:border-white/40"
                                        style={{
                                            background: 'transparent',
                                            color: 'var(--km-ink-dim)',
                                            borderColor: 'var(--km-line-strong)',
                                            cursor: 'pointer',
                                            fontFamily: 'var(--km-font-body)',
                                        }}
                                    >
                                        Make an offer
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleContactSeller}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs rounded border transition-colors hover:border-white/30"
                                    style={{
                                        background: 'var(--km-surface-2)',
                                        color: 'var(--km-ink-dim)',
                                        borderColor: 'var(--km-line)',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--km-font-body)',
                                    }}
                                >
                                    <MessageCircle size={13} /> Message seller
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="w-9 flex items-center justify-center rounded border transition-colors hover:border-white/30"
                                    style={{
                                        background: 'var(--km-surface-2)',
                                        color: 'var(--km-ink-dim)',
                                        borderColor: 'var(--km-line)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Share2 size={13} />
                                </button>
                                <button
                                    className="w-9 flex items-center justify-center rounded border transition-colors hover:border-white/30"
                                    style={{
                                        background: 'var(--km-surface-2)',
                                        color: 'var(--km-ink-dim)',
                                        borderColor: 'var(--km-line)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Heart size={13} />
                                </button>
                            </div>
                        </div>

                        {/* Trust row */}
                        <div
                            className="flex items-center gap-3 p-4 rounded border"
                            style={{ background: 'var(--km-surface-2)', borderColor: 'var(--km-line)' }}
                        >
                            <Shield size={18} style={{ color: 'var(--km-gold)', flexShrink: 0 }} />
                            <div>
                                <div className="text-xs font-medium" style={{ color: 'var(--km-ink)' }}>Protected purchase</div>
                                <div className="text-xs mt-0.5" style={{ color: 'var(--km-ink-mute)' }}>
                                    Full refund if item is not as described
                                </div>
                            </div>
                        </div>

                        {/* Seller card */}
                        <div
                            className="p-4 rounded border"
                            style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)' }}
                        >
                            <div
                                className="text-xs uppercase tracking-widest mb-3"
                                style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', fontSize: '10px', letterSpacing: '0.15em' }}
                            >
                                Seller
                            </div>
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-11 h-11 flex items-center justify-center rounded-full text-sm font-semibold flex-shrink-0 border"
                                    style={{
                                        background: 'var(--km-gold-soft)',
                                        borderColor: 'rgba(212,178,76,0.33)',
                                        color: 'var(--km-gold)',
                                        fontFamily: 'var(--km-font-mono)',
                                    }}
                                >
                                    {sellerInitial}
                                </div>
                                <div className="flex-1">
                                    <Link
                                        to={`/profile/${listing.seller.username}`}
                                        className="font-semibold text-sm transition-colors hover:opacity-80"
                                        style={{ color: 'var(--km-ink)' }}
                                    >
                                        @{listing.seller.username}
                                    </Link>
                                    <div
                                        className="text-xs mt-0.5"
                                        style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)' }}
                                    >
                                        {listing.seller.totalListings} listings · joined {listing.seller.dateJoined ? formatDate(listing.seller.dateJoined) : 'N/A'}
                                    </div>
                                </div>
                                <Link
                                    to={`/profile/${listing.seller.username}`}
                                    className="text-xs uppercase tracking-wide transition-colors hover:opacity-80"
                                    style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-gold)', letterSpacing: '0.05em', fontSize: '10px' }}
                                >
                                    View →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
