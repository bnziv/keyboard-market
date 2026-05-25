export type BadgeTone = 'neutral' | 'ok' | 'accent' | 'shipping' | 'muted';

export const BADGE_TONES: Record<BadgeTone, { bg: string; fg: string; border: string }> = {
  neutral:  { bg: 'var(--km-surface-2)', fg: 'var(--km-ink-dim)',  border: 'var(--km-line)' },
  ok:       { bg: 'color-mix(in srgb, var(--km-ok) 20%, var(--km-surface))', fg: 'var(--km-ok)', border: 'var(--km-ok)' },
  accent:   { bg: 'var(--km-gold-soft)',  fg: 'var(--km-gold)',    border: 'var(--km-gold)' },
  shipping: { bg: 'var(--km-gold-soft)',  fg: 'var(--km-gold)',    border: 'var(--km-gold)' },
  muted:    { bg: 'var(--km-surface-2)', fg: 'var(--km-ink-mute)', border: 'var(--km-line)' },
};

export const STATUS_TO_TONE: Record<string, BadgeTone> = {
  live: 'ok',       GB: 'ok',
  interest: 'accent', IC: 'neutral',
  shipping: 'shipping',
  closed: 'muted',  fulfilled: 'muted',
};
