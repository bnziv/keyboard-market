import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, Loader2, Plus, Trash2 } from 'lucide-react';
import api from '@/utils/api';
import * as Dialog from '@radix-ui/react-dialog';
import { TabBar } from '@/components/TabBar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdminGroupBuy } from '@/types/groupBuy';

type Tab = 'details' | 'dates' | 'pricing' | 'vendors' | 'images';

const inputCls =
  'w-full py-[9px] px-3 border border-km-line-strong rounded bg-km-bg text-km-ink text-[13px] font-km-body outline-none box-border';
const labelCls =
  'block font-km-mono text-[10px] text-km-ink-dim tracking-[0.1em] uppercase font-semibold mb-1.5';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function AddBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-[5px] px-[10px] py-[5px] bg-transparent border border-km-line-strong rounded text-km-ink-dim font-km-mono text-[10px] tracking-[0.05em] cursor-pointer"
    >
      {children}
    </button>
  );
}

function toDateInput(iso: string | null): string {
  if (!iso) return '';
  return iso.split('T')[0];
}

function SortableImageItem({
  url,
  index,
  onExclude,
  onDelete,
}: {
  url: string;
  index: number;
  onExclude: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group relative rounded overflow-hidden border border-km-line bg-km-bg-sub select-none',
        isDragging
          ? 'cursor-grabbing opacity-50 shadow-[0_8px_24px_rgba(0,0,0,0.3)]'
          : 'cursor-grab',
      )}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <img
        src={url}
        alt={`Image ${index + 1}`}
        draggable={false}
        className="w-full aspect-video object-cover block"
      />
      <span className="absolute bottom-1.5 left-1.5 font-km-mono text-[9px] bg-black/55 text-white/70 px-1.5 py-[2px] rounded-[3px] pointer-events-none">
        {index + 1}
      </span>
      <div
        className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms]"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onExclude}
          className="w-[26px] h-[26px] rounded flex items-center justify-center cursor-pointer bg-black/60 border border-white/15 text-[#e07070]"
          title="Exclude image"
        >
          <EyeOff size={12} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="w-[26px] h-[26px] rounded flex items-center justify-center cursor-pointer bg-black/60 border border-white/15 text-red-400 hover:text-red-300"
          title="Delete image"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

