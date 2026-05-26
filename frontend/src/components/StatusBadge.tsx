import { Badge } from '@/components/ui/badge';
import { BadgeTone } from '@/utils/badgeTones';

interface StatusBadgeProps {
  children: React.ReactNode;
  tone: BadgeTone;
}

export function StatusBadge({ children, tone }: StatusBadgeProps) {
  return <Badge variant={tone}>{children}</Badge>;
}
