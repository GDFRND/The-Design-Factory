import Image from "next/image";
import Link from "next/link";
import { MonoLabel } from "@/components/brand/mono-label";
import { logout } from "@/lib/auth/actions";

/* Shared studio chrome: mark, breadcrumb, theme toggle, sign out. */

export function StudioShell({
  hotelName,
  children,
}: {
  hotelName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-line">
        <div className="container-tdf flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <Link href="/studio" aria-label="Studio home" className="flex items-center gap-3">
              <Image
                src="/brand/tdf/tdf-mark-graphite.png"
                alt=""
                width={40}
                height={40}
                className="dark:hidden"
              />
              <Image
                src="/brand/tdf/tdf-mark-paper.png"
                alt=""
                width={40}
                height={40}
                className="hidden dark:block"
              />
            </Link>
            <span aria-hidden className="h-5 w-px bg-line" />
            <MonoLabel size="sm" className="text-muted-foreground">
              {hotelName}
            </MonoLabel>
          </div>
          <div className="flex items-center gap-2">
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full px-4 py-1.5 text-[13px] text-muted-foreground transition-colors duration-180 ease-tdf hover:bg-sunken hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
