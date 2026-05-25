interface TabItem<T extends string> {
  key: T;
  label: string;
  count?: number;
}

interface TabBarProps<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (key: T) => void;
  variant?: 'mono' | 'body';
}

export function TabBar<T extends string>({ tabs, active, onChange, variant = 'mono' }: TabBarProps<T>) {
  const isBody = variant === 'body';
  return (
    <div style={{ display: 'flex' }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none',
            borderBottom: `2px solid ${active === tab.key ? 'var(--km-gold)' : 'transparent'}`,
            padding: '10px 16px',
            fontFamily: isBody ? 'var(--km-font-body)' : 'var(--km-font-mono)',
            fontSize: isBody ? 13 : 11,
            letterSpacing: isBody ? undefined : '0.1em',
            textTransform: isBody ? undefined : 'uppercase',
            cursor: 'pointer',
            color: active === tab.key ? 'var(--km-ink)' : (isBody ? 'var(--km-ink-dim)' : 'var(--km-ink-mute)'),
            fontWeight: active === tab.key ? 600 : 400,
            marginBottom: -1,
            whiteSpace: 'nowrap',
            transition: 'color 150ms',
          }}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span style={{
              fontFamily: 'var(--km-font-mono)', fontSize: 10,
              color: 'var(--km-ink-mute)',
              background: active === tab.key ? 'var(--km-gold-soft)' : 'var(--km-surface-2)',
              padding: '1px 6px', borderRadius: 8,
              transition: 'background 150ms',
            }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
