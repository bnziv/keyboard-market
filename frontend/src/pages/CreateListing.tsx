import NavBar from "@/components/NavBar"
import { useState } from "react"
import api from "@/utils/api"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/utils/ToastProvider"
import { useAuth } from "@/utils/AuthProvider"
import { Check, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  ['keyboard', 'Keyboard'], ['keycaps', 'Keycaps'], ['switches', 'Switches'],
  ['pcb', 'PCB / Case'], ['artisan', 'Artisan'], ['cable', 'Cable'],
  ['groupbuy', 'Group Buy'], ['other', 'Other'],
] as const

const CONDITIONS = [
  ['new', 'New'], ['like new', 'Like New'], ['used', 'Used'], ['for parts', 'For Parts'],
] as const

const STEPS = ['Details', 'Photos & specs', 'Price & publish'] as const

function FormRow({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-xs font-semibold uppercase font-km-mono text-km-ink tracking-[0.1em]">
          {label}
        </label>
        {help && <span className="text-xs text-km-ink-mute">{help}</span>}
      </div>
      {children}
    </div>
  )
}

const inputCls = "w-full px-[14px] py-[10px] border border-km-line-strong rounded bg-km-surface text-km-ink text-sm font-km-body outline-none box-border"

export default function CreateListing() {
  const { showError, showSuccess } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step] = useState(0)
  const [category, setCategory] = useState('keyboard')
  const [condition, setCondition] = useState('like new')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [offers, setOffers] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  const validateForm = () => {
    if (!title.trim()) { showError('Title cannot be empty'); return false }
    if (!description.trim()) { showError('Description cannot be empty'); return false }
    if (description.length > 1000) { showError('Description cannot be longer than 1000 characters'); return false }
    if (!offers && !price) { showError('Price cannot be empty'); return false }
    if (price && parseFloat(price) <= 0) { showError('Price must be positive'); return false }
    if (!condition) { showError('Condition cannot be empty'); return false }
    const imgurRegex = /^https?:\/\/(i\.)?imgur\.com\/[a-zA-Z0-9]+(\.jpg|\.jpeg|\.png|\.gif|\.webp)?$/
    if (imageUrl && !imgurRegex.test(imageUrl)) { showError('Invalid image URL — only Imgur links allowed'); return false }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      const res = await api.post('/api/listings', { title, description, price, condition, imageUrl, offers })
      if (res.status === 201) { showSuccess('Listing created!'); navigate('/listings') }
    } catch {
      showError('Failed to create listing')
    }
  }

  const scoreItems = [
    { label: 'Title filled in', done: title.trim().length > 0 },
    { label: 'Description added', done: description.trim().length > 0 },
    { label: 'Price or offers set', done: !!price || offers },
    { label: 'Photo uploaded', done: imageUrl.trim().length > 0 },
    { label: 'Condition selected', done: !!condition },
  ]
  const score = Math.round((scoreItems.filter(i => i.done).length / scoreItems.length) * 100)

  return (
    <div className="min-h-screen flex flex-col bg-km-bg text-km-ink">
      <NavBar activePage="create" />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 pb-16">
        {/* Header */}
        <div className="font-km-mono text-[11px] uppercase text-km-gold tracking-[0.15em] mb-2">
          Step {step + 1} of {STEPS.length} — Listing details
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-km-ink mb-1">
          List a new item
        </h1>
        <p className="text-sm text-km-ink-dim mb-7" style={{ maxWidth: '560px' }}>
          Spec-rich listings sell faster. Fill in as much detail as you can — buyers here care about the build.
        </p>

        {/* Stepper */}
        <div className="flex items-center mb-9">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 border font-km-mono',
                  i === step ? 'bg-km-ink text-km-bg border-km-ink' : 'bg-km-surface-2 text-km-ink-dim border-km-line-strong'
                )}
              >
                {i + 1}
              </div>
              <span className={cn('ml-2.5 text-sm', i === step ? 'text-km-ink font-semibold' : 'text-km-ink-dim')}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-3 bg-km-line" />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
            {/* Form column */}
            <div>
              <FormRow label="Category">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCategory(v)}
                      className={cn(
                        'py-3 px-2 text-xs font-medium text-center rounded border transition-colors cursor-pointer',
                        category === v ? 'bg-km-ink text-km-bg border-km-ink' : 'bg-km-surface text-km-ink-dim border-km-line'
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </FormRow>

              <FormRow label="Title" help="Be specific — include colorway and key details">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Mode Sonnet — Hibiscus, Brass Weight"
                  className={inputCls}
                />
                <div className="flex justify-between mt-1.5 font-km-mono text-[10px] text-km-ink-mute">
                  <span>{title.length > 0 ? '✓ Title looks good' : 'Required'}</span>
                  <span>{title.length}/80</span>
                </div>
              </FormRow>

              <FormRow label="Description" help="Condition, included accessories, why selling?">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the item's condition, what's included, any flaws…"
                  rows={5}
                  className={cn(inputCls, "resize-y leading-[1.5]")}
                />
                <div className="text-right mt-1 font-km-mono text-[10px] text-km-ink-mute">
                  {description.length}/1000
                </div>
              </FormRow>

              <FormRow label="Condition">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CONDITIONS.map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCondition(v)}
                      className={cn(
                        'py-3.5 px-2 text-sm font-medium text-center rounded border transition-colors cursor-pointer',
                        condition === v ? 'bg-km-ink text-km-bg border-km-ink' : 'bg-km-surface text-km-ink border-km-line'
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </FormRow>

              <FormRow label="Photo" help="Imgur direct link (jpg, png, gif, webp)">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://i.imgur.com/example.jpg"
                  className={inputCls}
                />
                <div className="mt-1.5 font-km-mono text-[10px] text-km-ink-mute">
                  Only Imgur direct image links are accepted
                </div>
              </FormRow>

              <FormRow label="Price">
                <div className="flex gap-3">
                  {/* Price input */}
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-km-ink-mute font-km-mono">
                      $
                    </span>
                    <input
                      type="number"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="0.00"
                      disabled={offers}
                      className={cn(inputCls, "pl-7 font-km-mono text-lg font-semibold", offers && "opacity-40")}
                    />
                  </div>
                  {/* Offers toggle */}
                  <div
                    className="flex items-center gap-2.5 px-4 rounded border cursor-pointer flex-shrink-0 bg-km-surface border-km-line"
                    onClick={() => setOffers(o => !o)}
                  >
                    <div
                      className={cn('relative flex-shrink-0', offers ? 'bg-km-gold' : 'bg-km-line-strong')}
                      style={{ width: '36px', height: '20px', borderRadius: '10px', padding: '2px', transition: 'background 150ms' }}
                    >
                      <div
                        className="bg-white"
                        style={{
                          width: '16px', height: '16px', borderRadius: '50%',
                          transform: offers ? 'translateX(16px)' : 'translateX(0)',
                          transition: 'transform 150ms',
                        }}
                      />
                    </div>
                    <span className="text-sm whitespace-nowrap text-km-ink">Accept offers</span>
                  </div>
                </div>
                {price && !offers && (
                  <div className="flex items-center gap-2.5 mt-2.5 px-3.5 py-2.5 rounded border text-xs bg-km-surface-2 border-km-line text-km-ink-dim">
                    <span className="text-km-gold">⚡</span>
                    <span>
                      <strong className="text-km-ink">Price tip:</strong> Check Browse for similar items to price competitively.
                    </span>
                  </div>
                )}
              </FormRow>

              {/* Actions */}
              <div className="flex justify-between pt-6 mt-2 border-t border-km-line">
                <Button type="button" variant="outline" onClick={() => navigate('/listings')}>
                  Cancel
                </Button>
                <div className="flex gap-2.5">
                  <Button type="button" variant="surface">
                    Save draft
                  </Button>
                  <Button type="submit" variant="solid" size="lg">
                    Publish listing →
                  </Button>
                </div>
              </div>
            </div>

            {/* Preview column — hidden on mobile */}
            <div className="hidden lg:flex flex-col gap-4" style={{ position: 'sticky', top: '72px', alignSelf: 'start' }}>
              <div className="font-km-mono text-[10px] uppercase text-km-ink-mute tracking-[0.15em]">
                Live preview
              </div>

              {/* Preview card */}
              <div className="rounded border overflow-hidden bg-km-surface border-km-line">
                <div
                  className={cn('relative flex items-center justify-center', !imageUrl && 'bg-km-bg-sub')}
                  style={{
                    aspectRatio: '4/3',
                    backgroundImage: imageUrl
                      ? undefined
                      : 'repeating-linear-gradient(-20deg, rgba(212,178,76,0.07) 0, rgba(212,178,76,0.07) 1px, transparent 0, transparent 50%)',
                    backgroundSize: '8px 8px',
                  }}
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-xs text-km-ink-mute font-km-mono">
                      <Upload size={20} style={{ opacity: 0.4 }} />
                      <span>photo preview</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex gap-2 flex-wrap mb-2.5">
                    {[category, condition].map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] rounded border font-km-mono bg-km-surface-2 border-km-line text-km-ink-dim uppercase tracking-[0.05em]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div
                    className={cn('font-semibold text-sm leading-tight', title ? 'text-km-ink' : 'text-km-ink-mute')}
                    style={{ minHeight: '2.5rem' }}
                  >
                    {title || 'Your listing title will appear here'}
                  </div>
                  <div className="flex items-baseline justify-between mt-3">
                    <div>
                      <span className="font-semibold text-xl font-km-mono text-km-ink">
                        {offers ? 'Open to offers' : price ? `$${price}` : '—'}
                      </span>
                      {offers && price && (
                        <span className="ml-1.5 text-xs text-km-gold font-km-mono">
                          or best offer
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-km-ink-mute font-km-mono">
                      @{user?.username ?? 'you'} · now
                    </span>
                  </div>
                </div>
              </div>

              {/* Listing score */}
              <div className="p-4 rounded border bg-km-surface-2 border-km-line">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-km-mono text-[10px] uppercase text-km-gold tracking-[0.15em]">
                    Listing score
                  </div>
                  <div className="text-sm font-semibold font-km-mono text-km-ink">
                    {score}/100
                  </div>
                </div>
                <div className="h-1 rounded-full mb-3 bg-km-line">
                  <div
                    className={cn('h-1 rounded-full transition-all duration-300', score >= 80 ? 'bg-km-gold' : 'bg-km-ink-mute')}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  {scoreItems.map(item => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 border',
                          item.done ? 'bg-km-gold border-km-gold text-white' : 'bg-transparent border-km-line-strong'
                        )}
                      >
                        {item.done && <Check size={8} strokeWidth={3} />}
                      </div>
                      <span className={cn('text-xs', item.done ? 'text-km-ink' : 'text-km-ink-mute')}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
