import Image from "next/image";
import { MonoLabel } from "@/components/brand/mono-label";
import { cn } from "@/lib/utils";

/* Footer only. Genesis · Digital Media Factory — logo only, no
   wordmarks, no taglines, equal cap height, Fog rule between,
   mono caption above. Never larger than the TDF lockup.
   The footer band is always Graphite, so the reversed (paper)
   knockouts are used regardless of theme. */

const CAP = 28;
const GENESIS_ASPECT = 1200 / 589;

export function PartnerStrip({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <MonoLabel size="xs" className="text-tdf-400">
        A Genesis project
      </MonoLabel>
      <div className="flex items-center gap-6">
        <Image
          src="/brand/genesis-paper.png"
          alt="Genesis"
          width={Math.round(CAP * GENESIS_ASPECT)}
          height={CAP}
          style={{ width: Math.round(CAP * GENESIS_ASPECT), height: CAP }}
        />
        <span aria-hidden className="h-7 w-px bg-tdf-200/40" />
        <Image
          src="/brand/digital-media-factory-paper.png"
          alt="Digital Media Factory"
          width={CAP}
          height={CAP}
          style={{ width: CAP, height: CAP }}
        />
      </div>
    </div>
  );
}
