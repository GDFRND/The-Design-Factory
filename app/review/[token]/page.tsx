import Image from "next/image";
import { notFound } from "next/navigation";
import { MonoLabel } from "@/components/brand/mono-label";
import { SpecPlate } from "@/components/brand/spec-plate";
import { ReviewDecision } from "@/components/studio/review-decision";
import type { CopyBlocks } from "@/lib/ai/copy";
import { db } from "@/lib/db";
import { getSignedUrl } from "@/lib/storage";

/* Magic-link review page (BRIEF §4.7). The token from the reviewer's
   email is the credential; an unknown token is a 404. */

export const metadata = { title: "Review · The Design Factory" };

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const approval = await db.approval.findUnique({
    where: { token },
    include: {
      reviewer: { select: { name: true } },
      variant: {
        include: {
          generation: { include: { workspace: { select: { hotelName: true } } } },
        },
      },
    },
  });
  if (!approval) notFound();

  const { variant } = approval;
  const generation = variant.generation;
  const imageUrl = variant.imageKey ? await getSignedUrl(variant.imageKey) : null;
  const copy = variant.copy as CopyBlocks | null;

  return (
    <main className="container-tdf flex max-w-3xl flex-col gap-8 py-16">
      <SpecPlate
        no={approval.stage === "SUPPORT_REVIEW" ? "§01" : "§02"}
        name={approval.stage === "SUPPORT_REVIEW" ? "Support review" : "Hotel approval"}
        note={generation.workspace.hotelName}
      />

      <div className="flex flex-col gap-2">
        <h1 className="text-h1">
          {generation.assetType} · awaiting your review
        </h1>
        <p className="text-body text-secondary-foreground">
          {approval.reviewer.name}, the team asked you to look at this before
          it {approval.stage === "HOTEL_APPROVAL" ? "is published" : "goes to the approver"}.
        </p>
        {approval.note ? (
          <p className="rounded-card border border-line bg-sunken p-3 text-[15px] text-secondary-foreground">
            &ldquo;{approval.note}&rdquo;
          </p>
        ) : null}
      </div>

      {imageUrl ? (
        <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-card border border-line">
          <Image
            src={imageUrl}
            alt={`${generation.assetType} for ${generation.workspace.hotelName}`}
            fill
            sizes="(min-width: 768px) 28rem, 90vw"
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}

      {copy ? (
        <article className="flex max-w-[68ch] flex-col gap-3 rounded-card border border-line bg-raised p-6">
          <h2 className="text-h2">{copy.headline}</h2>
          {copy.subhead ? (
            <p className="text-[15px] text-muted-foreground">{copy.subhead}</p>
          ) : null}
          <p className="whitespace-pre-wrap text-body text-secondary-foreground">{copy.body}</p>
          {copy.sections?.map((s, i) => (
            <div key={i}>
              <h3 className="text-[15px] font-semibold">{s.heading}</h3>
              <p className="mt-1 whitespace-pre-wrap text-[15px] text-secondary-foreground">
                {s.body}
              </p>
            </div>
          ))}
          <p className="font-medium">{copy.cta}</p>
        </article>
      ) : null}

      {approval.decision === "PENDING" ? (
        <ReviewDecision token={approval.token} />
      ) : (
        <MonoLabel
          size="sm"
          className={approval.decision === "APPROVED" ? "text-success" : "text-danger"}
        >
          {approval.decision.replace("_", " ")} ·{" "}
          {approval.decidedAt?.toLocaleDateString("en-KE") ?? ""}
        </MonoLabel>
      )}
    </main>
  );
}
