import { AppBar } from "@/components/studio/app-bar";
import { getChrome } from "@/lib/workspace-chrome";
import { requireWorkspace } from "@/lib/workspace";

/* The dashboard shares the dark-first chrome and the sticky app bar
   with /studio (FIX-04 §2). */

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireWorkspace();
  const chrome = await getChrome(ctx);

  return (
    <div
      data-theme="dark"
      className="relative min-h-svh overflow-x-clip bg-background text-foreground"
    >
      <div
        aria-hidden
        className="orb orb--ash right-[-12%] top-[-18%] size-[70vmin]"
      />
      <div aria-hidden className="grain fixed" />
      <div className="relative z-10 flex min-h-svh flex-col">
        <AppBar {...chrome} showSwitch={ctx.user.isDemo} />
        {children}
      </div>
    </div>
  );
}
