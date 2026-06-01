import { useState, useEffect, useRef } from 'react';
import { TabBar } from '@/components/TabBar';
import ListingCard, { ListingCardProps } from '@/components/ListingCard';
import { MessageCircle, Plus } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '@/utils/api';
import { useChat } from '@/utils/ChatProvider';
import { useAuth } from '@/utils/AuthProvider';
import { useToast } from '@/utils/ToastProvider';
import { formatDate } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UserProps {
  id: string;
  username: string;
  dateJoined: string;
  totalListings: number;
  rating: number;
  reviewCount: number;
  favoriteCount: number;
}

const CHART_DATA = [
  { month: 'Nov', h: 40 },
  { month: 'Dec', h: 70 },
  { month: 'Jan', h: 55 },
  { month: 'Feb', h: 92 },
  { month: 'Mar', h: 48 },
  { month: 'Apr', h: 85 },
];

export default function Profile() {
  const params = useParams();
  const username = params.username;
  const [tab, setTab] = useState('listings');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserProps>({} as UserProps);
  const [userListings, setUserListings] = useState<ListingCardProps[]>([]);
  const { user, isAuthenticated } = useAuth();
  const { startChat } = useChat();
  const { showError, showInfo } = useToast();
  const isMounted = useRef(false);
  const navigate = useNavigate();
  const isOwnProfile = user?.username === username;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/api/users/profile/${username}`),
      api.get(`/api/listings/username/${username}`),
    ])
      .then(([userRes, listingsRes]) => {
        setUserData(userRes.data);
        setUserListings(listingsRes.data);
      })
      .catch(() => {
        if (!isMounted.current) showError('Profile not found');
        isMounted.current = true;
        navigate('/listings');
      })
      .finally(() => setLoading(false));
  }, [username]);

  const handleMessage = () => {
    if (!isAuthenticated) {
      showError('Please login to start a chat');
      return;
    }
    if (user?.id === userData.id) {
      showInfo('This is your own profile');
      return;
    }
    startChat(userData.id, userData.username);
  };

  const initial = (userData.username?.[0] ?? '?').toUpperCase();

  const STATS = [
    [String(userData.totalListings ?? 0), 'Active listings'],
    [String(userData.reviewCount ?? 0), 'Reviews'],
    [String(userData.rating ?? '—'), 'Avg. rating'],
    ['99%', 'On-time ship'],
    ['0', 'Disputes'],
  ];

  const TABS = [
    { id: 'listings', label: 'Listings', count: userListings.length },
    { id: 'reviews', label: 'Reviews', count: userData.reviewCount ?? 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col bg-km-bg">
        <div className="flex-1 flex items-center justify-center">
          <div className="font-km-mono text-sm text-km-ink-mute">
            Loading profile…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-km-bg text-km-ink">
      {/* Banner */}
      <div className="border-b border-km-line px-4 sm:px-8 pt-6 sm:pt-9 pb-0 bg-km-bg-sub">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="font-km-mono text-xs mb-5 text-km-ink-mute">
            <Link to="/" className="hover:opacity-80 text-km-ink-mute">
              ← Home
            </Link>
            <span className="mx-1.5">/</span>
            <span>profiles</span>
            <span className="mx-1.5">/</span>
            <span className="text-km-ink">@{userData.username}</span>
          </div>

          {/* Profile header */}
          <div className="flex flex-wrap items-end gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-semibold flex-shrink-0 border bg-km-gold-soft border-km-gold/33 text-km-gold font-km-mono">
              {initial}
            </div>

            {/* Info */}
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-semibold tracking-[-0.02em] text-km-ink">
                  @{userData.username}
                </h1>
                <span className="px-2 py-0.5 text-[10px] rounded border font-km-mono bg-km-gold-soft border-km-gold text-km-gold tracking-[0.05em]">
                  VERIFIED
                </span>
              </div>
              <div className="flex gap-4 text-xs font-km-mono text-km-ink-dim">
                <span>
                  Joined{' '}
                  {userData.dateJoined ? formatDate(userData.dateJoined) : '—'}
                </span>
                <span className="text-km-line-strong">·</span>
                <span>{userData.totalListings ?? 0} listings</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pb-1">
              {!isOwnProfile && (
                <Button variant="solid" onClick={handleMessage}>
                  <MessageCircle size={14} /> Message
                </Button>
              )}
              {isOwnProfile && (
                <Button variant="gold" asChild>
                  <Link to="/create-listing">
                    <Plus size={14} /> New listing
                  </Link>
                </Button>
              )}
              {!isOwnProfile && <Button variant="outline">Follow</Button>}
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid mt-6 sm:mt-7 border-t border-b border-km-line grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {STATS.map(([value, label], i) => (
              <div
                key={label}
                className={cn(
                  'py-4 px-5',
                  i < STATS.length - 1 && 'border-r border-km-line',
                )}
              >
                <div className="text-2xl font-semibold font-km-body text-km-ink tracking-[-0.02em]">
                  {value}
                </div>
                <div className="mt-0.5 text-[10px] uppercase font-km-mono text-km-ink-mute tracking-[0.12em]">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="mt-5">
            <TabBar
              tabs={TABS.map((t) => ({
                key: t.id,
                label: t.label,
                count: t.count,
              }))}
              active={tab}
              onChange={setTab}
              variant="body"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 pb-16">
        {tab === 'listings' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="font-km-mono text-xs text-km-ink-dim">
                {userListings.length} active listing
                {userListings.length !== 1 ? 's' : ''}
              </div>
              {isOwnProfile && (
                <Button variant="solid" size="sm" asChild>
                  <Link to="/create-listing">
                    <Plus size={12} /> New listing
                  </Link>
                </Button>
              )}
            </div>

            {userListings.length === 0 && !isOwnProfile ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="text-4xl text-km-line-strong">◆</div>
                <div className="font-km-mono text-sm text-km-ink-mute">
                  No active listings.
                </div>
              </div>
            ) : (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                }}
              >
                {userListings.map((listing) => (
                  <ListingCard key={listing.id} {...listing} />
                ))}
                {isOwnProfile && (
                  <Link
                    to="/create-listing"
                    className="flex flex-col items-center justify-center gap-2.5 rounded text-sm transition-colors hover:border-km-ink-mute font-km-mono text-[11px] text-km-ink-mute border border-dashed border-km-line-strong"
                    style={{ minHeight: '200px' }}
                  >
                    <Plus size={20} style={{ opacity: 0.5 }} />
                    List another item
                  </Link>
                )}
              </div>
            )}

            {/* Sales chart — own profile only */}
            {isOwnProfile && (
              <div className="mt-10 p-6 rounded border bg-km-surface border-km-line">
                <div className="flex items-baseline justify-between mb-5">
                  <div>
                    <div className="font-km-mono text-[10px] uppercase tracking-[0.15em] text-km-gold mb-1">
                      Last 6 months
                    </div>
                    <div className="text-xl font-semibold text-km-ink tracking-[-0.02em]">
                      Sales activity
                    </div>
                  </div>
                  <div className="flex gap-5 text-xs font-km-mono text-km-ink-dim">
                    <span>
                      <span className="text-km-ink-mute">Total: </span>
                      <strong className="text-km-ink">—</strong>
                    </span>
                    <span>
                      <span className="text-km-ink-mute">Items: </span>
                      <strong className="text-km-ink">
                        {userData.totalListings ?? 0}
                      </strong>
                    </span>
                  </div>
                </div>
                {/* Bar chart */}
                <div className="overflow-x-auto">
                  <div
                    className="grid gap-3.5 items-end min-w-[320px]"
                    style={{
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      height: '120px',
                    }}
                  >
                    {CHART_DATA.map((d, i) => (
                      <div
                        key={d.month}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className={cn(
                            'w-full rounded-sm transition-all min-h-[4px]',
                            i === 3 ? 'bg-km-gold' : 'bg-km-line-strong',
                          )}
                          style={{ height: `${d.h}%` }}
                        />
                        <div className="font-km-mono text-[10px] text-km-ink-mute">
                          {d.month}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="rounded border p-6 bg-km-surface border-km-line">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-km-gold-soft text-km-gold">
                ★
              </div>
              <div>
                <div className="font-medium text-sm text-km-ink">
                  {userData.rating ?? '—'} out of 5
                </div>
                <div className="font-km-mono text-xs mt-0.5 text-km-ink-mute">
                  Based on {userData.reviewCount ?? 0} reviews
                </div>
              </div>
              <div className="flex gap-1 ml-auto text-lg text-km-gold">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    style={{
                      opacity:
                        star <= Math.round(userData.rating ?? 0) ? 1 : 0.2,
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div className="border-t border-km-line pt-4 text-sm text-center font-km-mono text-km-ink-mute">
              No reviews yet.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
