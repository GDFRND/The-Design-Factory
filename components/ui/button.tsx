import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* Buttons are pill-shaped (TDF-SYS-01 §radius). Focus comes from the
   global :focus-visible rule — never removed, never re-implemented.  */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[15px] font-medium transition-colors duration-180 ease-tdf disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* Primary: Paper on Graphite (dark) / inverse on light. The
           hover glow lives in the ring, not the fill (TDF-06 §2.3). */
        default:
          "bg-foreground text-background hover:shadow-(--lift-accent)",
        /* The one accent element per viewport. Use once. */
        accent:
          "bg-blueprint text-(--accent-fg) hover:shadow-(--lift-accent)",
        destructive: "bg-danger text-tdf-025 hover:opacity-90",
        outline:
          "border border-(--line-strong) bg-transparent text-foreground hover:bg-sunken",
        ghost: "text-foreground hover:bg-sunken",
        link: "text-blueprint underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6",
        sm: "h-8 px-4 text-[13px]",
        lg: "h-12 px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
