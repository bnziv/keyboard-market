import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/utils/ToastProvider"
import { useAuth } from "@/utils/AuthProvider"
import axios from "axios"
import API_URL from "@/utils/config"
import { ArrowLeft, ArrowRight, Eye, EyeOff, Check } from "lucide-react"
import { FcGoogle } from "react-icons/fc"

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = 'signin' | 'signup'

interface FormState {
  identifier: string
  email: string
  username: string
  password: string
  rememberMe: boolean
  interests: string[]
  displayName: string
  location: string
}

// ── Shared sub-components ─────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '1px solid var(--km-line-strong)',
  borderRadius: 6,
  background: 'var(--km-surface)',
  color: 'var(--km-ink)',
  fontSize: 14,
  fontFamily: 'var(--km-font-body)',
  outline: 'none',
  boxSizing: 'border-box',
}

function FieldLabel({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
      <label style={{
        fontFamily: 'var(--km-font-mono)', fontSize: 10,
        color: 'var(--km-ink-dim)', letterSpacing: '0.1em',
        textTransform: 'uppercase', fontWeight: 600,
      }}>{label}</label>
      {right}
    </div>
  )
}

function Field({ label, right, help, style, children }: {
  label: string
  right?: React.ReactNode
  help?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 18, ...style }}>
      <FieldLabel label={label} right={right} />
      {children}
      {help && (
        <div style={{ marginTop: 6, fontFamily: 'var(--km-font-mono)', fontSize: 10, color: 'var(--km-ink-mute)' }}>
          {help}
        </div>
      )}
    </div>
  )
}

function OAuthBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button type="button" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: '11px 16px',
      border: '1px solid var(--km-line-strong)',
      borderRadius: 6,
      background: 'var(--km-surface)', color: 'var(--km-ink)',
      fontSize: 13, fontWeight: 500, cursor: 'pointer',
      fontFamily: 'var(--km-font-body)',
      width: '100%',
    }}>
      {icon}
      <span>{label}</span>
    </button>
  )
}

function PrimaryBtn({ children, onClick, type = 'button', style }: {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  style?: React.CSSProperties
}) {
  return (
    <button type={type} onClick={onClick} style={{
      width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '13px',
      border: '1px solid var(--km-ink)',
      borderRadius: 6,
      background: 'var(--km-ink)', color: 'var(--km-bg)',
      fontSize: 14, fontWeight: 600, cursor: 'pointer',
      fontFamily: 'var(--km-font-body)',
      transition: 'all 120ms ease',
      ...style,
    }}>
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '13px 20px',
      border: '1px solid var(--km-line-strong)',
      borderRadius: 6,
      background: 'transparent', color: 'var(--km-ink)',
      fontSize: 14, fontWeight: 500, cursor: 'pointer',
      fontFamily: 'var(--km-font-body)',
    }}>
      {children}
    </button>
  )
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <div
        onClick={onChange}
        style={{
          width: 16, height: 16, flexShrink: 0, marginTop: 1,
          border: '1px solid var(--km-line-strong)',
          borderRadius: 3,
          background: checked ? 'var(--km-ink)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--km-bg)', cursor: 'pointer',
        }}
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </div>
      <span style={{ fontSize: 13, color: 'var(--km-ink-dim)', lineHeight: 1.5 }}>{label}</span>
    </div>
  )
}

// ── Password strength ─────────────────────────────────────────────────────────

function getPasswordStrength(pw: string): number {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^a-zA-Z0-9]/.test(pw)) s++
  if (pw.length >= 12) s++
  return Math.min(s, 4)
}

