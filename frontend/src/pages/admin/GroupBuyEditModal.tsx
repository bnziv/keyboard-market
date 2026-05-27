import { useState } from 'react'
import {
  DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Eye, EyeOff, Loader2, Plus, Trash2, X } from 'lucide-react'
import api from '@/utils/api'

export interface AdminGroupBuy {
  id: string
  name: string
  type: string
  status: string
  designer: string
  overview: string | null
  poster: string | null
  gbStart: string | null
  gbEnd: string | null
  estimatedFulfillment: string | null
  basePrice: { amount: number; currency: string } | null
  items: { name: string; price: number; currency: string }[]
  vendors: { region: string; name: string; url: string }[]
  discordUrl: string | null
  sourceUrl: string | null
  images: string[]
  excludedImages: string[]
  hidden: boolean
}

type Tab = 'details' | 'dates' | 'pricing' | 'vendors' | 'images'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid var(--km-line-strong)',
  borderRadius: 4,
  background: 'var(--km-bg)',
  color: 'var(--km-ink)',
  fontSize: 13,
  fontFamily: 'var(--km-font-body)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--km-font-mono)',
  fontSize: 10,
  color: 'var(--km-ink-dim)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontWeight: 600,
  marginBottom: 6,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 10px',
        background: 'transparent',
        border: '1px solid var(--km-line-strong)',
        borderRadius: 4,
        color: 'var(--km-ink-dim)',
        fontFamily: 'var(--km-font-mono)',
        fontSize: 10,
        letterSpacing: '0.05em',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function toDateInput(iso: string | null): string {
  if (!iso) return ''
  return iso.split('T')[0]
}

function SortableImageItem({
  url, index, onExclude,
}: {
  url: string; index: number; onExclude: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative',
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid var(--km-line)',
        background: 'var(--km-bg-sub)',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
        userSelect: 'none',
      }}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={url}
        alt={`Image ${index + 1}`}
        draggable={false}
        style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
      />
      <span style={{
        position: 'absolute', bottom: 6, left: 6,
        fontFamily: 'var(--km-font-mono)', fontSize: 9,
        background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.7)',
        padding: '2px 6px', borderRadius: 3, pointerEvents: 'none',
      }}>
        {index + 1}
      </span>
      <button
        type="button"
        onPointerDown={e => e.stopPropagation()}
        onClick={onExclude}
        style={{
          position: 'absolute', top: 6, right: 6,
          width: 26, height: 26, borderRadius: 4,
          background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#e07070',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 120ms',
        }}
        title="Exclude image"
      >
        <EyeOff size={12} />
      </button>
    </div>
  )
}

function ExcludedImageItem({
  url, onRestore,
}: {
  url: string; onRestore: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        position: 'relative', borderRadius: 4, overflow: 'hidden',
        border: '1px solid var(--km-line)', background: 'var(--km-bg-sub)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={url}
        alt="Excluded image"
        draggable={false}
        style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block', opacity: 0.25 }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontFamily: 'var(--km-font-mono)', fontSize: 9,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          background: 'var(--km-surface)', color: 'var(--km-ink-mute)',
          border: '1px solid var(--km-line)', padding: '3px 8px', borderRadius: 3,
        }}>
          Excluded
        </span>
      </div>
      <button
        type="button"
        onClick={onRestore}
        style={{
          position: 'absolute', top: 6, right: 6,
          width: 26, height: 26, borderRadius: 4,
          background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
          color: 'var(--km-ok)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 120ms',
        }}
        title="Restore image"
      >
        <Eye size={12} />
      </button>
    </div>
  )
}

interface Props {
  groupBuy: AdminGroupBuy
  onClose: () => void
  onSaved: (updated: AdminGroupBuy) => void
}

