export type BadgeTone = 'neutral' | 'ok' | 'accent' | 'shipping' | 'muted';

export const STATUS_TO_TONE: Record<string, BadgeTone> = {
  live: 'ok',       GB: 'ok',
  interest: 'accent', IC: 'neutral',
  shipping: 'shipping',
  closed: 'muted',  fulfilled: 'muted',
};
