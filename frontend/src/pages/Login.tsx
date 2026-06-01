import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/utils/ToastProvider';
import { useAuth } from '@/utils/AuthProvider';
import api from '@/utils/api';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Check } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { cn } from '@/lib/utils';

type Mode = 'signin' | 'signup';

interface FormState {
  identifier: string;
  email: string;
  username: string;
  password: string;
  rememberMe: boolean;
  interests: string[];
  displayName: string;
  location: string;
}

const inputCls =
  'w-full px-[14px] py-[11px] border border-km-line-strong rounded-[6px] bg-km-surface text-km-ink text-sm font-km-body outline-none box-border';

function FieldLabel({
  label,
  right,
}: {
  label: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <label className="font-km-mono text-[10px] text-km-ink-dim tracking-[0.1em] uppercase font-semibold">
        {label}
      </label>
      {right}
    </div>
  );
}

function Field({
  label,
  right,
  help,
  className,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  help?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('mb-[18px]', className)}>
      <FieldLabel label={label} right={right} />
      {children}
      {help && (
        <div className="mt-1.5 font-km-mono text-[10px] text-km-ink-mute">
          {help}
        </div>
      )}
    </div>
  );
}

function OAuthBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-2.5 w-full py-[11px] px-4 border border-km-line-strong rounded-[6px] bg-km-surface text-km-ink text-[13px] font-medium cursor-pointer font-km-body"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function PrimaryBtn({
  children,
  onClick,
  type = 'button',
  className,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center justify-center gap-2 py-[13px] border border-km-ink rounded-[6px] bg-km-ink text-km-bg text-sm font-semibold cursor-pointer font-km-body transition-all duration-[120ms] disabled:opacity-60 disabled:cursor-not-allowed',
        className,
      )}
    >
      {children}
    </button>
  );
}

function GhostBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 py-[13px] px-5 border border-km-line-strong rounded-[6px] bg-transparent text-km-ink text-sm font-medium cursor-pointer font-km-body"
    >
      {children}
    </button>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <div
        onClick={onChange}
        className={cn(
          'w-4 h-4 flex-shrink-0 mt-px border border-km-line-strong rounded-[3px] flex items-center justify-center text-km-bg cursor-pointer',
          checked ? 'bg-km-ink' : 'bg-transparent',
        )}
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </div>
      <span className="text-[13px] text-km-ink-dim leading-[1.5]">{label}</span>
    </div>
  );
}

function getPasswordStrength(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  if (pw.length >= 12) s++;
  return Math.min(s, 4);
}

function PasswordStrengthBar({ strength }: { strength: number }) {
  const activeColor = strength >= 2 ? 'bg-km-gold' : 'bg-km-line-strong';
  return (
    <>
      <div className="flex gap-1 mt-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'flex-1 h-[3px] rounded-[1px] transition-colors duration-200',
              i < strength ? activeColor : 'bg-km-line',
            )}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1.5 font-km-mono text-[10px] text-km-ink-mute">
        <span>min 8 chars · 1 number · 1 symbol</span>
        {strength > 0 && (
          <span className={strength >= 3 ? 'text-km-gold' : 'text-km-ink-mute'}>
            {['weak', 'okay', 'good', 'strong'][strength - 1]}
          </span>
        )}
      </div>
    </>
  );
}

