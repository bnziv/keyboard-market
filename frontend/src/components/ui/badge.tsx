import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center justify-center border rounded whitespace-nowrap shrink-0 w-fit",
    "text-[10px] tracking-wide uppercase",
    "px-2 py-0.5",
  ],
  {
    variants: {
      variant: {
        neutral:  "bg-[var(--km-surface-2)] text-[var(--km-ink-dim)] border-[var(--km-line)]",
        ok:       "bg-[color-mix(in_srgb,var(--km-ok)_20%,var(--km-surface))] text-[var(--km-ok)] border-[var(--km-ok)]",
        accent:   "bg-[var(--km-gold-soft)] text-[var(--km-gold)] border-[var(--km-gold)]",
        shipping: "bg-[var(--km-gold-soft)] text-[var(--km-gold)] border-[var(--km-gold)]",
        muted:    "bg-[var(--km-surface-2)] text-[var(--km-ink-mute)] border-[var(--km-line)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "span"

    return (
      <Comp
        ref={ref}
        data-slot="badge"
        className={cn(badgeVariants({ variant }), className)}
        style={{ fontFamily: "var(--km-font-mono)", ...style }}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
