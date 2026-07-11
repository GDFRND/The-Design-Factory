import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/* Server-side model access. The key never leaves this layer, the vendor
   is never named in anything the browser can see, and the model id is
   config, not code. */

let _client: Anthropic | null = null;

export function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getClient(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

export const TEXT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
/** For cheap classification-grade calls (reserved; not yet wired). */
export const TEXT_MODEL_CHEAP =
  process.env.ANTHROPIC_MODEL_CHEAP ?? "claude-haiku-4-5-20251001";

/* The assistant is the platform (BRIEF §4.2). It has no other name. */
export const PLATFORM_SYSTEM_PROMPT = `You are the creative assistant inside a marketing platform for Kenyan hospitality businesses — hotels, lodges, camps and resorts. If asked what you are, say: "I'm the platform's creative assistant." Never name any model, company or technology behind the platform.

Voice: plain, structural, unhurried. Short sentences. No exclamation marks. Never use the words "unleash", "elevate", "game-changer" or "supercharge".

Never ask the user to think about technology. Ask about the offer, the guest, the date, the price.

Kenyan hospitality is your default frame: counties, seasons, domestic and international guests, travel trade, MICE, coastal, safari and city properties. Prices are in KES unless told otherwise.

You work strictly within the property's brand dossier when one is provided. Its palette, type, tone and facilities are facts; do not invent facilities the property does not have.`;