function SignInForm({
  form,
  setForm,
  onSubmit,
  switchMode,
  isLoading,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: (e: React.FormEvent) => void;
  switchMode: (m: Mode) => void;
  isLoading: boolean;
}) {
  const [showPw, setShowPw] = useState(false);

  return (
    <form onSubmit={onSubmit}>
      <div className="font-km-mono text-[11px] text-km-gold tracking-[0.2em] uppercase mb-2.5">
        Sign in
      </div>
      <h2 className="m-0 font-km-body text-[28px] font-semibold tracking-[-0.02em] text-km-ink">
        Sign in to your account
      </h2>
      <p className="mt-2 text-[13px] text-km-ink-dim">
        Welcome back. Pick up where you left off.
      </p>

      <div className="mt-7">
        <OAuthBtn label="Continue with Google" icon={<FcGoogle size={16} />} />
      </div>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-km-line" />
        <span className="font-km-mono text-[10px] text-km-ink-mute tracking-[0.15em] uppercase">
          or with email
        </span>
        <div className="flex-1 h-px bg-km-line" />
      </div>

      <Field label="Email or username">
        <input
          type="text"
          value={form.identifier}
          onChange={(e) =>
            setForm((f) => ({ ...f, identifier: e.target.value }))
          }
          placeholder="you@example.com"
          className={inputCls}
        />
      </Field>

      <Field
        label="Password"
        right={
          <span className="font-km-mono text-[10px] text-km-gold cursor-pointer tracking-[0.05em]">
            Forgot?
          </span>
        }
      >
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            placeholder="••••••••"
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-km-ink-mute p-1.5"
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </Field>

      <div className="mb-6">
        <Checkbox
          checked={form.rememberMe}
          onChange={() => setForm((f) => ({ ...f, rememberMe: !f.rememberMe }))}
          label="Keep me signed in on this device"
        />
      </div>

      <PrimaryBtn type="submit" disabled={isLoading}>
        {isLoading ? (
          'Signing in…'
        ) : (
          <>
            <span>Sign in</span> <ArrowRight size={14} />
          </>
        )}
      </PrimaryBtn>

      <div className="mt-6 text-center text-[13px] text-km-ink-dim">
        New here?{' '}
        <span
          onClick={() => switchMode('signup')}
          className="text-km-gold font-medium cursor-pointer"
        >
          Create an account →
        </span>
      </div>
    </form>
  );
}

function SignUpStep1({
  form,
  setForm,
  onContinue,
  switchMode,
  showError,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onContinue: () => void;
  switchMode: (m: Mode) => void;
  showError: (msg: string) => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const pwStrength = getPasswordStrength(form.password);

  const handleContinue = () => {
    if (!form.username.trim()) {
      showError('Username cannot be empty');
      return;
    }
    if (!form.email.trim()) {
      showError('Email cannot be empty');
      return;
    }
    if (!form.password.trim()) {
      showError('Password cannot be empty');
      return;
    }
    if (!agreed) {
      showError('Please agree to the terms');
      return;
    }
    onContinue();
  };

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="font-km-mono text-[11px] text-km-gold tracking-[0.2em] uppercase">
          Step 1 of 2
        </div>
        <div className="flex-1 h-0.5 bg-km-line rounded-[1px] relative">
          <div className="absolute left-0 top-0 h-full w-1/2 bg-km-gold rounded-[1px]" />
        </div>
      </div>

      <h2 className="m-0 font-km-body text-[28px] font-semibold tracking-[-0.02em] text-km-ink">
        Create your account
      </h2>
      <p className="mt-2 text-[13px] text-km-ink-dim">
        Free, takes about a minute. Verified by email — no card required.
      </p>

      <div className="mt-7">
        <Field
          label="Username"
          right={
            form.username.trim().length > 2 ? (
              <span className="font-km-mono text-[10px] text-km-gold flex items-center gap-1">
                <Check size={10} strokeWidth={3} /> available
              </span>
            ) : undefined
          }
        >
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-km-ink-mute font-km-mono text-sm pointer-events-none">
              @
            </span>
            <input
              type="text"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
              placeholder="yourname"
              className={cn(inputCls, 'pl-8 font-km-mono')}
            />
          </div>
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com"
            className={inputCls}
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            placeholder="••••••••"
            className={inputCls}
          />
          <PasswordStrengthBar strength={pwStrength} />
        </Field>

        <div className="mb-5">
          <Checkbox
            checked={agreed}
            onChange={() => setAgreed((v) => !v)}
            label={
              <>
                I agree to the{' '}
                <span className="text-km-gold cursor-pointer">Terms</span> and
                the{' '}
                <span className="text-km-gold cursor-pointer">
                  community guidelines
                </span>
                . I'll only sell items I actually own.
              </>
            }
          />
        </div>

        <PrimaryBtn onClick={handleContinue}>
          Continue <ArrowRight size={14} />
        </PrimaryBtn>

        <div className="mt-6 text-center text-[13px] text-km-ink-dim">
          Already a member?{' '}
          <span
            onClick={() => switchMode('signin')}
            className="text-km-gold font-medium cursor-pointer"
          >
            Sign in →
          </span>
        </div>
      </div>
    </div>
  );
}

