"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Repeat } from "lucide-react";
import { MonoLabel } from "@/components/brand/mono-label";
import { logout } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

/* Persistent app chrome (FIX-04 §2.1). Sticky glass bar on every
   authenticated route: the hotel's own logo (the "which brand am I in"
   signal) links home; Home / Create / Brand mono nav with the active
   route lit; completion pill and an avatar menu. Declared once in the
   authenticated layout, never per page. */

const NAV = [
  { href: "/dashboard", label: "Home", match: (p: string) => p === "/dashboard" },
  { href: "/studio", label: "Create", match: (p: string) => p === "/studio" || /^\/studio\/[^/]+$/.test(p) },
  { href: "/studio/brand", label: "Brand", match: (p: string) => p === "/studio/brand" },
];

export function AppBar({
  hotelName,
  logoSrc,
  completion,
  userName,
  showSwitch,
}: {
  hotelName: string;
  logoSrc: string | null;
  completion: number;
  userName: string;
  showSwitch: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <nav className="panel container-tdf flex items-center justify-between gap-4 px-4 py-2">
        {/* Left — the hotel logo goes home */}
        <Link
          href="/dashboard"
          aria-label={`${hotelName} — dashboard`}
          className="flex min-w-0 items-center gap-3"
        >
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt=""
              width={112}
              height={32}
              className="h-8 w-auto object-contain"
            />
          ) : null}
          <MonoLabel size="sm" className="truncate text-foreground">
            {hotelName}
          </MonoLabel>
        </Link>

        {/* Centre — route nav */}
        <div className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "font-mono text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-180 ease-tdf",
                  active ? "text-foreground" : "text-(--fg-muted) hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right — completion pill + avatar menu */}
        <div className="flex items-center gap-3">
          <Link
            href="/studio/brand"
            className="hidden rounded-full border border-line px-3 py-1 transition-colors duration-180 ease-tdf hover:bg-sunken sm:block"
          >
            <MonoLabel
              size="xs"
              className={cn(completion < 60 ? "text-warning" : "text-success")}
            >
              Brand · {completion}%
            </MonoLabel>
          </Link>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors duration-180 ease-tdf hover:bg-sunken"
            >
              <span
                aria-hidden
                className="flex size-8 items-center justify-center rounded-full bg-inset font-mono text-[11px] font-medium text-secondary-foreground"
              >
                {initials}
              </span>
              <ChevronDown className="size-3.5 text-(--fg-muted)" aria-hidden />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="panel absolute right-0 top-[calc(100%+8px)] flex w-48 flex-col p-1"
              >
                {showSwitch ? (
                  <Link
                    href="/signin"
                    role="menuitem"
                    className="flex items-center gap-2 rounded-input px-3 py-2 text-[14px] text-secondary-foreground transition-colors duration-180 ease-tdf hover:bg-sunken hover:text-foreground"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Repeat className="size-4" aria-hidden />
                    Switch brand
                  </Link>
                ) : null}
                <form action={logout}>
                  <button
                    type="submit"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-input px-3 py-2 text-left text-[14px] text-secondary-foreground transition-colors duration-180 ease-tdf hover:bg-sunken hover:text-foreground"
                  >
                    <LogOut className="size-4" aria-hidden />
                    Sign out
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </nav>
    </header>
  );
}