function ExcludedImageItem({
  url,
  onRestore,
  onDelete,
}: {
  url: string;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative rounded overflow-hidden border border-km-line bg-km-bg-sub">
      <img
        src={url}
        alt="Excluded image"
        draggable={false}
        className="w-full aspect-video object-cover block opacity-25"
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="font-km-mono text-[9px] tracking-[0.12em] uppercase bg-km-surface text-km-ink-mute border border-km-line px-2 py-[3px] rounded-[3px]">
          Excluded
        </span>
      </div>
      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms]">
        <button
          type="button"
          onClick={onRestore}
          className="w-[26px] h-[26px] rounded flex items-center justify-center cursor-pointer bg-black/60 border border-white/15 text-km-ok"
          title="Restore image"
        >
          <Eye size={12} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="w-[26px] h-[26px] rounded flex items-center justify-center cursor-pointer bg-black/60 border border-white/15 text-red-400 hover:text-red-300"
          title="Delete image"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

interface Props {
  groupBuy: AdminGroupBuy;
  onClose: () => void;
  onSaved: (updated: AdminGroupBuy) => void;
  onPreviewSave?: (updated: AdminGroupBuy) => void;
}

export function GroupBuyEditModal({
  groupBuy,
  onClose,
  onSaved,
  onPreviewSave,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [name, setName] = useState(groupBuy.name ?? '');
  const [type, setType] = useState(groupBuy.type ?? '');
  const [status, setStatus] = useState(groupBuy.status ?? '');
  const [designer, setDesigner] = useState(groupBuy.designer ?? '');
  const [overview, setOverview] = useState(groupBuy.overview ?? '');
  const [poster, setPoster] = useState(groupBuy.poster ?? '');
  const [gbStart, setGbStart] = useState(toDateInput(groupBuy.gbStart));
  const [gbEnd, setGbEnd] = useState(toDateInput(groupBuy.gbEnd));
  const [estimatedFulfillment, setEstimatedFulfillment] = useState(
    groupBuy.estimatedFulfillment ?? '',
  );
  const [basePriceAmount, setBasePriceAmount] = useState(
    String(groupBuy.basePrice?.amount ?? ''),
  );
  const [basePriceCurrency, setBasePriceCurrency] = useState(
    groupBuy.basePrice?.currency ?? 'USD',
  );
  const [items, setItems] = useState(
    (groupBuy.items ?? []).map((it) => ({ ...it, price: String(it.price) })),
  );
  const [vendors, setVendors] = useState(groupBuy.vendors ?? []);
  const [discordUrl, setDiscordUrl] = useState(groupBuy.discordUrl ?? '');
  const [sourceUrl, setSourceUrl] = useState(groupBuy.sourceUrl ?? '');
  const [images, setImages] = useState<string[]>(groupBuy.images ?? []);
  const [excludedImages, setExcludedImages] = useState<string[]>(
    groupBuy.excludedImages ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const excludeImage = (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url));
    setExcludedImages((prev) => [...prev, url]);
  };
  const restoreImage = (url: string) => {
    setExcludedImages((prev) => prev.filter((u) => u !== url));
    setImages((prev) => [...prev, url]);
  };
  const deleteImage = (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url));
    setExcludedImages((prev) => prev.filter((u) => u !== url));
  };

  const addItem = () =>
    setItems((prev) => [...prev, { name: '', price: '', currency: 'USD' }]);
  const removeItem = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) =>
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)),
    );

  const addVendor = () =>
    setVendors((prev) => [...prev, { region: '', name: '', url: '' }]);
  const removeVendor = (i: number) =>
    setVendors((prev) => prev.filter((_, idx) => idx !== i));
  const updateVendor = (i: number, field: string, value: string) =>
    setVendors((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)),
    );

  const buildDraft = (): AdminGroupBuy => ({
    ...groupBuy,
    name,
    type,
    status,
    designer,
    overview: overview || null,
    poster: poster || null,
    gbStart: gbStart || null,
    gbEnd: gbEnd || null,
    estimatedFulfillment: estimatedFulfillment || null,
    basePrice: basePriceAmount
      ? { amount: parseFloat(basePriceAmount), currency: basePriceCurrency }
      : null,
    items: items.map((it) => ({
      name: it.name,
      price: parseFloat(it.price) || 0,
      currency: it.currency,
    })),
    vendors,
    discordUrl: discordUrl || null,
    sourceUrl: sourceUrl || null,
    images,
    excludedImages,
  });

  const handleSave = async () => {
    if (onPreviewSave) {
      onPreviewSave(buildDraft());
      onClose();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name || undefined,
        type: type || undefined,
        status: status || undefined,
        designer: designer || undefined,
        overview: overview || undefined,
        poster: poster || undefined,
        gbStart: gbStart || undefined,
        gbEnd: gbEnd || undefined,
        estimatedFulfillment: estimatedFulfillment || undefined,
        basePrice: basePriceAmount
          ? { amount: parseFloat(basePriceAmount), currency: basePriceCurrency }
          : undefined,
        items: items.map((it) => ({
          name: it.name,
          price: parseFloat(it.price) || 0,
          currency: it.currency,
        })),
        vendors,
        discordUrl: discordUrl || undefined,
        sourceUrl: sourceUrl || undefined,
        images,
        excludedImages,
      };
      const res = await api.patch(
        `/api/groupbuys/admin/${groupBuy.id}`,
        payload,
      );
      onSaved(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'details', label: 'Details' },
    { key: 'dates', label: 'Dates' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'vendors', label: 'Vendors' },
    { key: 'images', label: 'Images' },
  ];

  const totalCount = images.length + excludedImages.length;

  const emptyNote = (msg: string) => (
    <div className="text-[13px] text-km-ink-mute font-km-mono">{msg}</div>
  );

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="gb-overlay fixed inset-0 z-50 bg-black/[0.72] backdrop-blur-sm" />
        <Dialog.Content className="gb-content fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col w-full max-w-[720px] max-h-[calc(100vh-48px)] bg-km-surface border border-km-line rounded-lg shadow-[0_40px_120px_rgba(0,0,0,0.5)] overflow-hidden outline-none">
          <Dialog.Title className="sr-only">{groupBuy.name}</Dialog.Title>

          {/* Header */}
          <div className="flex items-center gap-3.5 p-4 shrink-0">
            <div className="flex-1">
              <div className="font-km-mono text-[9px] text-km-ink-mute tracking-[0.15em] uppercase mb-1">
                Editing group buy
              </div>
              <h2 className="m-0 font-km-body text-[18px] font-semibold tracking-[-0.02em] text-km-ink">
                {groupBuy.name}
              </h2>
            </div>
          </div>

          {/* Tab bar */}
          <div className="border-b border-km-line">
            <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
          </div>

          {/* Tab body */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'details' && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name">
                    <input
                      className={inputCls}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Field>
                  <Field label="Designer">
                    <input
                      className={inputCls}
                      value={designer}
                      onChange={(e) => setDesigner(e.target.value)}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Status">
                    <select
                      className={inputCls}
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">— Select —</option>
                      <option value="IC">IC</option>
                      <option value="GB">GB</option>
                      <option value="closed">Closed</option>
                      <option value="fulfilled">Fulfilled</option>
                    </select>
                  </Field>
                  <Field label="Type">
                    <select
                      className={inputCls}
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
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
                    className={cn(inputCls, 'resize-y')}
                    value={overview}
                    onChange={(e) => setOverview(e.target.value)}
                    rows={6}
                  />
                </Field>
                <Field label="Poster URL">
                  <input
                    className={inputCls}
                    value={poster}
                    onChange={(e) => setPoster(e.target.value)}
                    placeholder="https://..."
                  />
                </Field>
              </div>
            )}

            {activeTab === 'dates' && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="GB Start">
                    <input
                      type="date"
                      className={inputCls}
                      value={gbStart}
                      onChange={(e) => setGbStart(e.target.value)}
                    />
                  </Field>
                  <Field label="GB End">
                    <input
                      type="date"
                      className={inputCls}
                      value={gbEnd}
                      onChange={(e) => setGbEnd(e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Estimated Fulfillment">
                  <input
                    className={inputCls}
                    value={estimatedFulfillment}
                    onChange={(e) => setEstimatedFulfillment(e.target.value)}
                    placeholder="e.g. Q3 2025"
                  />
                </Field>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="flex flex-col gap-5">
                <div>
                  <label className={labelCls}>Base Price</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className={cn(inputCls, 'w-[140px]')}
                      value={basePriceAmount}
                      onChange={(e) => setBasePriceAmount(e.target.value)}
                      placeholder="Amount"
                    />
                    <input
                      className={cn(inputCls, 'w-20')}
                      value={basePriceCurrency}
                      onChange={(e) => setBasePriceCurrency(e.target.value)}
                      placeholder="USD"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className={cn(labelCls, 'mb-0')}>Items / Kits</label>
                    <AddBtn onClick={addItem}>
                      <Plus size={11} /> Add
                    </AddBtn>
                  </div>
                  {items.length === 0 && emptyNote('No items')}
                  <div className="flex flex-col gap-2">
                    {items.map((item, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          className={cn(inputCls, 'flex-1')}
                          value={item.name}
                          onChange={(e) =>
                            updateItem(i, 'name', e.target.value)
                          }
                          placeholder="Name"
                        />
                        <input
                          type="number"
                          className={cn(inputCls, 'w-[90px]')}
                          value={item.price}
                          onChange={(e) =>
                            updateItem(i, 'price', e.target.value)
                          }
                          placeholder="Price"
                        />
                        <input
                          className={cn(inputCls, 'w-[65px]')}
                          value={item.currency}
                          onChange={(e) =>
                            updateItem(i, 'currency', e.target.value)
                          }
                          placeholder="USD"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="bg-transparent border-none cursor-pointer text-km-ink-mute p-1 flex"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vendors' && (
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className={cn(labelCls, 'mb-0')}>Vendors</label>
                    <AddBtn onClick={addVendor}>
                      <Plus size={11} /> Add
                    </AddBtn>
                  </div>
                  {vendors.length === 0 && emptyNote('No vendors')}
                  <div className="flex flex-col gap-2">
                    {vendors.map((v, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          className={cn(inputCls, 'w-[100px]')}
                          value={v.region}
                          onChange={(e) =>
                            updateVendor(i, 'region', e.target.value)
                          }
                          placeholder="Region"
                        />
                        <input
                          className={cn(inputCls, 'flex-1')}
                          value={v.name}
                          onChange={(e) =>
                            updateVendor(i, 'name', e.target.value)
                          }
                          placeholder="Name"
                        />
                        <input
                          className={cn(inputCls, 'flex-1')}
                          value={v.url}
                          onChange={(e) =>
                            updateVendor(i, 'url', e.target.value)
                          }
                          placeholder="URL"
                        />
                        <button
                          type="button"
                          onClick={() => removeVendor(i)}
                          className="bg-transparent border-none cursor-pointer text-km-ink-mute p-1 flex"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <Field label="Discord URL">
                  <input
                    className={inputCls}
                    value={discordUrl}
                    onChange={(e) => setDiscordUrl(e.target.value)}
                    placeholder="https://discord.gg/..."
                  />
                </Field>
                <Field label="Source URL">
                  <input
                    className={inputCls}
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </Field>
              </div>
            )}

            {activeTab === 'images' && (
              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className={labelCls}>Active · drag to reorder</label>
                    <span className="font-km-mono text-[10px] text-km-ink-mute">
                      {images.length} / {totalCount}
                    </span>
                  </div>
                  {images.length === 0 ? (
                    emptyNote('No active images')
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={images}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-3 gap-2.5">
                          {images.map((url, i) => (
                            <SortableImageItem
                              key={url}
                              url={url}
                              index={i}
                              onExclude={() => excludeImage(url)}
                              onDelete={() => deleteImage(url)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
                {excludedImages.length > 0 && (
                  <div>
                    <label className={cn(labelCls, 'mb-3')}>Excluded</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {excludedImages.map((url) => (
                        <ExcludedImageItem
                          key={url}
                          url={url}
                          onRestore={() => restoreImage(url)}
                          onDelete={() => deleteImage(url)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-[14px] border-t border-km-line bg-km-surface shrink-0">
            {error ? (
              <span className="text-[12px] text-km-error font-km-mono">
                {error}
              </span>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="md" disabled={saving} asChild>
                <Dialog.Close>Cancel</Dialog.Close>
              </Button>
              <Button
                variant="solid"
                size="md"
                onClick={handleSave}
                disabled={saving}
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                Save changes
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