const INTERESTS = [
  'Keyboards',
  'Keycaps',
  'Linear switches',
  'Tactile switches',
  'Clicky switches',
  'PCBs / cases',
  'Artisans',
  'Cables',
  'Group buys',
];

function SignUpStep2({
  form,
  setForm,
  onBack,
  onFinish,
  isLoading,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onBack: () => void;
  onFinish: () => void;
  isLoading: boolean;
}) {
  const toggle = (o: string) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(o)
        ? f.interests.filter((x) => x !== o)
        : [...f.interests, o],
    }));

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="font-km-mono text-[11px] text-km-gold tracking-[0.2em] uppercase">
          Step 2 of 2
        </div>
        <div className="flex-1 h-0.5 bg-km-line rounded-[1px] relative">
          <div className="absolute left-0 top-0 h-full w-full bg-km-gold rounded-[1px]" />
        </div>
      </div>

      <h2 className="m-0 font-km-body text-[28px] font-semibold tracking-[-0.02em] text-km-ink">
        What are you into?
      </h2>
      <p className="mt-2 text-[13px] text-km-ink-dim">
        We'll tailor your feed and notify you about group buys that match. You
        can change this any time.
      </p>

      <div className="flex flex-wrap gap-2 mt-6">
        {INTERESTS.map((o) => {
          const on = form.interests.includes(o);
          return (
            <div
              key={o}
              onClick={() => toggle(o)}
              className={cn(
                'px-3.5 py-2 border rounded-[6px] text-xs cursor-pointer inline-flex items-center gap-1.5 transition-all duration-[120ms]',
                on
                  ? 'border-km-ink bg-km-ink text-km-bg'
                  : 'border-km-line-strong bg-transparent text-km-ink-dim',
              )}
            >
              {on && <Check size={10} strokeWidth={3} />}
              {o}
            </div>
          );
        })}
      </div>

      <Field label="Display name (optional)" className="mt-6">
        <input
          type="text"
          value={form.displayName}
          onChange={(e) =>
            setForm((f) => ({ ...f, displayName: e.target.value }))
          }
          placeholder="Your name"
          className={inputCls}
        />
      </Field>

      <Field
        label="Location (optional)"
        help="Helps with shipping estimates. Hidden until you list."
      >
        <input
          type="text"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          placeholder="City, State"
          className={inputCls}
        />
      </Field>

      <div className="flex gap-2.5 mt-6">
        <GhostBtn onClick={onBack}>
          <ArrowLeft size={14} /> Back
        </GhostBtn>
        <PrimaryBtn onClick={onFinish} className="flex-1" disabled={isLoading}>
          {isLoading ? (
            'Creating account…'
          ) : (
            <>
              <span>Finish &amp; enter market</span> <ArrowRight size={14} />
            </>
          )}
        </PrimaryBtn>
      </div>
    </div>
  );
}