function PasswordStrengthBar({ strength }: { strength: number }) {
  const color = strength >= 3 ? 'var(--km-gold)' : strength >= 2 ? 'var(--km-gold)' : 'var(--km-line-strong)'
  return (
    <>
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 1,
            background: i < strength ? color : 'var(--km-line)',
            transition: 'background 200ms',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--km-font-mono)', fontSize: 10, color: 'var(--km-ink-mute)' }}>
        <span>min 8 chars · 1 number · 1 symbol</span>
        {strength > 0 && (
          <span style={{ color: strength >= 3 ? 'var(--km-gold)' : 'var(--km-ink-mute)' }}>
            {(['weak', 'okay', 'good', 'strong'])[strength - 1]}
          </span>
        )}
      </div>
    </>
  )
}

// ── Form screens ──────────────────────────────────────────────────────────────

function SignInForm({ form, setForm, onSubmit, switchMode }: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  onSubmit: (e: React.FormEvent) => void
  switchMode: (m: Mode) => void
}) {
  const [showPw, setShowPw] = useState(false)

  return (
    <form onSubmit={onSubmit}>
      <div style={{
        fontFamily: 'var(--km-font-mono)', fontSize: 11,
        color: 'var(--km-gold)', letterSpacing: '0.2em',
        textTransform: 'uppercase', marginBottom: 10,
      }}>Sign in</div>
      <h2 style={{
        margin: 0,
        fontFamily: 'var(--km-font-body)',
        fontSize: 28, fontWeight: 600,
        letterSpacing: '-0.02em', color: 'var(--km-ink)',
      }}>Sign in to your account</h2>
      <p style={{ marginTop: 8, color: 'var(--km-ink-dim)', fontSize: 13 }}>
        Welcome back. Pick up where you left off.
      </p>

      <div style={{ marginTop: 28 }}>
        <OAuthBtn label="Continue with Google" icon={<FcGoogle size={16} />} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--km-line)' }} />
        <span style={{ fontFamily: 'var(--km-font-mono)', fontSize: 10, color: 'var(--km-ink-mute)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>or with email</span>
        <div style={{ flex: 1, height: 1, background: 'var(--km-line)' }} />
      </div>

      <Field label="Email or username">
        <input
          type="text"
          value={form.identifier}
          onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
          placeholder="you@example.com"
          style={inputStyle}
        />
      </Field>

      <Field
        label="Password"
        right={
          <span style={{ fontFamily: 'var(--km-font-mono)', fontSize: 10, color: 'var(--km-gold)', cursor: 'pointer', letterSpacing: '0.05em' }}>
            Forgot?
          </span>
        }
      >
        <div style={{ position: 'relative' }}>
          <input
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="••••••••"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--km-ink-mute)', padding: 6,
            }}
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </Field>

      <div style={{ marginBottom: 24 }}>
        <Checkbox
          checked={form.rememberMe}
          onChange={() => setForm(f => ({ ...f, rememberMe: !f.rememberMe }))}
          label="Keep me signed in on this device"
        />
      </div>

      <PrimaryBtn type="submit">
        Sign in <ArrowRight size={14} />
      </PrimaryBtn>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--km-ink-dim)' }}>
        New here?{' '}
        <span
          onClick={() => switchMode('signup')}
          style={{ color: 'var(--km-gold)', fontWeight: 500, cursor: 'pointer' }}
        >
          Create an account →
        </span>
      </div>
    </form>
  )
}

