"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getGenerationGate } from "@/lib/brand/gate";
import { recomputeCompletion } from "@/lib/brand/recompute";
import { ASSET_TYPES, outputKindFor } from "@/lib/studio/asset-types";
import { getWorkspaceContext } from "@/lib/workspace";

export type StudioActionState = {
  ok: boolean;
  error?: string;
  completion?: number;
};

const briefSchema = z.object({
  assetType: z
    .string()
    .refine((v) => ASSET_TYPES.some((t) => t.label === v), "Choose an asset type."),
  brief: z.string().trim().min(10, "Describe the asset in a sentence or two."),
  attachmentIds: z.array(z.string()).default([]),
});

// ----------------------------------------------------- create generation

export async function createGeneration(
  _prev: StudioActionState,
  formData: FormData
): Promise<StudioActionState> {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/signin");

  const gate = await getGenerationGate(ctx);
  if (!gate.allowed) {
    return {
      ok: false,
      error: "Complete your brand profile to unlock the studio.",
    };
  }

  // Per-workspace monthly cap (FIX-03 §5) — the load-bearing safety
  // rail between one prepaid image-credit pool and a runaway loop.
  const quota = Number(process.env.MONTHLY_GENERATION_QUOTA) || 30;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const usedThisMonth = await db.generation.count({
    where: { workspaceId: ctx.workspace.id, createdAt: { gte: monthStart } },
  });
  if (usedThisMonth >= quota) {
    return {
      ok: false,
      error:
        "This workspace has used its monthly creation allowance. It resets on the 1st — or ask support to raise it.",
    };
  }

  const parsed = briefSchema.safeParse({
    assetType: formData.get("assetType"),
    brief: formData.get("brief"),
    attachmentIds: JSON.parse(String(formData.get("attachmentIds") ?? "[]")),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const { assetType, brief, attachmentIds } = parsed.data;

  // Attachments must belong to this workspace — anything else is unknown.
  if (attachmentIds.length) {
    const owned = await db.brandAsset.count({
      where: { id: { in: attachmentIds }, workspaceId: ctx.workspace.id },
    });
    if (owned !== attachmentIds.length) {
      return { ok: false, error: "Attachment not found." };
    }
  }

  const generation = await db.generation.create({
    data: {
      workspaceId: ctx.workspace.id,
      assetType,
      outputKind: outputKindFor(assetType),
      rawBrief: brief,
      status: "PENDING",
      expandedPrompt: attachmentIds.length
        ? ({ attachmentIds } as never)
        : undefined,
    },
  });

  redirect(`/studio/${generation.id}`);
}

// --------------------------------------------------------- hotel profile

const profileSchema = z.object({
  location: z.string().trim().optional(),
  county: z.string().trim().optional(),
  propertyType: z.string().trim().optional(),
  roomCount: z.coerce.number().int().positive().optional().or(z.literal("")),
  roomCategories: z.string().optional(),
  restaurant: z.string().trim().optional(),
  buffet: z.string().trim().optional(),
  conference: z.string().trim().optional(),
  wellness: z.string().trim().optional(),
  targetCustomers: z.string().optional(),
  sellingPoints: z.string().optional(),
  contact: z.string().trim().optional(),
  bookingUrl: z.string().trim().optional(),
  websiteUrl: z.string().trim().optional(),
});

const splitList = (v?: string) =>
  (v ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

export async function saveProfile(
  _prev: StudioActionState,
  formData: FormData
): Promise<StudioActionState> {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/signin");

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Check the highlighted fields." };
  }
  const d = parsed.data;

  const profileData = {
    location: d.location || null,
    roomCategories: splitList(d.roomCategories),
    restaurant: d.restaurant || null,
    buffet: d.buffet || null,
    conference: d.conference || null,
    wellness: d.wellness || null,
    targetCustomers: splitList(d.targetCustomers),
    sellingPoints: splitList(d.sellingPoints),
    contact: d.contact || null,
    bookingUrl: d.bookingUrl || null,
    websiteUrl: d.websiteUrl || null,
  };

  await db.$transaction([
    db.workspace.update({
      where: { id: ctx.workspace.id },
      data: {
        county: d.county || null,
        propertyType: d.propertyType || null,
        roomCount: typeof d.roomCount === "number" ? d.roomCount : null,
      },
    }),
    db.hotelProfile.upsert({
      where: { workspaceId: ctx.workspace.id },
      create: { workspaceId: ctx.workspace.id, ...profileData },
      update: profileData,
    }),
  ]);

  const completion = await recomputeCompletion(ctx.workspace.id);
  return { ok: true, completion: completion.percent };
}

// ---------------------------------------------------- brand confirmation

export async function confirmBrandSystem(
  _prev: StudioActionState,
  formData: FormData
): Promise<StudioActionState> {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/signin");

  const tone = String(formData.get("toneOfVoice") ?? "").trim();
  const imageStyle = String(formData.get("imageStyle") ?? "").trim();

  await db.brandSystem.upsert({
    where: { workspaceId: ctx.workspace.id },
    create: {
      workspaceId: ctx.workspace.id,
      toneOfVoice: tone || null,
      imageStyle: imageStyle || null,
      provisional: false,
    },
    update: {
      toneOfVoice: tone || undefined,
      imageStyle: imageStyle || undefined,
      provisional: false,
    },
  });

  const completion = await recomputeCompletion(ctx.workspace.id);
  return { ok: true, completion: completion.percent };
}

// --------------------------------------------------------- support ticket

export async function createSupportTicket(
  _prev: StudioActionState,
  formData: FormData
): Promise<StudioActionState> {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/signin");

  const body = z.string().trim().min(5).safeParse(formData.get("body"));
  if (!body.success) {
    return { ok: false, error: "Tell us a little more about what you need." };
  }

  const assignment = await db.assignment.findFirst({
    where: { workspaceId: ctx.workspace.id },
  });

  await db.supportTicket.create({
    data: {
      workspaceId: ctx.workspace.id,
      authorId: ctx.user.id,
      assigneeId: assignment?.assistantId ?? null,
      body: body.data,
    },
  });

  return { ok: true };
}
