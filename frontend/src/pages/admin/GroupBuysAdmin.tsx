import { useEffect, useState } from 'react'
import { Eye, EyeOff, Loader2, Pencil } from 'lucide-react'
import NavBar from '@/components/NavBar'
import api from '@/utils/api'
import { AdminGroupBuy, GroupBuyEditModal } from './GroupBuyEditModal'

const STATUS_FILTERS = ['All', 'IC', 'GB', 'shipping', 'closed'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const STATUS_LABELS: Record<string, string> = {
  All: 'All',
  IC: 'Interest Check',
  GB: 'Live GB',
  shipping: 'Shipping',
  closed: 'Closed',
}

const STATUS_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  IC:        { bg: 'var(--km-surface-2)', fg: 'var(--km-ink-dim)', border: 'var(--km-line)' },
  GB:        { bg: 'color-mix(in srgb, var(--km-ok) 20%, var(--km-surface))', fg: 'var(--km-ok)', border: 'var(--km-ok)' },
  shipping:  { bg: 'var(--km-gold-soft)',  fg: 'var(--km-gold)',    border: 'var(--km-gold)' },
  closed:    { bg: 'var(--km-surface-2)', fg: 'var(--km-ink-mute)', border: 'var(--km-line)' },
  fulfilled: { bg: 'var(--km-surface-2)', fg: 'var(--km-ink-mute)', border: 'var(--km-line)' },
}

