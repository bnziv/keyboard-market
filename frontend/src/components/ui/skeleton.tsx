import type { CSSProperties } from 'react';

type Variant = 'text' | 'rectangular' | 'circular';

interface SxProps {
  fontSize?: string;
  lineHeight?: string | number;
  width?: number | string;
  height?: string | number;
  aspectRatio?: string;
  borderRadius?: number | string;
  bgcolor?: string;
  mt?: string;
  mb?: string;
  flexShrink?: number;
}

interface SkeletonProps {
  variant?: Variant;
  width?: number | string;
  height?: number | string;
  sx?: SxProps;
}

function px(v: number | string): string {
  return typeof v === 'number' ? `${v}px` : v;
}

export function Skeleton({ variant = 'text', width: wProp, height: hProp, sx = {} }: SkeletonProps) {
  const { bgcolor = 'var(--km-line)', mt, mb, flexShrink, borderRadius, fontSize, lineHeight, width: wSx, height: hSx, aspectRatio } = sx;

  const w = wSx ?? wProp;
  const h = hSx ?? hProp;

  const base: CSSProperties = {
    backgroundColor: bgcolor,
    ...(mt !== undefined && { marginTop: mt }),
    ...(mb !== undefined && { marginBottom: mb }),
    ...(flexShrink !== undefined && { flexShrink }),
    ...(w !== undefined && { width: px(w) }),
    ...(h !== undefined && { height: px(h) }),
    ...(aspectRatio && { aspectRatio }),
  };

  const br = borderRadius !== undefined ? px(borderRadius) : '4px';

  if (variant === 'text') {
    return <span className="sk-text" style={{ ...base, borderRadius: br, fontSize, lineHeight }} />;
  }

  if (variant === 'circular') {
    return <span style={{ ...base, display: 'block', borderRadius: '50%' }} />;
  }

  return <span style={{ ...base, display: 'block', borderRadius: br }} />;
}
