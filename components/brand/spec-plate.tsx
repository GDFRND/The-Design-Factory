import { MonoLabel } from "@/components/brand/mono-label";
import { cn } from "@/lib/utils";

/* The signature device (TDF-SYS-01 §spec-plate): hairline rule above,
   §NN + section name in mono, right-aligned mono note. Opens every
   marketing section. */
export function SpecPlate({
  no,
  name,
  note,
  className,
}: {
  no: string;
  name: string;
  note?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-6 border-t border-line pt-3",
        className
      )}
    >
      <div className="flex items-baseline gap-3">
        <MonoLabel size="md" className="text-muted-foreground">
          {no}
        </MonoLabel>
        <MonoLabel size="md" className="text-foreground">
          {name}
        </MonoLabel>
      </div>
      {note ? (
        <MonoLabel size="sm" className="hidden text-right text-muted-foreground sm:block">
          {note}
        </MonoLabel>
      ) : null}
    </div>
  );
}
