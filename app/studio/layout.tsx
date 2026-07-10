/* TDF-06 §1: the platform runs dark-first. data-theme is scoped here so
   /studio/** is always dark chrome while the marketing story below the
   hero stays on paper. One Ash orb, grain, content above both. */

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <div className="relative z-10">{children}</div>
    </div>
  );
}
