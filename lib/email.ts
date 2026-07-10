import "server-only";

/* Outbound email. Uses Resend when RESEND_API_KEY is set; in local
   development it logs to the server console instead so the flows can
   be exercised without a provider. */

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(
      `\n[email:dev] to=${to}\n[email:dev] subject=${subject}\n[email:dev] ${text.replace(/\n/g, "\n[email:dev] ")}\n`
    );
    return { ok: true, dev: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "The Design Factory <no-reply@example.com>",
      to: [to],
      subject,
      text,
      html: html ?? undefined,
    }),
  });
  if (!res.ok) {
    console.error("[email] send failed", res.status, await res.text());
    return { ok: false };
  }
  return { ok: true };
}