export default function Login() {
  const { showError, showSuccess } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('signin');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    identifier: '',
    email: '',
    username: '',
    password: '',
    rememberMe: true,
    interests: ['Keyboards'],
    displayName: '',
    location: '',
  });

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep(1);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.identifier.trim()) {
      showError('Email or username cannot be empty');
      return;
    }
    if (!form.password.trim()) {
      showError('Password cannot be empty');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/api/auth/login', {
        identifier: form.identifier,
        password: form.password,
      });
      if (res.status === 201) {
        login(res.data);
        showSuccess('Welcome back!');
        setTimeout(() => navigate('/listings'), 1500);
      }
    } catch (err: any) {
      showError(err.response?.data?.error ?? 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        email: form.email,
        username: form.username,
        password: form.password,
      });
      if (res.status === 201) {
        login(res.data);
        showSuccess('Welcome to KBMARKET!');
        setTimeout(() => navigate('/listings'), 1500);
      }
    } catch (err: any) {
      showError(err.response?.data?.error ?? 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh grid grid-cols-1 md:grid-cols-[1.1fr_1fr] bg-km-bg text-km-ink">
      {/* ── Left: brand panel — hidden on mobile ── */}
      <aside className="hidden md:flex flex-col bg-km-bg-sub border-r border-km-line px-14 py-10 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at top right, rgba(212,178,76,0.08), transparent 60%), radial-gradient(ellipse at bottom left, rgba(139,122,212,0.12), transparent 50%)',
          }}
        />

        {/* Brand */}
        <div onClick={() => navigate('/')} className="relative cursor-pointer">
          <span className="font-km-body font-bold tracking-[-0.02em] text-[18px] text-km-ink">
            <span className="text-km-gold">◆</span> KBMARKET
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative mt-auto mb-auto">
          <div className="font-km-mono text-[11px] text-km-gold tracking-[0.2em] uppercase mb-5">
            {mode === 'signin' ? 'Welcome back' : '· New member'}
          </div>

          <h1
            className="m-0 font-km-body text-[48px] font-bold leading-[1.05] tracking-[-0.03em] text-km-ink"
            style={{ maxWidth: 460 }}
          >
            {mode === 'signin' ? (
              <>
                The market is
                <br />
                where you left it.
              </>
            ) : (
              <>
                Join the people
                <br />
                behind the keys.
              </>
            )}
          </h1>

          <p
            className="mt-[22px] text-[15px] leading-[1.6] text-km-ink-dim"
            style={{ maxWidth: 420 }}
          >
            {mode === 'signin'
              ? 'Pick up your saved searches, watchlist, and conversations. Your reputation comes with you.'
              : 'A small, verified community trading enthusiast keyboards, switches, and keycaps. No bots, no scalpers.'}
          </p>

          {/* Trust strip */}
          <div
            className="mt-9 p-[18px_22px] border border-km-line rounded-[6px] bg-white/[0.02] grid gap-7"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: 460 }}
          >
            {(
              [
                ['18.2k', 'verified members'],
                ['$1.4M', 'traded · 30d'],
                ['99.2%', 'ship-on-time'],
              ] as const
            ).map(([v, l]) => (
              <div key={l}>
                <div className="font-km-body text-[22px] font-semibold text-km-ink tracking-[-0.02em]">
                  {v}
                </div>
                <div className="font-km-mono text-[9px] text-km-ink-mute tracking-[0.12em] uppercase mt-1">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative mt-5">
          <div className="pt-5 border-t border-km-line font-km-mono text-[11px] text-km-ink-mute tracking-[0.05em] flex justify-between">
            <span>v2.14 · est. 2021</span>
            <span>built for the click</span>
          </div>
        </div>
      </aside>

      {/* ── Right: form panel ── */}
      <main className="bg-km-bg px-6 sm:px-14 py-8 sm:py-10 flex flex-col">
        {/* Top bar */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="bg-transparent border-none cursor-pointer flex items-center gap-2 text-km-ink-dim font-km-mono text-xs tracking-[0.05em] p-0"
          >
            <ArrowLeft size={14} /> Back to home
          </button>

          <div className="flex gap-1 p-1 border border-km-line rounded-[6px] bg-km-surface">
            {(
              [
                ['signin', 'Sign in'],
                ['signup', 'Create account'],
              ] as [Mode, string][]
            ).map(([v, l]) => {
              const active = mode === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => switchMode(v)}
                  className={cn(
                    'py-[7px] px-[18px] border-none rounded text-xs cursor-pointer font-km-body whitespace-nowrap transition-all duration-[120ms]',
                    active
                      ? 'bg-km-ink text-km-bg font-semibold'
                      : 'bg-transparent text-km-ink-dim font-medium',
                  )}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form body — vertically centered */}
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-[420px]">
            {mode === 'signin' ? (
              <SignInForm
                form={form}
                setForm={setForm}
                onSubmit={handleSignIn}
                switchMode={switchMode}
                isLoading={isLoading}
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
                isLoading={isLoading}
              />
            )}
          </div>
        </div>

        {/* Legal footer */}
        <div className="font-km-mono text-[10px] text-km-ink-mute tracking-[0.05em] flex justify-between pt-5 border-t border-km-line">
          <span>© 2026 Keyboard Market</span>
          <div className="flex gap-[18px]">
            <span className="cursor-pointer">Terms</span>
            <span className="cursor-pointer">Privacy</span>
            <span className="cursor-pointer">Help</span>
          </div>
        </div>
      </main>
    </div>
  );
}
