"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getWorkspaceContext } from "@/lib/workspace";

/* Two-stage approval (BRIEF §4.7). An approval is a row, not a boolean:
   it records who, when, and what they said. The reviewer gets an email
   with a magic link into the variant. */

export type ApprovalActionState = { ok: boolean; error?: string };

const requestSchema = z.object({
  variantId: z.string().min(1),
  stage: z.enum(["SUPPORT_REVIEW", "HOTEL_APPROVAL"]),
  reviewerId: z.string().min(1),
  note: z.string().trim().max(1000).optional(),
});

export async function requestApproval(
  input: z.infer<typeof requestSchema>
): Promise<ApprovalActionState> {
  const ctx = await getWorkspaceContext();
  if (!ctx) return { ok: false, error: "Not found" };

  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the approval details." };
  const { variantId, stage, reviewerId, note } = parsed.data;

  // The variant must belong to the caller's workspace.
  const variant = await db.variant.findFirst({
    where: { id: variantId, generation: { workspaceId: ctx.workspace.id } },
    include: { generation: true },
  });
  if (!variant) return { ok: false, error: "Not found" };

  // The reviewer must belong here too: a workspace member for
  // HOTEL_APPROVAL, the assigned assistant for SUPPORT_REVIEW.
  const reviewer =
    stage === "HOTEL_APPROVAL"
      ? await db.membership.findFirst({
        where: { workspaceId: ctx.workspace.id, userId: reviewerId },
        include: { user: true },
      })
      : await db.assignment.findFirst({
        where: { workspaceId: ctx.workspace.id, assistantId: reviewerId },
        include: { assistant: true },
      });
  if (!reviewer) return { ok: false, error: "That reviewer isn't in this workspace." };
  const reviewerUser = "user" in reviewer ? reviewer.user : reviewer.assistant;

  const existing = await db.approval.findFirst({
    where: { variantId, stage, decision: "PENDING" },
  });
  if (existing) {
    return { ok: false, error: "This variant is already awaiting that review." };
  }

  const approval = await db.approval.create({
    data: {
      variantId,
      stage,
      reviewerId: reviewerUser.id,
      note: note ?? null,
    },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  await sendEmail({
    to: reviewerUser.email,
    subject: `Review requested · ${variant.generation.assetType} · ${ctx.workspace.hotelName}`,
    text: [
      `${ctx.user.name} asked you to review a ${variant.generation.assetType.toLowerCase()} for ${ctx.workspace.hotelName}.`,
      note ? `\nTheir note: ${note}` : "",
      "",
      `Review it here: ${appUrl}/review/${approval.token}`,
      "",
      stage === "HOTEL_APPROVAL"
        ? "Your approval is required before this asset can be published."
        : "This is a support review — check it before it goes to the hotel's approver.",
    ].join("\n"),
  });

  return { ok: true };
}

const decideSchema = z.object({
  token: z.string().min(10),
  decision: z.enum(["APPROVED", "CHANGES_REQUESTED"]),
  note: z.string().trim().max(1000).optional(),
});

/** The magic-link decision. Possession of the token authenticates the
    reviewer; the link came from their inbox. */
export async function decideApproval(
  input: z.infer<typeof decideSchema>
): Promise<ApprovalActionState> {
  const parsed = decideSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid decision." };
  const { token, decision, note } = parsed.data;

  const approval = await db.approval.findUnique({ where: { token } });
  if (!approval) return { ok: false, error: "This review link is no longer valid." };
  if (approval.decision !== "PENDING") {
    return { ok: false, error: "This review has already been decided." };
  }

  await db.approval.update({
    where: { id: approval.id },
    data: {
      decision,
      note: note || approval.note,
      decidedAt: new Date(),
    },
  });

  return { ok: true };
}
