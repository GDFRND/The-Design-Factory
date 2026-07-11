import Image from "next/image";
import { MonoLabel } from "@/components/brand/mono-label";
import { cn } from "@/lib/utils";

/* Footer only (FIX-02 §1–2). Genesis · Jitume (Digital Media Factory)
   — logo only, equal cap height to each other, Fog rule between, mono
   caption above. Sizing law: Tourism Fund > TDF > Genesis = Jitume;
   these are always smaller than the TDF lockup above them. The band is
   always Graphite: Genesis reverses to Paper (clean black wordmark);
   Jitume rides its Paper plate — its target ring and hand outline are
   white shapes inside colour and would hollow out if keyed. */

const CAP = 28;
const GENESIS_ASPECT = 924 / 611;
const JITUME_ASPECT = 1920 / 1594;

export function PartnerStrip({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <MonoLabel size="xs" className="text-tdf-400">
        A Genesis project · Powered by Jitume
      </MonoLabel>
      <div className="flex items-center gap-6">
        <Image
          src="/brand/partners/genesis-paper.png"
          alt="Genesis"
          width={Math.round(CAP * GENESIS_ASPECT)}
          height={CAP}
          style={{ width: Math.round(CAP * GENESIS_ASPECT), height: CAP }}
          className="opacity-55 transition-opacity duration-180 ease-tdf hover:opacity-100"
        />
        <span aria-hidden className="h-7 w-px bg-tdf-200/40" />
        <Image
          src="/brand/partners/digital-media-factory-plated.png"
          alt="Jitume — Digital Media Factory"
          width={Math.round(CAP * JITUME_ASPECT)}
          height={CAP}
          style={{ width: Math.round(CAP * JITUME_ASPECT), height: CAP }}
          className="opacity-55 transition-opacity duration-180 ease-tdf hover:opacity-100"
        />
      </div>
    </div>
  );
}
