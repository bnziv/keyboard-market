import NavBar from "@/components/NavBar"
import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/utils/ToastProvider"

const CONDITIONS = ['new', 'like new', 'used'] as const;

export default function CreateListing() {
    const { showError, showSuccess } = useToast()
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        condition: '',
        imageUrl: '',
        offers: false,
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
    }

    const validateForm = () => {
        if (!formData.title.trim()) { showError('Title cannot be empty'); return false }
        if (!formData.description.trim()) { showError('Description cannot be empty'); return false }
        if (formData.description.length > 1000) { showError('Description cannot be longer than 1000 characters'); return false }
        if (!formData.offers && !formData.price) { showError('Price cannot be empty'); return false }
        if (formData.price && parseFloat(formData.price) <= 0) { showError('Price must be positive'); return false }
        if (!formData.condition) { showError('Condition cannot be empty'); return false }
        const imgurRegex = /^https?:\/\/(i\.)?imgur\.com\/[a-zA-Z0-9]+(\.jpg|\.jpeg|\.png|\.gif|\.webp)?$/
        if (formData.imageUrl && !imgurRegex.test(formData.imageUrl)) { showError('Invalid image URL — only Imgur links allowed'); return false }
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return
        try {
            const res = await axios.post('/api/listings', formData, { withCredentials: true })
            if (res.status === 201) { showSuccess('Listing created!'); navigate('/listings') }
        } catch {
            showError('Failed to create listing')
        }
    }

    const inputStyle = {
        width: '100%',
        padding: '8px 12px',
        borderRadius: '4px',
        border: '1px solid var(--km-line)',
        background: 'var(--km-bg)',
        color: 'var(--km-ink)',
        fontFamily: 'var(--km-font-body)',
        fontSize: '13px',
        outline: 'none',
    }

    const labelStyle = {
        display: 'block',
        marginBottom: '6px',
        fontSize: '11px',
        fontFamily: 'var(--km-font-mono)',
        color: 'var(--km-ink-mute)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--km-bg)', color: 'var(--km-ink)' }}>
            <NavBar activePage="create" />
            <main className="flex-1 flex flex-col items-center py-12 px-4">
                <div className="w-full max-w-lg">
                    <div className="mb-8">
                        <div className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-gold)', letterSpacing: '0.15em', fontSize: '11px' }}>
                            New listing
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--km-ink)', letterSpacing: '-0.02em' }}>
                            List an item
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div>
                            <label htmlFor="title" style={labelStyle}>Title</label>
                            <input id="title" type="text" placeholder="e.g. Mode Sonnet — Hibiscus" value={formData.title} onChange={handleChange} style={inputStyle} />
                        </div>

                        <div>
                            <label htmlFor="description" style={labelStyle}>Description</label>
                            <textarea
                                id="description"
                                placeholder="Describe condition, included accessories, history…"
                                value={formData.description}
                                onChange={handleChange}
                                rows={5}
                                style={{ ...inputStyle, resize: 'vertical' }}
                            />
                            <div className="text-right text-xs mt-1" style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', fontSize: '10px' }}>
                                {formData.description.length}/1000
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="price" style={labelStyle}>Price (USD)</label>
                                <input
                                    id="price"
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={handleChange}
                                    disabled={formData.offers}
                                    style={{ ...inputStyle, opacity: formData.offers ? 0.4 : 1 }}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Condition</label>
                                <select
                                    value={formData.condition}
                                    onChange={e => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                >
                                    <option value="" disabled>Select…</option>
                                    {CONDITIONS.map(c => (
                                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div
                                onClick={() => setFormData(prev => ({ ...prev, offers: !prev.offers }))}
                                className="w-4 h-4 flex items-center justify-center rounded-sm border flex-shrink-0 cursor-pointer"
                                style={{
                                    background: formData.offers ? 'var(--km-ink)' : 'transparent',
                                    borderColor: formData.offers ? 'var(--km-ink)' : 'var(--km-line-strong)',
                                }}
                            >
                                {formData.offers && (
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <path d="M2 5L4 7L8 3" stroke="var(--km-bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-sm" style={{ color: 'var(--km-ink-dim)', cursor: 'pointer' }} onClick={() => setFormData(prev => ({ ...prev, offers: !prev.offers }))}>
                                Open to offers (sets price to 0)
                            </span>
                        </div>

                        <div>
                            <label htmlFor="imageUrl" style={labelStyle}>Photo (Imgur link)</label>
                            <input
                                id="imageUrl"
                                type="text"
                                placeholder="https://i.imgur.com/example.jpg"
                                value={formData.imageUrl}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                            <div className="text-xs mt-1" style={{ fontFamily: 'var(--km-font-mono)', color: 'var(--km-ink-mute)', fontSize: '10px' }}>
                                Only Imgur direct links accepted
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 font-semibold rounded transition-opacity hover:opacity-90"
                            style={{
                                background: 'var(--km-gold)',
                                color: 'var(--km-bg)',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'var(--km-font-body)',
                                fontSize: '14px',
                            }}
                        >
                            Create listing
                        </button>
                    </form>
                </div>
            </main>
        </div>
    )
}
