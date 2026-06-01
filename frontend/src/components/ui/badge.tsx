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
        neutral: "bg-km-surface-2 text-km-ink-dim border-km-line",
        ok:      "bg-[color-mix(in_srgb,var(--km-ok)_20%,var(--km-surface))] text-km-ok border-km-ok",
        accent:  "bg-km-gold-soft text-km-gold border-km-gold",
        muted:   "bg-km-surface-2 text-km-ink-mute border-km-line",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

export const STAGE_BADGE_META: Record<string, { label: string; tone: BadgeTone }> = {
  IC:     { label: "Interest check", tone: "neutral" },
  GB:     { label: "Live",           tone: "ok" },
  closed: { label: "Closed",         tone: "accent" },
}

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
        className={cn(badgeVariants({ variant }), "font-km-mono", className)}
        style={style}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
