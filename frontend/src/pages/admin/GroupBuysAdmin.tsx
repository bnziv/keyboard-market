import { useEffect, useState } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import NavBar from '@/components/NavBar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
    setGroupBuys(prev => prev.map(gb => (gb.id === updated.id ? updated : gb)))
    setEditing(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Admin — Group Buys</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">{groupBuys.length} entries</p>
          )}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {STATUS_LABELS[s] ?? s}
            </Button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Designer</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">GB Start</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">GB End</th>
                  <th className="text-left px-4 py-3 font-medium">Images</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {groupBuys.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted-foreground py-16">
                      No group buys found
                    </td>
                  </tr>
                )}
                {groupBuys.map(gb => (
                  <tr key={gb.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium max-w-[220px] truncate" title={gb.name}>
                      {gb.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={gb.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell capitalize">
                      {gb.type ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {gb.designer ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {formatDate(gb.gbStart)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {formatDate(gb.gbEnd)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {gb.images.length - gb.excludedImages.length}/{gb.images.length}
                      {gb.excludedImages.length > 0 && (
                        <span className="ml-1.5 text-xs text-amber-600 dark:text-amber-400">
                          ({gb.excludedImages.length} hidden)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(gb)}>
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </td>
                  </tr>
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

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    IC: 'secondary',
    GB: 'default',
    shipping: 'outline',
    closed: 'secondary',
    fulfilled: 'secondary',
  }
  return (
    <Badge variant={variants[status] ?? 'secondary'}>
      {status}
    </Badge>
  )
}
