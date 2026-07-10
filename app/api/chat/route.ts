import { NextResponse } from "next/server";
import { z } from "zod";
import { aiConfigured, getClient, PLATFORM_SYSTEM_PROMPT, TEXT_MODEL } from "@/lib/ai/claude";
import { buildBrandDossier } from "@/lib/ai/dossier";
import { getWorkspaceContext } from "@/lib/workspace";

/* Streaming assistant chat. The dossier rides as a cached system block
   so it isn't re-billed every turn. Plain text/event-stream of text
   deltas — no vendor detail ever reaches the client. */

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1)
    .max(40),
});

export async function POST(request: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!aiConfigured()) {
    return NextResponse.json(
      { error: "The creative assistant is offline right now." },
      { status: 503 }
    );
  }

  const dossier = await buildBrandDossier(ctx.workspace.id);
  const client = getClient();

  const stream = client.messages.stream({
    model: TEXT_MODEL,
    max_tokens: 2000,
    system: [
      { type: "text", text: PLATFORM_SYSTEM_PROMPT },
      {
        type: "text",
        text: dossier.markdown,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: parsed.data.messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "stream-failed" })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
