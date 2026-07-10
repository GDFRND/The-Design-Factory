import { expandedPromptSchema, type ExpandedPrompt } from "@/lib/ai/expanded-prompt";

/* Defensive JSON parsing (BRIEF §4.3): the model is asked for JSON
   only — no prose, no fences — but we parse as if it ignored us.
   Pure module with Vitest coverage. */

export type ParseResult =
  | { ok: true; data: ExpandedPrompt }
  | { ok: false; error: string };

/** Strips markdown fences / surrounding prose and isolates the outermost
    JSON object. */
export function extractJsonObject(raw: string): string | null {
  let text = raw.trim();

  // Strip a fenced block if present, e.g. ```json ... ```
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

export function parseExpandedPrompt(raw: string): ParseResult {
  const json = extractJsonObject(raw);
  if (!json) return { ok: false, error: "No JSON object found in output." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return {
      ok: false,
      error: `Invalid JSON: ${e instanceof Error ? e.message : "parse failure"}`,
    };
  }

  const result = expandedPromptSchema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      ok: false,
      error: `Schema mismatch at ${issue?.path.join(".") || "root"}: ${issue?.message}`,
    };
  }

  const data = result.data;
  // TEXT assets carry no visual direction (§4.3).
  if (data.outputKind === "TEXT") delete data.visualDirection;

  return { ok: true, data };
}