function StatusPill({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.closed
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px',
      fontFamily: 'var(--km-font-mono)', fontSize: 10,
      letterSpacing: '0.05em', textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      background: c.bg, color: c.fg,
      border: `1px solid ${c.border}`,
      borderRadius: 4,
    }}>
      {status}
    </span>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function TableRow({ gb, isLast, onEdit, onToggleHidden }: { gb: AdminGroupBuy; isLast: boolean; onEdit: () => void; onToggleHidden: () => void }) {
  const [hovered, setHovered] = useState(false)
  const [btnHovered, setBtnHovered] = useState(false)
  const [hideHovered, setHideHovered] = useState(false)

  return (
    <tr
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--km-line)',
        background: gb.hidden
          ? 'color-mix(in srgb, var(--km-surface-2) 60%, var(--km-bg))'
          : hovered ? 'var(--km-bg-sub)' : 'var(--km-bg)',
        transition: 'background 120ms',
        opacity: gb.hidden ? 0.6 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--km-ink)', maxWidth: 220 }}>
        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={gb.name}>
          {gb.name ?? '—'}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <StatusPill status={gb.status} />
      </td>
      <td style={{ padding: '12px 16px', color: 'var(--km-ink-dim)', textTransform: 'capitalize' }}>
        {gb.type ?? '—'}
      </td>
      <td style={{ padding: '12px 16px', color: 'var(--km-ink-dim)' }}>
        {gb.designer ?? '—'}
      </td>
      <td style={{ padding: '12px 16px', color: 'var(--km-ink-dim)', fontFamily: 'var(--km-font-mono)', fontSize: 12 }}>
        {formatDate(gb.gbStart)}
      </td>
      <td style={{ padding: '12px 16px', color: 'var(--km-ink-dim)', fontFamily: 'var(--km-font-mono)', fontSize: 12 }}>
        {formatDate(gb.gbEnd)}
      </td>
      <td style={{ padding: '12px 16px', color: 'var(--km-ink-dim)', fontFamily: 'var(--km-font-mono)', fontSize: 12, whiteSpace: 'nowrap' }}>
        {gb.images.length}/{gb.images.length + gb.excludedImages.length}
        {gb.excludedImages.length > 0 && (
          <span style={{ marginLeft: 6, color: 'var(--km-gold)', fontSize: 11 }}>
            ({gb.excludedImages.length} hidden)
          </span>
        )}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onToggleHidden}
            onMouseEnter={() => setHideHovered(true)}
            onMouseLeave={() => setHideHovered(false)}
            title={gb.hidden ? 'Restore visibility' : 'Hide from public'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30,
              background: 'transparent',
              border: `1px solid ${gb.hidden ? 'var(--km-gold)' : hideHovered ? 'var(--km-ink)' : 'var(--km-line-strong)'}`,
              borderRadius: 4,
              color: gb.hidden ? 'var(--km-gold)' : hideHovered ? 'var(--km-ink)' : 'var(--km-ink-dim)',
              cursor: 'pointer',
              transition: 'border-color 120ms, color 120ms',
            }}
          >
            {gb.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
          <button
            onClick={onEdit}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px',
              background: 'transparent',
              border: `1px solid ${btnHovered ? 'var(--km-ink)' : 'var(--km-line-strong)'}`,
              borderRadius: 4,
              color: btnHovered ? 'var(--km-ink)' : 'var(--km-ink-dim)',
              fontSize: 12, fontFamily: 'var(--km-font-body)',
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'border-color 120ms, color 120ms',
            }}
          >
            <Pencil size={12} /> Edit
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function GroupBuysAdmin() {
  const [groupBuys, setGroupBuys] = useState<AdminGroupBuy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [editing, setEditing] = useState<AdminGroupBuy | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = statusFilter !== 'All' ? `?status=${statusFilter}` : ''
    api
      .get<AdminGroupBuy[]>(`/api/groupbuys/admin/all${params}`)
      .then(res => setGroupBuys(res.data))
      .catch(e => setError(e.response?.data?.message ?? 'Failed to load group buys'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const handleSaved = (updated: AdminGroupBuy) => {
    setGroupBuys(prev => prev.map(gb => gb.id === updated.id ? updated : gb))
    setEditing(null)
  }

  const handleToggleHidden = (gb: AdminGroupBuy) => {
    const next = !gb.hidden
    api.patch(`/api/groupbuys/${gb.id}`, { hidden: next })
      .then(res => setGroupBuys(prev => prev.map(g => g.id === gb.id ? res.data : g)))
      .catch(() => {})
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--km-bg)', color: 'var(--km-ink)' }}>
      <NavBar />

      {/* Page header */}
      <div style={{
        borderBottom: '1px solid var(--km-line)',
        background: 'var(--km-surface)',
        padding: '32px 32px 0',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--km-font-mono)', fontSize: 11,
            color: 'var(--km-gold)', letterSpacing: '0.2em',
            textTransform: 'uppercase', marginBottom: 10,
          }}>
            · Internal tool ·
          </div>
          <h1 style={{
            margin: 0,
            fontFamily: 'var(--km-font-body)', fontSize: 32, fontWeight: 700,
            letterSpacing: '-0.025em', color: 'var(--km-ink)',
          }}>
            Group buys
          </h1>
          {!loading && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--km-ink-dim)' }}>
              {groupBuys.length} entries
            </p>
          )}

          {/* Status filter tabs */}
          <div style={{ display: 'flex', gap: 2, marginTop: 24, marginBottom: -1 }}>
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '10px 16px',
                  fontSize: 13,
                  fontWeight: statusFilter === s ? 600 : 400,
                  color: statusFilter === s ? 'var(--km-ink)' : 'var(--km-ink-dim)',
                  background: 'none', border: 'none', outline: 'none',
                  borderBottom: `2px solid ${statusFilter === s ? 'var(--km-gold)' : 'transparent'}`,
                  cursor: 'pointer',
                  fontFamily: 'var(--km-font-body)',
                  whiteSpace: 'nowrap',
                  transition: 'color 150ms',
                }}
              >
                {STATUS_LABELS[s] ?? s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--km-ink-mute)' }} />
          </div>
        )}

        {error && (
          <div style={{
            padding: '64px 32px', textAlign: 'center',
            color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ border: '1px solid var(--km-line)', borderRadius: 4, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--km-line)', background: 'var(--km-surface)' }}>
                  {['Name', 'Status', 'Type', 'Designer', 'GB Start', 'GB End', 'Images', ''].map((h, i) => (
                    <th key={i} style={{
                      textAlign: 'left', padding: '10px 16px',
                      fontFamily: 'var(--km-font-mono)', fontSize: 10,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: 'var(--km-ink-mute)', fontWeight: 600, whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupBuys.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{
                      textAlign: 'center', padding: '64px 32px',
                      color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)', fontSize: 13,
                    }}>
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
  )
}
