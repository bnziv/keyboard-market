import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, Loader2, Plus, Trash2 } from 'lucide-react'
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
}

interface Props {
  groupBuy: AdminGroupBuy
  onClose: () => void
  onSaved: (updated: AdminGroupBuy) => void
}

function toDateInput(iso: string | null): string {
  if (!iso) return ''
  return iso.split('T')[0]
}

function SortableImageItem({
  url,
  index,
  isExcluded,
  onToggle,
}: {
  url: string
  index: number
  isExcluded: boolean
  onToggle: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`relative group rounded-md overflow-hidden border bg-muted cursor-grab active:cursor-grabbing select-none ${isDragging ? 'opacity-50 shadow-xl z-10' : ''}`}
    >
      <img
        src={url}
        alt={`Image ${index + 1}`}
        draggable={false}
        className={`w-full aspect-video object-cover transition-opacity ${isExcluded ? 'opacity-25' : ''}`}
      />
      {isExcluded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs font-semibold bg-background/90 px-2 py-0.5 rounded border">
            EXCLUDED
          </span>
        </div>
      )}
      <span className="absolute bottom-1.5 left-1.5 text-xs bg-background/75 px-1.5 py-0.5 rounded pointer-events-none">
        {index + 1}
      </span>
      <button
        type="button"
        onPointerDown={e => e.stopPropagation()}
        onClick={onToggle}
        className="absolute top-1.5 right-1.5 p-1 rounded bg-background/85 border opacity-0 group-hover:opacity-100 transition-opacity"
        title={isExcluded ? 'Restore image' : 'Exclude image'}
      >
        {isExcluded
          ? <Eye className="w-3.5 h-3.5 text-green-600" />
          : <EyeOff className="w-3.5 h-3.5 text-destructive" />
        }
      </button>
    </div>
  )
}

export function GroupBuyEditModal({ groupBuy, onClose, onSaved }: Props) {
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

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

  const toggleImage = (url: string) =>
    setExcludedImages(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    )

  const addItem = () => setItems(prev => [...prev, { name: '', price: '', currency: 'USD' }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, value: string) =>
    setItems(prev => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)))

  const addVendor = () => setVendors(prev => [...prev, { region: '', name: '', url: '' }])
  const removeVendor = (i: number) => setVendors(prev => prev.filter((_, idx) => idx !== i))
  const updateVendor = (i: number, field: string, value: string) =>
    setVendors(prev => prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)))

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
      const res = await api.patch(`/api/groupbuys/${groupBuy.id}`, payload)
      onSaved(res.data)
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const visibleCount = images.length - excludedImages.filter(u => images.includes(u)).length

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{groupBuy.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-2">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="dates">Dates</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="images" className="relative">
              Images
              {excludedImages.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                  {excludedImages.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Details */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Designer</Label>
                <Input value={designer} onChange={e => setDesigner(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IC">IC</SelectItem>
                    <SelectItem value="GB">GB</SelectItem>
                    <SelectItem value="shipping">Shipping</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyboard">Keyboard</SelectItem>
                    <SelectItem value="keycaps">Keycaps</SelectItem>
                    <SelectItem value="switches">Switches</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Overview</Label>
              <Textarea value={overview} onChange={e => setOverview(e.target.value)} rows={6} />
            </div>
            <div className="space-y-1.5">
              <Label>Poster URL</Label>
              <Input value={poster} onChange={e => setPoster(e.target.value)} placeholder="https://..." />
            </div>
          </TabsContent>

          {/* Dates */}
          <TabsContent value="dates" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>GB Start</Label>
                <Input type="date" value={gbStart} onChange={e => setGbStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>GB End</Label>
                <Input type="date" value={gbEnd} onChange={e => setGbEnd(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Estimated Fulfillment</Label>
              <Input
                value={estimatedFulfillment}
                onChange={e => setEstimatedFulfillment(e.target.value)}
                placeholder="e.g. Q3 2025"
              />
            </div>
          </TabsContent>

          {/* Pricing */}
          <TabsContent value="pricing" className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label>Base Price</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={basePriceAmount}
                  onChange={e => setBasePriceAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-36"
                />
                <Input
                  value={basePriceCurrency}
                  onChange={e => setBasePriceCurrency(e.target.value)}
                  placeholder="USD"
                  className="w-20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items / Kits</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {items.length === 0 && <p className="text-sm text-muted-foreground">No items</p>}
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Name" />
                    <Input type="number" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} placeholder="Price" className="w-24" />
                    <Input value={item.currency} onChange={e => updateItem(i, 'currency', e.target.value)} placeholder="USD" className="w-16" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Vendors & Links */}
          <TabsContent value="vendors" className="space-y-6 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Vendors</Label>
                <Button type="button" variant="outline" size="sm" onClick={addVendor}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {vendors.length === 0 && <p className="text-sm text-muted-foreground">No vendors</p>}
              <div className="space-y-2">
                {vendors.map((v, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={v.region} onChange={e => updateVendor(i, 'region', e.target.value)} placeholder="Region" className="w-28" />
                    <Input value={v.name} onChange={e => updateVendor(i, 'name', e.target.value)} placeholder="Name" />
                    <Input value={v.url} onChange={e => updateVendor(i, 'url', e.target.value)} placeholder="URL" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeVendor(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Discord URL</Label>
              <Input value={discordUrl} onChange={e => setDiscordUrl(e.target.value)} placeholder="https://discord.gg/..." />
            </div>
            <div className="space-y-1.5">
              <Label>Source URL</Label>
              <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." />
            </div>
          </TabsContent>

          {/* Images */}
          <TabsContent value="images" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              {images.length} total &middot; {visibleCount} visible &middot; {excludedImages.length} excluded
              <span className="ml-2 opacity-60">· drag to reorder</span>
            </p>
            {images.length === 0 ? (
              <p className="text-sm text-muted-foreground">No images</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={images} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((url, i) => (
                      <SortableImageItem
                        key={url}
                        url={url}
                        index={i}
                        isExcluded={excludedImages.includes(url)}
                        onToggle={() => toggleImage(url)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </TabsContent>
        </Tabs>

        {error && <p className="text-sm text-destructive mt-3">{error}</p>}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