export function GroupBuyEditModal({ groupBuy, onClose, onSaved }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [name, setName] = useState(groupBuy.name ?? '')
  const [type, setType] = useState(groupBuy.type ?? '')
  const [status, setStatus] = useState(groupBuy.status ?? '')
  const [designer, setDesigner] = useState(groupBuy.designer ?? '')
  const [overview, setOverview] = useState(groupBuy.overview ?? '')
  const [poster, setPoster] = useState(groupBuy.poster ?? '')
  const [gbStart, setGbStart] = useState(toDateInput(groupBuy.gbStart))
  const [gbEnd, setGbEnd] = useState(toDateInput(groupBuy.gbEnd))
  const [estimatedFulfillment, setEstimatedFulfillment] = useState(groupBuy.estimatedFulfillment ?? '')
  const [basePriceAmount, setBasePriceAmount] = useState(String(groupBuy.basePrice?.amount ?? ''))
  const [basePriceCurrency, setBasePriceCurrency] = useState(groupBuy.basePrice?.currency ?? 'USD')
  const [items, setItems] = useState(
    (groupBuy.items ?? []).map(it => ({ ...it, price: String(it.price) }))
  )
  const [vendors, setVendors] = useState(groupBuy.vendors ?? [])
  const [discordUrl, setDiscordUrl] = useState(groupBuy.discordUrl ?? '')
  const [sourceUrl, setSourceUrl] = useState(groupBuy.sourceUrl ?? '')
  const [images, setImages] = useState<string[]>(groupBuy.images ?? [])
  const [excludedImages, setExcludedImages] = useState<string[]>(groupBuy.excludedImages ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setImages(prev => {
        const oldIndex = prev.indexOf(active.id as string)
        const newIndex = prev.indexOf(over.id as string)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  const excludeImage = (url: string) => {
    setImages(prev => prev.filter(u => u !== url))
    setExcludedImages(prev => [...prev, url])
  }
  const restoreImage = (url: string) => {
    setExcludedImages(prev => prev.filter(u => u !== url))
    setImages(prev => [...prev, url])
  }

  const addItem = () => setItems(prev => [...prev, { name: '', price: '', currency: 'USD' }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, value: string) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it))

  const addVendor = () => setVendors(prev => [...prev, { region: '', name: '', url: '' }])
  const removeVendor = (i: number) => setVendors(prev => prev.filter((_, idx) => idx !== i))
  const updateVendor = (i: number, field: string, value: string) =>
    setVendors(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: name || undefined,
        type: type || undefined,
        status: status || undefined,
        designer: designer || undefined,
        overview: overview || undefined,
        poster: poster || undefined,
        gb_start: gbStart || undefined,
        gb_end: gbEnd || undefined,
        estimated_fulfillment: estimatedFulfillment || undefined,
        base_price: basePriceAmount
          ? { amount: parseFloat(basePriceAmount), currency: basePriceCurrency }
          : undefined,
        items: items.map(it => ({ name: it.name, price: parseFloat(it.price) || 0, currency: it.currency })),
        vendors,
        discord_url: discordUrl || undefined,
        source_url: sourceUrl || undefined,
        images,
        excludedImages,
      }
      const res = await api.patch(`/api/groupbuys/admin/${groupBuy.id}`, payload)
      onSaved(res.data)
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'dates', label: 'Dates' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'vendors', label: 'Vendors' },
    { id: 'images', label: excludedImages.length ? `Images (${excludedImages.length} hidden)` : 'Images' },
  ]

  const totalCount = images.length + excludedImages.length

  const emptyNote = (msg: string) => (
    <div style={{ fontSize: 13, color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}>{msg}</div>
  )

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 720,
          maxHeight: 'calc(100vh - 48px)',
          background: 'var(--km-surface)',
          border: '1px solid var(--km-line)',
          borderRadius: 8,
          boxShadow: '0 40px 120px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--km-line)',
          display: 'flex', alignItems: 'center', gap: 14,
          flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--km-font-mono)', fontSize: 9,
              color: 'var(--km-ink-mute)', letterSpacing: '0.15em',
              textTransform: 'uppercase', marginBottom: 4,
            }}>
              Editing group buy
            </div>
            <h2 style={{
              margin: 0,
              fontFamily: 'var(--km-font-body)', fontSize: 18, fontWeight: 600,
              letterSpacing: '-0.02em', color: 'var(--km-ink)',
            }}>
              {groupBuy.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid var(--km-line)',
              color: 'var(--km-ink-dim)', width: 32, height: 32,
              borderRadius: 4, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 2, padding: '0 24px',
          borderBottom: '1px solid var(--km-line)',
          flexShrink: 0, overflowX: 'auto',
        }}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                padding: '12px 14px',
                fontFamily: 'var(--km-font-mono)', fontSize: 11,
                color: activeTab === id ? 'var(--km-ink)' : 'var(--km-ink-mute)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                fontWeight: activeTab === id ? 600 : 400,
                background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === id ? 'var(--km-gold)' : 'transparent'}`,
                cursor: 'pointer', marginBottom: -1,
                whiteSpace: 'nowrap', transition: 'color 120ms',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Name">
                  <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
                </Field>
                <Field label="Designer">
                  <input style={inputStyle} value={designer} onChange={e => setDesigner(e.target.value)} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Status">
                  <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="">— Select —</option>
                    <option value="IC">IC</option>
                    <option value="GB">GB</option>
                    <option value="shipping">Shipping</option>
                    <option value="closed">Closed</option>
                    <option value="fulfilled">Fulfilled</option>
                  </select>
                </Field>
                <Field label="Type">
                  <select style={inputStyle} value={type} onChange={e => setType(e.target.value)}>
                    <option value="">— Select —</option>
                    <option value="keyboard">Keyboard</option>
                    <option value="keycaps">Keycaps</option>
                    <option value="switches">Switches</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </Field>
              </div>
              <Field label="Overview">
                <textarea
                  style={{ ...inputStyle, resize: 'vertical' }}
                  value={overview}
                  onChange={e => setOverview(e.target.value)}
                  rows={6}
                />
              </Field>
              <Field label="Poster URL">
                <input style={inputStyle} value={poster} onChange={e => setPoster(e.target.value)} placeholder="https://..." />
              </Field>
            </div>
          )}

          {activeTab === 'dates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="GB Start">
                  <input type="date" style={inputStyle} value={gbStart} onChange={e => setGbStart(e.target.value)} />
                </Field>
                <Field label="GB End">
                  <input type="date" style={inputStyle} value={gbEnd} onChange={e => setGbEnd(e.target.value)} />
                </Field>
              </div>
              <Field label="Estimated Fulfillment">
                <input
                  style={inputStyle}
                  value={estimatedFulfillment}
                  onChange={e => setEstimatedFulfillment(e.target.value)}
                  placeholder="e.g. Q3 2025"
                />
              </Field>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Base Price</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    style={{ ...inputStyle, width: 140 }}
                    value={basePriceAmount}
                    onChange={e => setBasePriceAmount(e.target.value)}
                    placeholder="Amount"
                  />
                  <input
                    style={{ ...inputStyle, width: 80 }}
                    value={basePriceCurrency}
                    onChange={e => setBasePriceCurrency(e.target.value)}
                    placeholder="USD"
                  />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Items / Kits</label>
                  <AddBtn onClick={addItem}><Plus size={11} /> Add</AddBtn>
                </div>
                {items.length === 0 && emptyNote('No items')}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input style={{ ...inputStyle, flex: 1 }} value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Name" />
                      <input type="number" style={{ ...inputStyle, width: 90 }} value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} placeholder="Price" />
                      <input style={{ ...inputStyle, width: 65 }} value={item.currency} onChange={e => updateItem(i, 'currency', e.target.value)} placeholder="USD" />
                      <button type="button" onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--km-ink-mute)', padding: 4, display: 'flex' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vendors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Vendors</label>
                  <AddBtn onClick={addVendor}><Plus size={11} /> Add</AddBtn>
                </div>
                {vendors.length === 0 && emptyNote('No vendors')}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {vendors.map((v, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input style={{ ...inputStyle, width: 100 }} value={v.region} onChange={e => updateVendor(i, 'region', e.target.value)} placeholder="Region" />
                      <input style={{ ...inputStyle, flex: 1 }} value={v.name} onChange={e => updateVendor(i, 'name', e.target.value)} placeholder="Name" />
                      <input style={{ ...inputStyle, flex: 1 }} value={v.url} onChange={e => updateVendor(i, 'url', e.target.value)} placeholder="URL" />
                      <button type="button" onClick={() => removeVendor(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--km-ink-mute)', padding: 4, display: 'flex' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <Field label="Discord URL">
                <input style={inputStyle} value={discordUrl} onChange={e => setDiscordUrl(e.target.value)} placeholder="https://discord.gg/..." />
              </Field>
              <Field label="Source URL">
                <input style={inputStyle} value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." />
              </Field>
            </div>
          )}

          {activeTab === 'images' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 12,
                }}>
                  <label style={labelStyle}>Active · drag to reorder</label>
                  <span style={{ fontFamily: 'var(--km-font-mono)', fontSize: 10, color: 'var(--km-ink-mute)' }}>
                    {images.length} / {totalCount}
                  </span>
                </div>
                {images.length === 0 ? emptyNote('No active images') : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={images} strategy={rectSortingStrategy}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {images.map((url, i) => (
                          <SortableImageItem
                            key={url}
                            url={url}
                            index={i}
                            onExclude={() => excludeImage(url)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
              {excludedImages.length > 0 && (
                <div>
                  <label style={{ ...labelStyle, marginBottom: 12 }}>Excluded</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {excludedImages.map(url => (
                      <ExcludedImageItem key={url} url={url} onRestore={() => restoreImage(url)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--km-line)',
          background: 'var(--km-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          {error
            ? <span style={{ fontSize: 12, color: '#e07070', fontFamily: 'var(--km-font-mono)' }}>{error}</span>
            : <span />
          }
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '9px 18px',
                border: '1px solid var(--km-line-strong)',
                borderRadius: 4,
                background: 'transparent',
                color: 'var(--km-ink-dim)',
                fontSize: 13, fontWeight: 500,
                cursor: saving ? 'default' : 'pointer',
                fontFamily: 'var(--km-font-body)',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px',
                border: '1px solid var(--km-ink)',
                borderRadius: 4,
                background: 'var(--km-ink)',
                color: 'var(--km-bg)',
                fontSize: 13, fontWeight: 600,
                cursor: saving ? 'default' : 'pointer',
                fontFamily: 'var(--km-font-body)',
                opacity: saving ? 0.7 : 1,
                transition: 'opacity 120ms',
              }}
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
