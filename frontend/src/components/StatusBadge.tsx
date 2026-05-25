import { BADGE_TONES, BadgeTone } from '@/utils/badgeTones';

interface StatusBadgeProps {
  children: React.ReactNode;
  tone: BadgeTone;
}

export function StatusBadge({ children, tone }: StatusBadgeProps) {
  const t = BADGE_TONES[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px',
      fontFamily: 'var(--km-font-mono)', fontSize: 10,
      letterSpacing: '0.05em', textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      background: t.bg, color: t.fg,
      border: `1px solid ${t.border}`,
      borderRadius: 4,
    }}>
      {children}
    </span>
  );
}
