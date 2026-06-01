export const CATEGORY_PALETTES: Record<string, [string, string]> = {
  Keyboard: ['#1e2a5e', '#3d5af1'],
  Keycaps: ['#3b1f5c', '#8b5cf6'],
  Switches: ['#1a3a2e', '#22c55e'],
  Accessories: ['#3a2a1a', '#f59e0b'],
};

export function GroupBuyImage({
  category,
  imageUrl,
}: {
  category: string;
  imageUrl: string | null;
}) {
  const [bg, fg] = CATEGORY_PALETTES[category] ?? ['#1c1c2e', '#6366f1'];
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={category}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, ${bg} 0%, ${fg}66 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          border: '1.5px solid rgba(255,255,255,0.15)',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--km-font-mono)',
          fontSize: 10,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {category.slice(0, 3)}
      </div>
    </div>
  );
}
