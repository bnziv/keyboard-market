import { useState, useEffect, useRef } from "react"
import NavBar from "@/components/NavBar"
import ListingCard, { ListingCardProps } from "@/components/ListingCard"
import { MessageCircle, Plus } from "lucide-react"
import { useNavigate, useParams, Link } from "react-router-dom"
import axios from "axios"
import API_URL from "@/utils/config"
import { useChat } from "@/utils/ChatProvider"
import { useAuth } from "@/utils/AuthProvider"
import { useToast } from "@/utils/ToastProvider"
import { formatDate } from "@/utils/helpers"

interface UserProps {
  id: string
  username: string
  dateJoined: string
  totalListings: number
  rating: number
  reviewCount: number
  favoriteCount: number
}

const CHART_DATA = [
  { month: 'Nov', h: 40 }, { month: 'Dec', h: 70 }, { month: 'Jan', h: 55 },
  { month: 'Feb', h: 92 }, { month: 'Mar', h: 48 }, { month: 'Apr', h: 85 },
]

export default function Profile() {
  const params = useParams()
  const username = params.username
  const [tab, setTab] = useState('listings')
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserProps>({} as UserProps)
  const [userListings, setUserListings] = useState<ListingCardProps[]>([])
  const { user, isAuthenticated } = useAuth()
  const { startChat } = useChat()
  const { showError, showInfo } = useToast()
  const isMounted = useRef(false)
  const navigate = useNavigate()
  const isOwnProfile = user?.username === username

  useEffect(() => {
    setLoading(true)
    Promise.all([
      axios.get(`${API_URL}/api/users/profile/${username}`),
      axios.get(`${API_URL}/api/listings/username/${username}`),
    ])
      .then(([userRes, listingsRes]) => {
        setUserData(userRes.data)
        setUserListings(listingsRes.data)
      })
      .catch(() => {
        if (!isMounted.current) showError('Profile not found')
        isMounted.current = true
        navigate('/listings')
      })
      .finally(() => setLoading(false))
  }, [username])

  const handleMessage = () => {
    if (!isAuthenticated) { showError('Please login to start a chat'); return }
    if (user?.id === userData.id) { showInfo('This is your own profile'); return }
    startChat(userData.id, userData.username)
  }

  const initial = (userData.username?.[0] ?? '?').toUpperCase()

  const STATS = [
    [String(userData.totalListings ?? 0), 'Active listings'],
    [String(userData.reviewCount ?? 0), 'Reviews'],
    [String(userData.rating ?? '—'), 'Avg. rating'],
    ['99%', 'On-time ship'],
    ['0', 'Disputes'],
  ]

  const TABS = [
    { id: 'listings', label: 'Listings', count: userListings.length },
    { id: 'reviews', label: 'Reviews', count: userData.reviewCount ?? 0 },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--km-bg)' }}>
        <NavBar activePage="profile" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm" style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>Loading profile…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--km-bg)', color: 'var(--km-ink)' }}>
      <NavBar activePage="profile" />

      {/* Banner */}
      <div className="border-b px-8 pt-9 pb-0" style={{ background: 'var(--km-bg-sub)', borderColor: 'var(--km-line)' }}>
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div
            className="text-xs mb-5"
            style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)' }}
          >
            <Link to="/" className="hover:opacity-80" style={{ color: 'var(--km-ink-mute)' }}>← Home</Link>
            <span className="mx-1.5">/</span>
            <span>profiles</span>
            <span className="mx-1.5">/</span>
            <span style={{ color: 'var(--km-ink)' }}>@{userData.username}</span>
          </div>

          {/* Profile header */}
          <div className="flex items-end gap-6">
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-semibold flex-shrink-0 border"
              style={{
                background: 'var(--km-gold-soft)',
                borderColor: 'rgba(184,146,42,0.33)',
                color: 'var(--km-gold)',
                fontFamily: 'var(--km-font-mono)',
              }}
            >
              {initial}
            </div>

            {/* Info */}
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-3 mb-2">
                <h1
                  className="text-3xl font-semibold tracking-tight"
                  style={{ letterSpacing: '-0.02em', color: 'var(--km-ink)' }}
                >
                  @{userData.username}
                </h1>
                <span
                  className="px-2 py-0.5 text-xs rounded border"
                  style={{
                    fontFamily: 'var(--km-font-mono)',
                    background: 'var(--km-gold-soft)',
                    borderColor: 'var(--km-gold)',
                    color: 'var(--km-gold)',
                    fontSize: '10px',
                    letterSpacing: '0.05em',
                  }}
                >
                  VERIFIED
                </span>
              </div>
              <div
                className="flex gap-4 text-xs"
                style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-dim)' }}
              >
                <span>Joined {userData.dateJoined ? formatDate(userData.dateJoined) : '—'}</span>
                <span style={{ color: 'var(--km-line-strong)' }}>·</span>
                <span>{userData.totalListings ?? 0} listings</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pb-1">
              {!isOwnProfile && (
                <button
                  onClick={handleMessage}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded transition-opacity hover:opacity-90"
                  style={{
                    background: 'var(--km-ink)',
                    color: 'var(--km-bg)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--km-font-body)',
                  }}
                >
                  <MessageCircle size={14} /> Message
                </button>
              )}
              {isOwnProfile && (
                <Link
                  to="/create-listing"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded transition-opacity hover:opacity-90"
                  style={{
                    background: 'var(--km-gold)',
                    color: 'var(--km-bg)',
                    fontFamily: 'var(--km-font-body)',
                  }}
                >
                  <Plus size={14} /> New listing
                </Link>
              )}
              {!isOwnProfile && (
                <button
                  className="px-4 py-2 text-sm rounded border transition-colors hover:opacity-80"
                  style={{
                    background: 'transparent',
                    color: 'var(--km-ink-dim)',
                    borderColor: 'var(--km-line-strong)',
                    cursor: 'pointer',
                    fontFamily: 'var(--km-font-body)',
                  }}
                >
                  Follow
                </button>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div
            className="grid mt-7 border-t border-b"
            style={{
              gridTemplateColumns: `repeat(${STATS.length}, 1fr)`,
              borderColor: 'var(--km-line)',
            }}
          >
            {STATS.map(([value, label], i) => (
              <div
                key={label}
                className="py-4 px-5"
                style={{
                  borderRight: i < STATS.length - 1 ? '1px solid var(--km-line)' : 'none',
                }}
              >
                <div
                  className="text-2xl font-semibold"
                  style={{ fontFamily: 'var(--km-font-body)', letterSpacing: '-0.02em', color: 'var(--km-ink)' }}
                >
                  {value}
                </div>
                <div
                  className="mt-0.5 text-xs uppercase tracking-widest"
                  style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', letterSpacing: '0.12em', fontSize: '10px' }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: tab === t.id ? 600 : 400,
                  color: tab === t.id ? 'var(--km-ink)' : 'var(--km-ink-dim)',
                  borderBottom: tab === t.id ? '2px solid var(--km-gold)' : '2px solid transparent',
                  marginBottom: '-1px',
                  fontFamily: 'var(--km-font-body)',
                }}
              >
                {t.label}
                <span
                  className="text-xs"
                  style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', fontSize: '10px' }}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto w-full px-8 py-8 pb-16">
        {tab === 'listings' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div
                className="text-xs"
                style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-dim)' }}
              >
                {userListings.length} active listing{userListings.length !== 1 ? 's' : ''}
              </div>
              {isOwnProfile && (
                <Link
                  to="/create-listing"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-opacity hover:opacity-90"
                  style={{
                    background: 'var(--km-ink)',
                    color: 'var(--km-bg)',
                    fontFamily: 'var(--km-font-body)',
                  }}
                >
                  <Plus size={12} /> New listing
                </Link>
              )}
            </div>

            {userListings.length === 0 && !isOwnProfile ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="text-4xl" style={{ color: 'var(--km-line-strong)' }}>◆</div>
                <div className="text-sm" style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>
                  No active listings.
                </div>
              </div>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {userListings.map(listing => (
                  <ListingCard key={listing.id} {...listing} />
                ))}
                {isOwnProfile && (
                  <Link
                    to="/create-listing"
                    className="flex flex-col items-center justify-center gap-2.5 rounded border text-sm transition-colors hover:border-[var(--km-ink-mute)]"
                    style={{
                      minHeight: '200px',
                      aspectRatio: '4/3',
                      border: '1px dashed var(--km-line-strong)',
                      color: 'var(--km-ink-mute)',
                      fontFamily: 'var(--km-font-mono)',
                      fontSize: '11px',
                    }}
                  >
                    <Plus size={20} style={{ opacity: 0.5 }} />
                    List another item
                  </Link>
                )}
              </div>
            )}

            {/* Sales chart — own profile only */}
            {isOwnProfile && (
              <div
                className="mt-10 p-6 rounded border"
                style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)' }}
              >
                <div className="flex items-baseline justify-between mb-5">
                  <div>
                    <div
                      className="text-xs uppercase tracking-widest mb-1"
                      style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-gold)', letterSpacing: '0.15em', fontSize: '10px' }}
                    >
                      Last 6 months
                    </div>
                    <div
                      className="text-xl font-semibold"
                      style={{ color: 'var(--km-ink)', letterSpacing: '-0.02em' }}
                    >
                      Sales activity
                    </div>
                  </div>
                  <div
                    className="flex gap-5 text-xs"
                    style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-dim)' }}
                  >
                    <span><span style={{ color: 'var(--km-ink-mute)' }}>Total: </span><strong style={{ color: 'var(--km-ink)' }}>—</strong></span>
                    <span><span style={{ color: 'var(--km-ink-mute)' }}>Items: </span><strong style={{ color: 'var(--km-ink)' }}>{userData.totalListings ?? 0}</strong></span>
                  </div>
                </div>
                {/* Bar chart */}
                <div
                  className="grid gap-3.5 items-end"
                  style={{ gridTemplateColumns: 'repeat(6, 1fr)', height: '120px' }}
                >
                  {CHART_DATA.map((d, i) => (
                    <div key={d.month} className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-full rounded-sm transition-all"
                        style={{
                          height: `${d.h}%`,
                          background: i === 3 ? 'var(--km-gold)' : 'var(--km-line-strong)',
                          minHeight: '4px',
                        }}
                      />
                      <div
                        className="text-xs"
                        style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', fontSize: '10px' }}
                      >
                        {d.month}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div
            className="rounded border p-6"
            style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)' }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--km-gold-soft)', color: 'var(--km-gold)' }}
              >
                ★
              </div>
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--km-ink)' }}>
                  {userData.rating ?? '—'} out of 5
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>
                  Based on {userData.reviewCount ?? 0} reviews
                </div>
              </div>
              <div className="flex gap-1 ml-auto text-lg" style={{ color: 'var(--km-gold)' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} style={{ opacity: star <= Math.round(userData.rating ?? 0) ? 1 : 0.2 }}>★</span>
                ))}
              </div>
            </div>
            <div
              className="border-t pt-4 text-sm text-center"
              style={{ borderColor: 'var(--km-line)', color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}
            >
              No reviews yet.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
