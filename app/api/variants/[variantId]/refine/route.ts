import { NextResponse } from "next/server";
import { z } from "zod";
import { refineVariant, serializeVariant } from "@/lib/ai/generate";
import { getWorkspaceContext } from "@/lib/workspace";

/* Refinement (BRIEF §4.6): posts an instruction plus the selected
   variant back through the engine, appending to Variant.refinements. */

const bodySchema = z.object({
  instruction: z.string().trim().min(2).max(500),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid instruction" }, { status: 400 });
  }

  const { variantId } = await params;
  try {
    const variant = await refineVariant({
      variantId,
      workspaceId: ctx.workspace.id,
      instruction: parsed.data.instruction,
    });
    return NextResponse.json({ variant: await serializeVariant(variant) });
  } catch (e) {
    if (e instanceof Error && e.message.includes("No")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[refine] failed", e);
    return NextResponse.json(
      { error: "Refinement failed. Try again." },
      { status: 502 }
    );
  }
}
