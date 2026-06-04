import MuiSkeleton from '@mui/material/Skeleton';
import type { SkeletonProps } from '@mui/material/Skeleton';

export function Skeleton({ sx, ...props }: SkeletonProps) {
  return (
    <MuiSkeleton
      animation={false}
      sx={{ bgcolor: 'var(--km-line)', borderRadius: '4px', ...sx }}
      {...props}
    />
  );
}
