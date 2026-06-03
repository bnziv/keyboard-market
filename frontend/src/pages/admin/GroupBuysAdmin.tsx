import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, Pencil, Play, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/api';
import { GroupBuyEditModal } from './GroupBuyEditModal';
import { AdminGroupBuy } from '@/types/groupBuy';
import { Badge, STAGE_BADGE_META } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TabBar } from '@/components/TabBar';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = ['All', 'IC', 'GB', 'closed'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_TABS = [
  { key: 'All' as StatusFilter, label: 'All' },
  { key: 'IC' as StatusFilter, label: 'Interest Check' },
  { key: 'GB' as StatusFilter, label: 'Live GB' },
  { key: 'closed' as StatusFilter, label: 'Closed' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function TableRow({
  gb,
  isLast,
  onEdit,
  onToggleHidden,
  onToggleFeatured,
}: {
  gb: AdminGroupBuy;
  isLast: boolean;
  onEdit: () => void;
  onToggleHidden: () => void;
  onToggleFeatured: () => void;
}) {
  return (
    <tr
      className="transition-[background] duration-[120ms] hover:bg-km-bg-sub"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--km-line)',
        ...(gb.hidden && {
          background:
            'color-mix(in srgb, var(--km-surface-2) 60%, var(--km-bg))',
          opacity: 0.6,
        }),
      }}
    >
      <td
        style={{
          padding: '12px 16px',
          fontWeight: 500,
          color: 'var(--km-ink)',
          maxWidth: 220,
        }}
      >
        <span
          style={{
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={gb.name}
        >
          {gb.name ?? '—'}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <Badge variant={STAGE_BADGE_META[gb.status ?? 'closed'].tone}>
          {gb.status}
        </Badge>
      </td>
      <td
        style={{
          padding: '12px 16px',
          color: 'var(--km-ink-dim)',
          textTransform: 'capitalize',
        }}
      >
        {gb.type ?? '—'}
      </td>
      <td style={{ padding: '12px 16px', color: 'var(--km-ink-dim)' }}>
        {gb.designer ?? '—'}
      </td>
      <td
        style={{
          padding: '12px 16px',
          color: 'var(--km-ink-dim)',
          fontFamily: 'var(--km-font-mono)',
          fontSize: 12,
        }}
      >
        {formatDate(gb.gbStart)}
      </td>
      <td
        style={{
          padding: '12px 16px',
          color: 'var(--km-ink-dim)',
          fontFamily: 'var(--km-font-mono)',
          fontSize: 12,
        }}
      >
        {formatDate(gb.gbEnd)}
      </td>
      <td
        style={{
          padding: '12px 16px',
          color: 'var(--km-ink-dim)',
          fontFamily: 'var(--km-font-mono)',
          fontSize: 12,
          whiteSpace: 'nowrap',
        }}
      >
        {gb.images.length}/{gb.images.length + gb.excludedImages.length}
        {gb.excludedImages.length > 0 && (
          <span
            style={{ marginLeft: 6, color: 'var(--km-gold)', fontSize: 11 }}
          >
            ({gb.excludedImages.length} hidden)
          </span>
        )}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleFeatured}
            title={
              gb.featured ? 'Remove from featured' : 'Feature on home page'
            }
            className={cn(
              'w-[30px] h-[30px]',
              gb.featured && 'border-km-gold text-km-gold',
            )}
          >
            <Star size={12} fill={gb.featured ? 'currentColor' : 'none'} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleHidden}
            title={gb.hidden ? 'Restore visibility' : 'Hide from public'}
            className={cn(
              'w-[30px] h-[30px]',
              gb.hidden && 'border-km-gold text-km-gold',
            )}
          >
            {gb.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil size={12} /> Edit
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function GroupBuysAdmin() {
  const [groupBuys, setGroupBuys] = useState<AdminGroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [editing, setEditing] = useState<AdminGroupBuy | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = statusFilter !== 'All' ? `?status=${statusFilter}` : '';
    api
      .get<AdminGroupBuy[]>(`/api/groupbuys/admin/all${params}`)
      .then((res) => setGroupBuys(res.data))
      .catch((e) =>
        setError(e.response?.data?.message ?? 'Failed to load group buys'),
      )
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const handleSaved = (updated: AdminGroupBuy) => {
    setGroupBuys((prev) =>
      prev.map((gb) => (gb.id === updated.id ? updated : gb)),
    );
    setEditing(null);
  };

  const handleToggleHidden = (gb: AdminGroupBuy) => {
    api
      .patch(`/api/groupbuys/admin/${gb.id}/flags`, { hidden: !gb.hidden })
      .then((res) =>
        setGroupBuys((prev) =>
          prev.map((g) => (g.id === gb.id ? res.data : g)),
        ),
      )
      .catch(() => {});
  };

  const handleToggleFeatured = (gb: AdminGroupBuy) => {
    api
      .patch(`/api/groupbuys/admin/${gb.id}/flags`, { featured: !gb.featured })
      .then((res) =>
        setGroupBuys((prev) =>
          prev.map((g) => (g.id === gb.id ? res.data : g)),
        ),
      )
      .catch(() => {});
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--km-bg)',
        color: 'var(--km-ink)',
      }}
    >
      {/* Page header */}
      <div
        style={{
          borderBottom: '1px solid var(--km-line)',
          background: 'var(--km-surface)',
          padding: '32px 32px 0',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              fontFamily: 'var(--km-font-mono)',
              fontSize: 11,
              color: 'var(--km-gold)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            · Internal tool ·
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'var(--km-font-body)',
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  color: 'var(--km-ink)',
                }}
              >
                Group buys
              </h1>
              {!loading && (
                <p
                  style={{
                    margin: '8px 0 0',
                    fontSize: 13,
                    color: 'var(--km-ink-dim)',
                  }}
                >
                  {groupBuys.length} entries
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/scraper')}
              className="border-km-gold text-km-gold shrink-0 mt-1"
            >
              <Play size={11} /> Run Scraper
            </Button>
          </div>

          {/* Status filter tabs */}
          <div style={{ marginTop: 24, marginBottom: -1 }}>
            <TabBar
              tabs={STATUS_TABS}
              active={statusFilter}
              onChange={setStatusFilter}
              variant="body"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '64px 0',
            }}
          >
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: 'var(--km-ink-mute)' }}
            />
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '64px 32px',
              textAlign: 'center',
              color: 'var(--km-ink-mute)',
              fontFamily: 'var(--km-font-mono)',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <div
            style={{
              border: '1px solid var(--km-line)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--km-line)',
                    background: 'var(--km-surface)',
                  }}
                >
                  {[
                    'Name',
                    'Status',
                    'Type',
                    'Designer',
                    'GB Start',
                    'GB End',
                    'Images',
                    '',
                  ].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        textAlign: 'left',
                        padding: '10px 16px',
                        fontFamily: 'var(--km-font-mono)',
                        fontSize: 10,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--km-ink-mute)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupBuys.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign: 'center',
                        padding: '64px 32px',
                        color: 'var(--km-ink-mute)',
                        fontFamily: 'var(--km-font-mono)',
                        fontSize: 13,
                      }}
                    >
                      No group buys found
                    </td>
                  </tr>
                )}
                {groupBuys.map((gb, idx) => (
                  <TableRow
                    key={gb.id}
                    gb={gb}
                    isLast={idx === groupBuys.length - 1}
                    onEdit={() => setEditing(gb)}
                    onToggleHidden={() => handleToggleHidden(gb)}
                    onToggleFeatured={() => handleToggleFeatured(gb)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <GroupBuyEditModal
          groupBuy={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
