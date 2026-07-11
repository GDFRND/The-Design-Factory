import { NextResponse } from "next/server";
import { finalizeVariant } from "@/lib/ai/generate";
import { getWorkspaceContext } from "@/lib/workspace";

/* FIX-04 §1 — the Pro 2K render of the selected draft. Idempotent:
   an existing finalKey short-circuits; concurrent calls share one
   in-flight render, so a double-click never bills twice. */

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { variantId } = await params;
  try {
    const { finalKey } = await finalizeVariant({
      variantId,
      workspaceId: ctx.workspace.id,
    });
    return NextResponse.json({ ok: true, hasFinal: Boolean(finalKey) });
  } catch (e) {
    if (e instanceof Error && /No .*found/i.test(e.message)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[finalize] failed", e);
    return NextResponse.json(
      { error: "Couldn't prepare the final render. Try again." },
      { status: 502 }
    );
  }
}
