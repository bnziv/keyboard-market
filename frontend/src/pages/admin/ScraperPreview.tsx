import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Pencil, Play } from 'lucide-react'
import NavBar from '@/components/NavBar'
import { useToast } from '@/utils/ToastProvider'
import api from '@/utils/api'
import { GroupBuyEditModal } from './GroupBuyEditModal'
import type { AdminGroupBuy } from '@/types/groupBuy'
import { Badge, STAGE_BADGE_META } from '@/components/ui/badge'

interface PreviewItem {
  localId: string
  data: AdminGroupBuy
  alreadyExists: boolean
  hasError: boolean
  errorMessage?: string
  selected: boolean
}

type PageState = 'idle' | 'loading' | 'results'

function PreviewRow({
  item, isLast, onToggle, onEdit,
}: {
  item: PreviewItem
  isLast: boolean
  onToggle: () => void
  onEdit: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [editHovered, setEditHovered] = useState(false)

  return (
    <tr
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--km-line)',
        background: hovered ? 'var(--km-bg-sub)' : 'var(--km-bg)',
        transition: 'background 120ms',
        opacity: item.hasError ? 0.5 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td style={{ padding: '12px 16px' }}>
        <input
          type="checkbox"
          checked={item.selected}
          disabled={item.hasError}
          onChange={onToggle}
          style={{ cursor: item.hasError ? 'not-allowed' : 'pointer' }}
        />
      </td>
      <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--km-ink)', maxWidth: 220 }}>
        <span
          style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={item.data.name}
        >
          {item.data.name ?? '—'}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <Badge variant={STAGE_BADGE_META[item.data.status]?.tone ?? 'neutral'}>
          {item.data.status ?? '—'}
        </Badge>
      </td>
      <td style={{ padding: '12px 16px', color: 'var(--km-ink-dim)', textTransform: 'capitalize' }}>
        {item.data.type ?? '—'}
      </td>
      <td style={{ padding: '12px 16px', color: 'var(--km-ink-dim)' }}>
        {item.data.designer ?? '—'}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {item.alreadyExists && <Badge variant="accent">Already in DB</Badge>}
          {item.hasError && (
            <Badge variant="muted" title={item.errorMessage}>Parse error</Badge>
          )}
        </div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        {!item.hasError && (
          <button
            onClick={onEdit}
            onMouseEnter={() => setEditHovered(true)}
            onMouseLeave={() => setEditHovered(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px',
              background: 'transparent',
              border: `1px solid ${editHovered ? 'var(--km-ink)' : 'var(--km-line-strong)'}`,
              borderRadius: 4,
              color: editHovered ? 'var(--km-ink)' : 'var(--km-ink-dim)',
              fontSize: 12, fontFamily: 'var(--km-font-body)',
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'border-color 120ms, color 120ms',
            }}
          >
            <Pencil size={12} /> Edit
          </button>
        )}
      </td>
    </tr>
  )
}

