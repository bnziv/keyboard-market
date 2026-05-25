import NavBar from "@/components/NavBar"
import { useState } from "react"
import api from "@/utils/api"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/utils/ToastProvider"
import { useAuth } from "@/utils/AuthProvider"
import { Check, Upload } from "lucide-react"

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
        <label
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink)', letterSpacing: '0.1em' }}
        >
          {label}
        </label>
        {help && <span className="text-xs" style={{ color: 'var(--km-ink-mute)' }}>{help}</span>}
      </div>
      {children}
    </div>
  )
}

const inputCls = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid var(--km-line-strong)',
  borderRadius: '4px',
  background: 'var(--km-surface)',
  color: 'var(--km-ink)',
  fontSize: '14px',
  fontFamily: 'var(--km-font-body)',
  outline: 'none',
} as const

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

  // Listing score
  const scoreItems = [
    { label: 'Title filled in', done: title.trim().length > 0 },
    { label: 'Description added', done: description.trim().length > 0 },
    { label: 'Price or offers set', done: !!price || offers },
    { label: 'Photo uploaded', done: imageUrl.trim().length > 0 },
    { label: 'Condition selected', done: !!condition },
  ]
  const score = Math.round((scoreItems.filter(i => i.done).length / scoreItems.length) * 100)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--km-bg)', color: 'var(--km-ink)' }}>
      <NavBar activePage="create" />
      <main className="flex-1 max-w-5xl mx-auto w-full px-8 py-8 pb-16">
        {/* Header */}
        <div
          className="text-xs uppercase tracking-widest mb-2"
          style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-gold)', letterSpacing: '0.15em', fontSize: '11px' }}
        >
          Step {step + 1} of {STEPS.length} — Listing details
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-1" style={{ letterSpacing: '-0.02em', color: 'var(--km-ink)' }}>
          List a new item
        </h1>
        <p className="text-sm mb-7" style={{ color: 'var(--km-ink-dim)', maxWidth: '560px' }}>
          Spec-rich listings sell faster. Fill in as much detail as you can — buyers here care about the build.
        </p>

        {/* Stepper */}
        <div className="flex items-center mb-9">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 border"
                style={{
                  fontFamily: 'var(--km-font-mono)',
                  background: i === step ? 'var(--km-ink)' : 'var(--km-surface-2)',
                  color: i === step ? 'var(--km-bg)' : 'var(--km-ink-dim)',
                  borderColor: i === step ? 'var(--km-ink)' : 'var(--km-line-strong)',
                }}
              >
                {i + 1}
              </div>
              <span
                className="ml-2.5 text-sm"
                style={{
                  color: i === step ? 'var(--km-ink)' : 'var(--km-ink-dim)',
                  fontWeight: i === step ? 600 : 400,
                }}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-3" style={{ background: 'var(--km-line)' }} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
            {/* Form column */}
            <div>
              <FormRow label="Category">
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCategory(v)}
                      className="py-3 px-2 text-xs font-medium text-center rounded border transition-colors"
                      style={{
                        background: category === v ? 'var(--km-ink)' : 'var(--km-surface)',
                        color: category === v ? 'var(--km-bg)' : 'var(--km-ink-dim)',
                        borderColor: category === v ? 'var(--km-ink)' : 'var(--km-line)',
                        cursor: 'pointer',
                      }}
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
                  style={inputCls}
                />
                <div
                  className="flex justify-between mt-1.5 text-xs"
                  style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', fontSize: '10px' }}
                >
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
                  style={{ ...inputCls, resize: 'vertical', lineHeight: '1.5' }}
                />
                <div
                  className="text-right mt-1 text-xs"
                  style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', fontSize: '10px' }}
                >
                  {description.length}/1000
                </div>
              </FormRow>

              <FormRow label="Condition">
                <div className="grid grid-cols-4 gap-2">
                  {CONDITIONS.map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCondition(v)}
                      className="py-3.5 px-2 text-sm font-medium text-center rounded border transition-colors"
                      style={{
                        background: condition === v ? 'var(--km-ink)' : 'var(--km-surface)',
                        color: condition === v ? 'var(--km-bg)' : 'var(--km-ink)',
                        borderColor: condition === v ? 'var(--km-ink)' : 'var(--km-line)',
                        cursor: 'pointer',
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </FormRow>

              <FormRow label="Photo" help="Imgur direct link (jpg, png, gif, webp)">
                <div className="relative">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://i.imgur.com/example.jpg"
                    style={inputCls}
                  />
                </div>
                <div className="text-xs mt-1.5" style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)', fontSize: '10px' }}>
                  Only Imgur direct image links are accepted
                </div>
              </FormRow>

              <FormRow label="Price">
                <div className="flex gap-3">
                  {/* Price input */}
                  <div className="relative flex-1">
                    <span
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm"
                      style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}
                    >
                      $
                    </span>
                    <input
                      type="number"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="0.00"
                      disabled={offers}
                      style={{
                        ...inputCls,
                        paddingLeft: '28px',
                        fontFamily: 'var(--km-font-mono)',
                        fontSize: '18px',
                        fontWeight: 600,
                        opacity: offers ? 0.4 : 1,
                      }}
                    />
                  </div>
                  {/* Offers toggle */}
                  <div
                    className="flex items-center gap-2.5 px-4 rounded border cursor-pointer flex-shrink-0"
                    style={{
                      background: 'var(--km-surface)',
                      borderColor: 'var(--km-line)',
                    }}
                    onClick={() => setOffers(o => !o)}
                  >
                    <div
                      className="relative flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '20px',
                        borderRadius: '10px',
                        background: offers ? 'var(--km-gold)' : 'var(--km-line-strong)',
                        transition: 'background 150ms',
                        padding: '2px',
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: '#fff',
                          transform: offers ? 'translateX(16px)' : 'translateX(0)',
                          transition: 'transform 150ms',
                        }}
                      />
                    </div>
                    <span className="text-sm whitespace-nowrap" style={{ color: 'var(--km-ink)' }}>Accept offers</span>
                  </div>
                </div>
                {price && !offers && (
                  <div
                    className="flex items-center gap-2.5 mt-2.5 px-3.5 py-2.5 rounded border text-xs"
                    style={{
                      background: 'var(--km-surface-2)',
                      borderColor: 'var(--km-line)',
                      color: 'var(--km-ink-dim)',
                    }}
                  >
                    <span style={{ color: 'var(--km-gold)' }}>⚡</span>
                    <span>
                      <strong style={{ color: 'var(--km-ink)' }}>Price tip:</strong> Check Browse for similar items to price competitively.
                    </span>
                  </div>
                )}
              </FormRow>

              {/* Actions */}
              <div
                className="flex justify-between pt-6 mt-2 border-t"
                style={{ borderColor: 'var(--km-line)' }}
              >
                <button
                  type="button"
                  onClick={() => navigate('/listings')}
                  className="px-4 py-2 text-sm rounded border transition-colors hover:opacity-80"
                  style={{
                    background: 'transparent',
                    color: 'var(--km-ink-dim)',
                    borderColor: 'var(--km-line-strong)',
                    cursor: 'pointer',
                    fontFamily: 'var(--km-font-body)',
                  }}
                >
                  Cancel
                </button>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm rounded border transition-colors hover:opacity-80"
                    style={{
                      background: 'var(--km-surface-2)',
                      color: 'var(--km-ink-dim)',
                      borderColor: 'var(--km-line)',
                      cursor: 'pointer',
                      fontFamily: 'var(--km-font-body)',
                    }}
                  >
                    Save draft
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded transition-opacity hover:opacity-90"
                    style={{
                      background: 'var(--km-ink)',
                      color: 'var(--km-bg)',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--km-font-body)',
                    }}
                  >
                    Publish listing →
                  </button>
                </div>
              </div>
            </div>

            {/* Preview column */}
            <div className="flex flex-col gap-4" style={{ position: 'sticky', top: '72px', alignSelf: 'start' }}>
              <div
                className="text-xs uppercase tracking-widest"
                style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', letterSpacing: '0.15em', fontSize: '10px' }}
              >
                Live preview
              </div>

              {/* Preview card */}
              <div
                className="rounded border overflow-hidden"
                style={{ background: 'var(--km-surface)', borderColor: 'var(--km-line)' }}
              >
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    aspectRatio: '4/3',
                    background: imageUrl ? undefined : 'var(--km-bg-sub)',
                    backgroundImage: imageUrl
                      ? undefined
                      : 'repeating-linear-gradient(-20deg, rgba(212,178,76,0.07) 0, rgba(212,178,76,0.07) 1px, transparent 0, transparent 50%)',
                    backgroundSize: '8px 8px',
                  }}
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="flex flex-col items-center gap-2 text-xs"
                      style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}
                    >
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
                        className="px-2 py-0.5 text-xs rounded border"
                        style={{
                          fontFamily: 'var(--km-font-mono)',
                          background: 'var(--km-surface-2)',
                          borderColor: 'var(--km-line)',
                          color: 'var(--km-ink-dim)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontSize: '10px',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div
                    className="font-semibold text-sm leading-tight"
                    style={{ color: title ? 'var(--km-ink)' : 'var(--km-ink-mute)', minHeight: '2.5rem' }}
                  >
                    {title || 'Your listing title will appear here'}
                  </div>
                  <div className="flex items-baseline justify-between mt-3">
                    <div>
                      <span
                        className="font-semibold text-xl"
                        style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink)' }}
                      >
                        {offers ? 'Open to offers' : price ? `$${price}` : '—'}
                      </span>
                      {offers && price && (
                        <span
                          className="ml-1.5 text-xs"
                          style={{ color: 'var(--km-gold)', fontFamily: 'var(--km-font-mono)' }}
                        >
                          or best offer
                        </span>
                      )}
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)' }}
                    >
                      @{user?.username ?? 'you'} · now
                    </span>
                  </div>
                </div>
              </div>

              {/* Listing score */}
              <div
                className="p-4 rounded border"
                style={{ background: 'var(--km-surface-2)', borderColor: 'var(--km-line)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="text-xs uppercase tracking-widest"
                    style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-gold)', letterSpacing: '0.15em', fontSize: '10px' }}
                  >
                    Listing score
                  </div>
                  <div
                    className="text-sm font-semibold"
                    style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink)' }}
                  >
                    {score}/100
                  </div>
                </div>
                {/* Score bar */}
                <div
                  className="h-1 rounded-full mb-3"
                  style={{ background: 'var(--km-line)' }}
                >
                  <div
                    className="h-1 rounded-full transition-all duration-300"
                    style={{ width: `${score}%`, background: score >= 80 ? 'var(--km-gold)' : 'var(--km-ink-mute)' }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  {scoreItems.map(item => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 border"
                        style={{
                          background: item.done ? 'var(--km-gold)' : 'transparent',
                          borderColor: item.done ? 'var(--km-gold)' : 'var(--km-line-strong)',
                          color: '#fff',
                        }}
                      >
                        {item.done && <Check size={8} strokeWidth={3} />}
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: item.done ? 'var(--km-ink)' : 'var(--km-ink-mute)' }}
                      >
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
