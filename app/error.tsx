"use client";

import { useEffect } from "react";

/* App-wide error boundary. Turns an unhandled runtime error (most often
   the local database not being reachable) into a calm, actionable page
   with a retry — instead of the developer error overlay / stack trace. */

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const looksLikeDb = /database|ECONNREFUSED|prisma|connect/i.test(
    `${error?.message ?? ""}`
  );

  return (
    <div
      data-theme="light"
      className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground"
    >
      <div className="flex max-w-md flex-col items-center gap-4">
        <h1 className="text-h1">Something went wrong.</h1>
        <p className="text-[15px] leading-relaxed text-secondary-foreground">
          {looksLikeDb
            ? "The app couldn't reach its database."
            : "This page hit an unexpected error."}{" "}
          If you&apos;re running this locally, the database may not be
          started — run{" "}
          <code className="rounded-chip bg-inset px-1.5 py-0.5 font-mono text-[13px]">
            npm run demo
          </code>{" "}
          in your terminal (or double-click Start-Demo), then try again.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-2 inline-flex h-11 items-center rounded-full bg-foreground px-6 text-[15px] font-medium text-background transition-shadow duration-180 ease-tdf hover:shadow-(--lift-accent)"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
