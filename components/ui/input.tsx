import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-input border border-line bg-sunken px-3 py-1 text-[15px] transition-[border-color,box-shadow] duration-180 ease-tdf file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-(--fg-subtle) focus-visible:outline-none focus-visible:border-(--accent) focus-visible:shadow-[0_0_0_3px_var(--accent-dim)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
