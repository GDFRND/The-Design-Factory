import * as React from "react";
import { cn } from "@/lib/utils";

/* JetBrains Mono spec label — eyebrows, stat keys, the tagline.
   Uppercase, tracked 0.12–0.16em, 10–12px. Never forms a sentence. */
const sizes = {
  xs: "text-[10px] tracking-[0.16em]",
  sm: "text-[11px] tracking-[0.14em]",
  md: "text-xs tracking-[0.12em]",
} as const;

export function MonoLabel({
  size = "md",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { size?: keyof typeof sizes }) {
  return (
    <span
      className={cn(
        "font-mono font-medium uppercase",
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
