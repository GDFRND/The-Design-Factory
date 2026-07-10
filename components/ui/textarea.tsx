import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-input border border-line bg-sunken px-3 py-2 text-[15px] transition-[border-color,box-shadow] duration-180 ease-tdf placeholder:text-(--fg-subtle) focus-visible:outline-none focus-visible:border-(--accent) focus-visible:shadow-[0_0_0_3px_var(--accent-dim)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
