import { z } from "zod";

/* ExpandedPrompt (BRIEF §4.3) — the structured, editable creative plan
   between the user's short brief and any generation. Pure module:
   safe to import from client components. */

export const expandedPromptSchema = z.object({
  assetType: z.string().default(""),
  outputKind: z.enum(["IMAGE", "TEXT", "COMPOSITE"]),
  targetAudience: z.string().default(""),
  marketingObjective: z.string().default(""),
  keyMessage: z.string().default(""),
  offerDetails: z
    .object({
      price: z.string().optional(),
      validity: z.string().optional(),
      inclusions: z.array(z.string()).optional(),
      terms: z.string().optional(),
    })
    .default({}),
  toneOfVoice: z.string().default(""),
  // omitted when outputKind === "TEXT"
  visualDirection: z.string().optional(),
  suggestedLayout: z.string().default(""),
  brandApplication: z.string().default(""),
  callToAction: z.string().default(""),
  outputFormat: z.string().default(""),
  missingDetails: z.array(z.string()).default([]),
});

export type ExpandedPrompt = z.infer<typeof expandedPromptSchema>;
