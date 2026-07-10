import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { MonoLabel } from "@/components/brand/mono-label";

export const metadata = { title: "Studio · The Design Factory" };

export default async function StudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const firstName = user.name.split(" ")[0];

  return (
    <main className="container-tdf flex flex-col gap-6 py-24">
      <MonoLabel size="sm" className="text-muted-foreground">
        Studio
      </MonoLabel>
      <h1 className="font-display text-display-2">
        Hello, {firstName}. What are we building today?
      </h1>
      <p className="max-w-[52ch] text-body text-secondary-foreground">
        The studio intake is being assembled — asset types, your brief, and
        attachments land here next.
      </p>
    </main>
  );
}