export default function ScraperPreview() {
  const [pageState, setPageState] = useState<PageState>('idle')
  const [items, setItems] = useState<PreviewItem[]>([])
  const [logs, setLogs] = useState<string>('')
  const [logsExpanded, setLogsExpanded] = useState(true)
  const [scrapeError, setScrapeError] = useState<string | null>(null)
  const [editing, setEditing] = useState<PreviewItem | null>(null)
  const [importing, setImporting] = useState(false)
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const logEndRef = useRef<HTMLDivElement>(null)
  const evtSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    return () => { evtSourceRef.current?.close() }
  }, [])

  const runScraper = () => {
    evtSourceRef.current?.close()
    setPageState('loading')
    setScrapeError(null)
    setLogs('')
    setItems([])

    const es = new EventSource('/api/groupbuys/admin/scrape/stream')
    evtSourceRef.current = es

    es.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'log') {
        setLogs(prev => prev ? prev + '\n' + msg.message : msg.message)
      } else if (msg.type === 'result') {
        es.close()
        const mapped: PreviewItem[] = msg.items.map((r: any) => ({
          localId: crypto.randomUUID(),
          data: r.data,
          alreadyExists: r.alreadyExists,
          hasError: r.hasError,
          errorMessage: r.errorMessage,
          selected: !r.hasError,
        }))
        setItems(mapped)
        setLogsExpanded(false)
        setPageState('results')
      } else if (msg.type === 'error') {
        es.close()
        setScrapeError(msg.message)
        setPageState('idle')
      }
    }

    es.onerror = () => {
      es.close()
      setScrapeError('Connection to server lost')
      setPageState('idle')
    }
  }

  const toggleAll = (checked: boolean) => {
    setItems(prev => prev.map(it => ({ ...it, selected: it.hasError ? false : checked })))
  }

  const toggleItem = (localId: string) => {
    setItems(prev => prev.map(it => it.localId === localId ? { ...it, selected: !it.selected } : it))
  }

  const handlePreviewSave = (updated: AdminGroupBuy) => {
    setItems(prev => prev.map(it =>
      it.localId === editing?.localId ? { ...it, data: updated } : it,
    ))
    setEditing(null)
  }

  const handleImport = async () => {
    const toImport = items.filter(it => it.selected && !it.hasError)
    if (!toImport.length) return

    setImporting(true)
    try {
      const res = await api.post<{ imported: number }>('/api/groupbuys/admin/import', {
        items: toImport.map(it => it.data),
      })
      showSuccess(`Imported ${res.data.imported} group buy(s)`)
      navigate('/admin')
    } catch (e: any) {
      showError(e.response?.data?.message ?? 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const selectedCount = items.filter(it => it.selected && !it.hasError).length
  const allSelectable = items.filter(it => !it.hasError)
  const allSelected = allSelectable.length > 0 && allSelectable.every(it => it.selected)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--km-bg)', color: 'var(--km-ink)' }}>
      <NavBar />

      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--km-line)',
        background: 'var(--km-surface)',
        padding: '32px 32px 24px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--km-font-mono)', fontSize: 11,
            color: 'var(--km-gold)', letterSpacing: '0.2em',
            textTransform: 'uppercase', marginBottom: 10,
          }}>
            · Internal tool ·
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{
                margin: 0,
                fontFamily: 'var(--km-font-body)', fontSize: 32, fontWeight: 700,
                letterSpacing: '-0.025em', color: 'var(--km-ink)',
              }}>
                Scraper preview
              </h1>
              {pageState === 'results' && (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--km-ink-dim)' }}>
                  {items.length} result(s) · {items.filter(it => it.alreadyExists).length} already in DB · {items.filter(it => it.hasError).length} errors
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '8px 14px',
                background: 'transparent',
                border: '1px solid var(--km-line-strong)',
                borderRadius: 4,
                color: 'var(--km-ink-dim)',
                fontSize: 12, fontFamily: 'var(--km-font-body)',
                cursor: 'pointer', whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              ← Back to admin
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>

        {/* Idle */}
        {pageState === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
            {scrapeError && (
              <div style={{
                maxWidth: 640, marginBottom: 16, width: '100%',
                border: '1px solid var(--km-line)', borderRadius: 4, overflow: 'hidden',
              }}>
                <div style={{
                  padding: '8px 12px', background: 'var(--km-surface)',
                  fontFamily: 'var(--km-font-mono)', fontSize: 10,
                  color: 'var(--km-ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  Scraper error
                </div>
                <pre style={{
                  margin: 0, padding: '10px 12px',
                  background: 'var(--km-bg)',
                  fontFamily: 'var(--km-font-mono)', fontSize: 11,
                  color: 'var(--km-ink-dim)', lineHeight: 1.6,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  maxHeight: 200, overflowY: 'auto',
                }}>
                  {scrapeError}
                </pre>
              </div>
            )}
            <button
              onClick={runScraper}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px',
                background: 'var(--km-gold)',
                border: 'none', borderRadius: 4,
                color: 'var(--km-bg)',
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--km-font-body)',
                cursor: 'pointer',
              }}
            >
              <Play size={14} /> Run Scraper
            </button>
            <p style={{ fontSize: 12, color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>
              Scrapes new Geekhack group buys · may take 30–60 seconds
            </p>
          </div>
        )}

        {/* Loading */}
        {pageState === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--km-ink-mute)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--km-ink-dim)', fontFamily: 'var(--km-font-mono)' }}>
                Scraping Geekhack…
              </span>
            </div>
            <div style={{ border: '1px solid var(--km-line)', borderRadius: 4, overflow: 'hidden' }}>
              <pre style={{
                margin: 0, padding: '12px 14px',
                background: 'var(--km-bg)',
                fontFamily: 'var(--km-font-mono)', fontSize: 11,
                color: 'var(--km-ink-dim)', lineHeight: 1.6,
                height: 320, overflowY: 'auto',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {logs || 'Waiting for output…'}
                <div ref={logEndRef} />
              </pre>
            </div>
          </div>
        )}

        {/* Results */}
        {pageState === 'results' && (
          <>
            {/* Log output */}
            {logs && (
              <div style={{ border: '1px solid var(--km-line)', borderRadius: 4, marginBottom: 16, overflow: 'hidden' }}>
                <button
                  onClick={() => setLogsExpanded(p => !p)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--km-surface)',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--km-font-mono)', fontSize: 11,
                    color: 'var(--km-ink-dim)', letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  <span>Scraper logs</span>
                  <span style={{ fontSize: 10 }}>{logsExpanded ? '▲ collapse' : '▼ expand'}</span>
                </button>
                {logsExpanded && (
                  <pre style={{
                    margin: 0, padding: '12px 14px',
                    background: 'var(--km-bg)',
                    fontFamily: 'var(--km-font-mono)', fontSize: 11,
                    color: 'var(--km-ink-dim)', lineHeight: 1.6,
                    maxHeight: 320, overflowY: 'auto',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    borderTop: '1px solid var(--km-line)',
                  }}>
                    {logs}
                  </pre>
                )}
              </div>
            )}

            <div style={{ border: '1px solid var(--km-line)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--km-line)', background: 'var(--km-surface)' }}>
                    <th style={{ width: 40, padding: '10px 16px' }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={e => toggleAll(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    {['Name', 'Status', 'Type', 'Designer', 'Flags', ''].map((h, i) => (
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
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{
                        textAlign: 'center', padding: '64px 32px',
                        color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)', fontSize: 13,
                      }}>
                        No results returned by the scraper
                      </td>
                    </tr>
                  )}
                  {items.map((item, idx) => (
                    <PreviewRow
                      key={item.localId}
                      item={item}
                      isLast={idx === items.length - 1}
                      onToggle={() => toggleItem(item.localId)}
                      onEdit={() => setEditing(item)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={runScraper}
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  border: '1px solid var(--km-line-strong)',
                  borderRadius: 4,
                  color: 'var(--km-ink-dim)',
                  fontSize: 12, fontFamily: 'var(--km-font-body)',
                  cursor: 'pointer',
                }}
              >
                Run again
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {selectedCount > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--km-ink-dim)', fontFamily: 'var(--km-font-mono)' }}>
                    {selectedCount} selected
                  </span>
                )}
                <button
                  onClick={handleImport}
                  disabled={selectedCount === 0 || importing}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 18px',
                    background: selectedCount > 0 && !importing ? 'var(--km-gold)' : 'var(--km-surface-2)',
                    border: 'none', borderRadius: 4,
                    color: selectedCount > 0 && !importing ? 'var(--km-bg)' : 'var(--km-ink-mute)',
                    fontSize: 13, fontWeight: 600, fontFamily: 'var(--km-font-body)',
                    cursor: selectedCount > 0 && !importing ? 'pointer' : 'not-allowed',
                    transition: 'background 150ms, color 150ms',
                  }}
                >
                  {importing && <Loader2 size={12} className="animate-spin" />}
                  Import selected
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {editing && (
        <GroupBuyEditModal
          groupBuy={editing.data}
          onClose={() => setEditing(null)}
          onSaved={() => {}}
          onPreviewSave={handlePreviewSave}
        />
      )}
    </div>
  )
}
