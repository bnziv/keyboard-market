import { useState, useEffect, useRef } from "react"
import NavBar from "@/components/NavBar"
import ListingCard, { ListingCardProps } from "@/components/ListingCard"
import { Star, Package, MessageCircle } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
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

export default function Profile() {
  const params = useParams()
  const username = params.username
  const [activeTab, setActiveTab] = useState('listings')
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserProps>({} as UserProps)
  const [userListings, setUserListings] = useState<ListingCardProps[]>([])
  const { user, isAuthenticated } = useAuth()
  const { startChat } = useChat()
  const { showError, showInfo } = useToast()
  const isMounted = useRef(false)
  const navigate = useNavigate()

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

  const stats = [
    { value: String(userData.totalListings ?? 0), label: 'Listings' },
    { value: String(userData.rating ?? '—'), label: 'Rating' },
    { value: String(userData.reviewCount ?? 0), label: 'Reviews' },
    { value: String(userData.favoriteCount ?? 0), label: 'Favorites' },
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
      <main className="flex-1 max-w-6xl mx-auto w-full px-8 py-8 pb-16">
        <div className="grid gap-8" style={{ gridTemplateColumns: '280px 1fr' }}>
          {/* Sidebar */}
          <aside>
            <div
              className="rounded border p-6 flex flex-col items-center text-center"
              style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)' }}
            >
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold border mb-4"
                style={{
                  background: 'var(--km-gold-soft)',
                  borderColor: 'rgba(212,178,76,0.33)',
                  color: 'var(--km-gold)',
                  fontFamily: 'var(--km-font-mono)',
                }}
              >
                {initial}
              </div>

              <div className="font-bold text-lg" style={{ color: 'var(--km-ink)', letterSpacing: '-0.01em' }}>
                @{userData.username}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>
                Member since {userData.dateJoined ? formatDate(userData.dateJoined) : '—'}
              </div>

              {/* Stats grid */}
              <div className="w-full grid grid-cols-2 gap-3 mt-5">
                {stats.map(s => (
                  <div
                    key={s.label}
                    className="py-3 px-2 rounded border text-center"
                    style={{ background: 'var(--km-surface-2)', borderColor: 'var(--km-line)' }}
                  >
                    <div className="text-lg font-semibold" style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink)' }}>
                      {s.value}
                    </div>
                    <div className="text-xs mt-0.5 uppercase tracking-wide" style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', fontSize: '9px', letterSpacing: '0.1em' }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tab nav */}
              <div className="w-full mt-5 flex flex-col gap-1">
                {[
                  { id: 'listings', label: 'Listings', icon: Package },
                  { id: 'reviews', label: 'Reviews', icon: Star },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm text-left transition-colors"
                    style={{
                      background: activeTab === id ? 'var(--km-surface-2)' : 'transparent',
                      color: activeTab === id ? 'var(--km-ink)' : 'var(--km-ink-dim)',
                      border: activeTab === id ? '1px solid var(--km-line-strong)' : '1px solid transparent',
                      cursor: 'pointer',
                      fontFamily: 'var(--km-font-body)',
                      fontWeight: activeTab === id ? 500 : 400,
                    }}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>

              {/* Message button */}
              <button
                onClick={handleMessage}
                className="w-full mt-5 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded transition-opacity hover:opacity-90"
                style={{
                  background: 'var(--km-gold)',
                  color: 'var(--km-bg)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--km-font-body)',
                }}
              >
                <MessageCircle size={14} /> Message
              </button>
            </div>
          </aside>

          {/* Main */}
          <div>
            {activeTab === 'listings' && (
              <div>
                <div className="flex items-baseline gap-3 mb-5">
                  <div>
                    <div
                      className="text-xs uppercase tracking-widest mb-1"
                      style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-gold)', letterSpacing: '0.15em', fontSize: '11px' }}
                    >
                      Active
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--km-ink)', letterSpacing: '-0.02em' }}>
                      {userData.username}'s listings
                    </h2>
                  </div>
                </div>
                {userListings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="text-4xl" style={{ color: 'var(--km-line-strong)' }}>◆</div>
                    <div className="text-sm" style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>
                      No listings yet.
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                    {userListings.map(listing => (
                      <ListingCard key={listing.id} {...listing} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="mb-5">
                  <div className="text-xs uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-gold)', letterSpacing: '0.15em', fontSize: '11px' }}>
                    Feedback
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--km-ink)', letterSpacing: '-0.02em' }}>
                    {userData.username}'s reviews
                  </h2>
                </div>
                <div
                  className="rounded border p-6"
                  style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)' }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--km-gold-soft)', color: 'var(--km-gold)' }}
                    >
                      <Star size={16} />
                    </div>
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'var(--km-ink)' }}>
                        {userData.rating ?? '—'} out of 5
                      </div>
                      <div className="text-xs" style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>
                        Based on {userData.reviewCount ?? 0} reviews
                      </div>
                    </div>
                    <div className="flex gap-1 ml-auto">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={16}
                          style={{
                            color: star <= Math.round(userData.rating ?? 0) ? 'var(--km-gold)' : 'var(--km-line-strong)',
                            fill: star <= Math.round(userData.rating ?? 0) ? 'var(--km-gold)' : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div
                    className="border-t pt-4 text-center text-sm"
                    style={{ borderColor: 'var(--km-line)', color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}
                  >
                    No reviews to display yet.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
