import Image from "next/image";
import { MonoLabel } from "@/components/brand/mono-label";
import { cn } from "@/lib/utils";

/* TDF-BRD-01 co-branding lockup.
   TDF mark · 1px Fog rule at 1x clearance · mono "SUPPORTED BY" ·
   Tourism Fund mark. The Fund renders at 1.4× TDF cap height — a
   documented institutional-endorsement exception to the equal-cap
   rule; it endorses, we lead (left).
   Clear space x = ¼ mark height on all sides. Mark never below 40px. */

const TF_ASPECT = 2941 / 852; // supplied Tourism Fund asset

export function InstitutionalLockup({
  variant = "positive",
  wordmark = false,
  markSize = 40,
  className,
}: {
  variant?: "positive" | "reversed";
  /** Full lockup (mark + wordmark + tagline) — footer use. */
  wordmark?: boolean;
  /** TDF mark height in px. Minimum 40 (TDF-BRD-01 §min-sizes). */
  markSize?: number;
  className?: string;
}) {
  const mark = Math.max(40, markSize);
  const clearance = mark / 4; // x = ¼ mark height
  const reversed = variant === "reversed";
  const tfHeight = Math.round(mark * 1.4);
  const tfWidth = Math.round(tfHeight * TF_ASPECT);
  const wordmarkSize = Math.max(24, Math.round(mark * 0.55)); // Newsreader never below 24px

  return (
    <div
      className={cn("flex items-center", className)}
      style={{ padding: clearance, gap: clearance * 2 }}
    >
      <div className="flex items-center" style={{ gap: clearance }}>
        <Image
          src={reversed ? "/brand/tdf-mark-paper.png" : "/brand/tdf-mark-graphite.png"}
          alt="The Design Factory"
          width={mark}
          height={mark}
          style={{ width: mark, height: mark }}
        />
        {wordmark ? (
          <span className="flex flex-col" style={{ gap: clearance / 2 }}>
            <span
              className={cn(
                "font-display font-normal leading-none tracking-[-0.015em]",
                reversed ? "text-tdf-025" : "text-tdf-950"
              )}
              style={{ fontSize: wordmarkSize }}
            >
              The Design{" "}
              <em className={reversed ? "text-accent-300" : "text-blueprint"}>
                Factory
              </em>
            </span>
            {/* Tagline: mono 8px, 0.22em, uppercase, Ash. Never without the wordmark. */}
            <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-tdf-400">
              Built to be built on
            </span>
          </span>
        ) : null}
      </div>

      <span
        aria-hidden
        className={cn("w-px self-stretch", reversed ? "bg-tdf-200/40" : "bg-tdf-200")}
      />

      <div className="flex items-center" style={{ gap: clearance }}>
        <MonoLabel
          size="xs"
          className={reversed ? "text-tdf-300" : "text-tdf-500"}
        >
          Supported by
        </MonoLabel>
        <Image
          src={reversed ? "/brand/tourism-fund-paper.png" : "/brand/tourism-fund.png"}
          alt="Tourism Fund"
          width={tfWidth}
          height={tfHeight}
          style={{ width: tfWidth, height: tfHeight }}
        />
      </div>
    </div>
  );
}
