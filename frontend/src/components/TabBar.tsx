import { cn } from '@/lib/utils';

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

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  variant = 'mono',
}: TabBarProps<T>) {
  const isBody = variant === 'body';
  return (
    <div className="flex">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'flex items-center gap-2 bg-transparent border-b-2 px-4 py-2.5 -mb-px whitespace-nowrap cursor-pointer transition-colors',
              isActive ? 'border-km-gold' : 'border-transparent',
              isBody
                ? 'font-km-body text-[13px]'
                : 'font-km-mono text-[11px] tracking-[0.1em] uppercase',
              isActive
                ? 'font-semibold text-km-ink'
                : isBody
                  ? 'font-normal text-km-ink-dim'
                  : 'font-normal text-km-ink-mute',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'font-km-mono text-[10px] text-km-ink-mute px-1.5 py-[1px] rounded-full transition-colors',
                  isActive ? 'bg-km-gold-soft' : 'bg-km-surface-2',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