function SignUpStep1({ form, setForm, onContinue, switchMode, showError }: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  onContinue: () => void
  switchMode: (m: Mode) => void
  showError: (msg: string) => void
}) {
  const [agreed, setAgreed] = useState(false)
  const pwStrength = getPasswordStrength(form.password)

  const handleContinue = () => {
    if (!form.username.trim()) { showError("Username cannot be empty"); return }
    if (!form.email.trim()) { showError("Email cannot be empty"); return }
    if (!form.password.trim()) { showError("Password cannot be empty"); return }
    if (!agreed) { showError("Please agree to the terms"); return }
    onContinue()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--km-font-mono)', fontSize: 11, color: 'var(--km-gold)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Step 1 of 2
        </div>
        <div style={{ flex: 1, height: 2, background: 'var(--km-line)', borderRadius: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '50%', background: 'var(--km-gold)', borderRadius: 1 }} />
        </div>
      </div>

      <h2 style={{
        margin: 0,
        fontFamily: 'var(--km-font-body)',
        fontSize: 28, fontWeight: 600,
        letterSpacing: '-0.02em', color: 'var(--km-ink)',
      }}>Create your account</h2>
      <p style={{ marginTop: 8, color: 'var(--km-ink-dim)', fontSize: 13 }}>
        Free, takes about a minute. Verified by email — no card required.
      </p>

      <div style={{ marginTop: 28 }}>
        <Field
          label="Username"
          right={
            form.username.trim().length > 2 ? (
              <span style={{ fontFamily: 'var(--km-font-mono)', fontSize: 10, color: 'var(--km-gold)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Check size={10} strokeWidth={3} /> available
              </span>
            ) : undefined
          }
        >
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--km-ink-mute)', fontFamily: 'var(--km-font-mono)', fontSize: 14,
              pointerEvents: 'none',
            }}>@</span>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="yourname"
              style={{ ...inputStyle, paddingLeft: 32, fontFamily: 'var(--km-font-mono)' }}
            />
          </div>
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com"
            style={inputStyle}
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="••••••••"
            style={inputStyle}
          />
          <PasswordStrengthBar strength={pwStrength} />
        </Field>

        <div style={{ marginBottom: 20 }}>
          <Checkbox
            checked={agreed}
            onChange={() => setAgreed(v => !v)}
            label={
              <>
                I agree to the{' '}
                <span style={{ color: 'var(--km-gold)', cursor: 'pointer' }}>Terms</span>
                {' '}and the{' '}
                <span style={{ color: 'var(--km-gold)', cursor: 'pointer' }}>community guidelines</span>
                . I'll only sell items I actually own.
              </>
            }
          />
        </div>

        <PrimaryBtn onClick={handleContinue}>
          Continue <ArrowRight size={14} />
        </PrimaryBtn>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--km-ink-dim)' }}>
          Already a member?{' '}
          <span
            onClick={() => switchMode('signin')}
            style={{ color: 'var(--km-gold)', fontWeight: 500, cursor: 'pointer' }}
          >
            Sign in →
          </span>
        </div>
      </div>
    </div>
  )
}

const INTERESTS = [
  'Keyboards', 'Keycaps', 'Linear switches', 'Tactile switches',
  'Clicky switches', 'PCBs / cases', 'Artisans', 'Cables', 'Group buys',
]

