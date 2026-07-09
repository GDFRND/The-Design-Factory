import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* Chips sit at radius 2 (TDF-SYS-01 §radius). The `mono` variant is the
   spec-label treatment: JetBrains Mono, uppercase, tracked. */
const badgeVariants = cva(
  "inline-flex items-center rounded-chip border px-2 py-0.5 text-xs transition-colors duration-180 ease-tdf",
  {
    variants: {
      variant: {
        default: "border-line bg-sunken text-secondary-foreground",
        mono: "border-line bg-transparent font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
        success: "border-transparent bg-success/10 text-success",
        warning: "border-transparent bg-warning/10 text-warning",
        danger: "border-transparent bg-danger/10 text-danger",
        outline: "border-line text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
