import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md',
    'font-medium cursor-pointer disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-2 focus-visible:outline-offset-2',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        solid: [
          'bg-km-ink text-km-bg',
          'transition-opacity hover:opacity-90',
          'focus-visible:outline-km-ink',
        ],
        gold: [
          'bg-km-gold text-km-bg',
          'transition-opacity hover:opacity-90',
          'focus-visible:outline-km-gold',
        ],
        outline: [
          'bg-transparent border border-km-line-strong text-km-ink-dim',
          'transition-colors hover:opacity-80',
          'focus-visible:outline-km-line-strong',
        ],
        surface: [
          'bg-km-surface-2 border border-km-line text-km-ink-dim',
          'transition-colors hover:opacity-80',
          'focus-visible:outline-km-line',
        ],
        ghost: [
          'bg-transparent text-km-ink-dim',
          'transition-colors hover:opacity-80',
          'focus-visible:outline-km-ink-dim',
        ],
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-sm font-semibold',
        icon: 'w-8 h-8',
      },
    },
    defaultVariants: {
      variant: 'solid',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size, className }),
          'font-km-body',
        )}
        style={style}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