function SignUpStep2({ form, setForm, onBack, onFinish }: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  onBack: () => void
  onFinish: () => void
}) {
  const toggle = (o: string) => setForm(f => ({
    ...f,
    interests: f.interests.includes(o) ? f.interests.filter(x => x !== o) : [...f.interests, o],
  }))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--km-font-mono)', fontSize: 11, color: 'var(--km-gold)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Step 2 of 2
        </div>
        <div style={{ flex: 1, height: 2, background: 'var(--km-line)', borderRadius: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '100%', background: 'var(--km-gold)', borderRadius: 1 }} />
        </div>
      </div>

      <h2 style={{
        margin: 0,
        fontFamily: 'var(--km-font-body)',
        fontSize: 28, fontWeight: 600,
        letterSpacing: '-0.02em', color: 'var(--km-ink)',
      }}>What are you into?</h2>
      <p style={{ marginTop: 8, color: 'var(--km-ink-dim)', fontSize: 13 }}>
        We'll tailor your feed and notify you about group buys that match. You can change this any time.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
        {INTERESTS.map(o => {
          const on = form.interests.includes(o)
          return (
            <div
              key={o}
              onClick={() => toggle(o)}
              style={{
                padding: '8px 14px',
                border: on ? '1px solid var(--km-ink)' : '1px solid var(--km-line-strong)',
                background: on ? 'var(--km-ink)' : 'transparent',
                color: on ? 'var(--km-bg)' : 'var(--km-ink-dim)',
                borderRadius: 6,
                fontSize: 12, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                transition: 'all 120ms',
              }}
            >
              {on && <Check size={10} strokeWidth={3} />}
              {o}
            </div>
          )
        })}
      </div>

      <Field label="Display name (optional)" style={{ marginTop: 24 }}>
        <input
          type="text"
          value={form.displayName}
          onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
          placeholder="Your name"
          style={inputStyle}
        />
      </Field>

      <Field
        label="Location (optional)"
        help="Helps with shipping estimates. Hidden until you list."
      >
        <input
          type="text"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          placeholder="City, State"
          style={inputStyle}
        />
      </Field>

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <GhostBtn onClick={onBack}>
          <ArrowLeft size={14} /> Back
        </GhostBtn>
        <PrimaryBtn onClick={onFinish} style={{ flex: 1 }}>
          Finish &amp; enter market <ArrowRight size={14} />
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Login() {
  const { showError, showSuccess } = useToast()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('signin')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>({
    identifier: '',
    email: '',
    username: '',
    password: '',
    rememberMe: true,
    interests: ['Keyboards'],
    displayName: '',
    location: '',
  })

  const switchMode = (m: Mode) => { setMode(m); setStep(1) }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.identifier.trim()) { showError("Email or username cannot be empty"); return }
    if (!form.password.trim()) { showError("Password cannot be empty"); return }
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        identifier: form.identifier,
        password: form.password,
      }, { withCredentials: true })
      if (res.status === 200) {
        login(res.data)
        showSuccess("Welcome back!")
        setTimeout(() => navigate("/listings"), 1500)
      }
    } catch (err: any) {
      showError(err.response?.data?.error ?? "Failed to sign in")
    }
  }

  const handleRegister = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        email: form.email,
        username: form.username,
        password: form.password,
      }, { withCredentials: true })
      if (res.status === 200) {
        login(res.data)
        showSuccess("Welcome to KBMARKET!")
        setTimeout(() => navigate("/listings"), 1500)
      }
    } catch (err: any) {
      showError(err.response?.data?.error ?? "Failed to register")
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      background: 'var(--km-bg)',
      color: 'var(--km-ink)',
    }}>

      {/* ── Left: brand panel ── */}
      <aside style={{
        background: 'var(--km-bg-sub)',
        borderRight: '1px solid var(--km-line)',
        padding: '40px 56px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at top right, rgba(212,178,76,0.08), transparent 60%), radial-gradient(ellipse at bottom left, rgba(139,122,212,0.12), transparent 50%)',
        }} />

        {/* Brand */}
        <div onClick={() => navigate('/')} style={{ position: 'relative', cursor: 'pointer' }}>
          <span style={{ fontFamily: 'var(--km-font-body)', fontWeight: 700, letterSpacing: '-0.02em', fontSize: 18, color: 'var(--km-ink)' }}>
            <span style={{ color: 'var(--km-gold)' }}>◆</span> KBMARKET
          </span>
        </div>

        {/* Hero copy */}
        <div style={{ position: 'relative', marginTop: 'auto', marginBottom: 'auto' }}>
          <div style={{
            fontFamily: 'var(--km-font-mono)', fontSize: 11,
            color: 'var(--km-gold)', letterSpacing: '0.2em',
            textTransform: 'uppercase', marginBottom: 20,
          }}>
            {mode === 'signin' ? 'Welcome back' : '· New member'}
          </div>

          <h1 style={{
            margin: 0,
            fontFamily: 'var(--km-font-body)',
            fontSize: 48, fontWeight: 700,
            lineHeight: 1.05, letterSpacing: '-0.03em',
            color: 'var(--km-ink)', maxWidth: 460,
          }}>
            {mode === 'signin' ? (
              <>The market is<br />where you left it.</>
            ) : (
              <>Join the people<br />behind the keys.</>
            )}
          </h1>

          <p style={{ marginTop: 22, maxWidth: 420, fontSize: 15, lineHeight: 1.6, color: 'var(--km-ink-dim)' }}>
            {mode === 'signin'
              ? 'Pick up your saved searches, watchlist, and conversations. Your reputation comes with you.'
              : 'A small, verified community trading enthusiast keyboards, switches, and keycaps. No bots, no scalpers.'}
          </p>

          {/* Trust strip */}
          <div style={{
            marginTop: 36, padding: '18px 22px',
            border: '1px solid var(--km-line)',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.02)',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28,
            maxWidth: 460,
          }}>
            {([
              ['18.2k', 'verified members'],
              ['$1.4M', 'traded · 30d'],
              ['99.2%', 'ship-on-time'],
            ] as const).map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: 'var(--km-font-body)', fontSize: 22, fontWeight: 600, color: 'var(--km-ink)', letterSpacing: '-0.02em' }}>
                  {v}
                </div>
                <div style={{ fontFamily: 'var(--km-font-mono)', fontSize: 9, color: 'var(--km-ink-mute)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', marginTop: 20 }}>
          <div style={{
            paddingTop: 20, borderTop: '1px solid var(--km-line)',
            fontFamily: 'var(--km-font-mono)', fontSize: 11,
            color: 'var(--km-ink-mute)', letterSpacing: '0.05em',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>v2.14 · est. 2021</span>
            <span>built for the click</span>
          </div>
        </div>
      </aside>

      {/* ── Right: form panel ── */}
      <main style={{
        background: 'var(--km-bg)',
        padding: '40px 56px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              color: 'var(--km-ink-dim)', fontFamily: 'var(--km-font-mono)', fontSize: 12,
              letterSpacing: '0.05em', padding: 0,
            }}
          >
            <ArrowLeft size={14} /> Back to home
          </button>

          <div style={{
            display: 'flex', gap: 4, padding: 4,
            border: '1px solid var(--km-line)',
            borderRadius: 6,
            background: 'var(--km-surface)',
          }}>
            {([['signin', 'Sign in'], ['signup', 'Create account']] as [Mode, string][]).map(([v, l]) => {
              const active = mode === v
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => switchMode(v)}
                  style={{
                    padding: '7px 18px',
                    border: 'none',
                    borderRadius: 4,
                    background: active ? 'var(--km-ink)' : 'transparent',
                    color: active ? 'var(--km-bg)' : 'var(--km-ink-dim)',
                    fontSize: 12, fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--km-font-body)',
                    whiteSpace: 'nowrap',
                    transition: 'all 120ms',
                  }}
                >
                  {l}
                </button>
              )
            })}
          </div>
        </div>

        {/* Form body — vertically centered */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px 0',
        }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            {mode === 'signin' ? (
              <SignInForm
                form={form}
                setForm={setForm}
                onSubmit={handleSignIn}
                switchMode={switchMode}
              />
            ) : step === 1 ? (
              <SignUpStep1
                form={form}
                setForm={setForm}
                onContinue={() => setStep(2)}
                switchMode={switchMode}
                showError={showError}
              />
            ) : (
              <SignUpStep2
                form={form}
                setForm={setForm}
                onBack={() => setStep(1)}
                onFinish={handleRegister}
              />
            )}
          </div>
        </div>

        {/* Legal footer */}
        <div style={{
          fontFamily: 'var(--km-font-mono)', fontSize: 10,
          color: 'var(--km-ink-mute)', letterSpacing: '0.05em',
          display: 'flex', justifyContent: 'space-between',
          paddingTop: 20, borderTop: '1px solid var(--km-line)',
        }}>
          <span>© 2026 Keyboard Market</span>
          <div style={{ display: 'flex', gap: 18 }}>
            <span style={{ cursor: 'pointer' }}>Terms</span>
            <span style={{ cursor: 'pointer' }}>Privacy</span>
            <span style={{ cursor: 'pointer' }}>Help</span>
          </div>
        </div>
      </main>
    </div>
  )
}
