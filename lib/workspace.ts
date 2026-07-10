import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

/* Workspace scoping (BRIEF §3): every query runs through here, never
   per-route. The workspaceId always derives from the session — a
   request can never name someone else's workspace. Reads that miss
   the scope must surface as 404, not 403. */

export const getWorkspaceContext = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) return null;
  return {
    user,
    workspace: membership.workspace,
    role: membership.role,
    isOwner: membership.isOwner,
  };
});

export type WorkspaceContext = NonNullable<
  Awaited<ReturnType<typeof getWorkspaceContext>>
>;

/** Page-level guard: redirects to sign-in when there is no session. */
export async function requireWorkspace(): Promise<WorkspaceContext> {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/signin");
  return ctx;
}

/**
 * Action/route-level guard. Runs `fn` with the caller's workspace
 * context; throws a 401-shaped error when signed out.
 */
export async function withWorkspace<T>(
  fn: (ctx: WorkspaceContext) => Promise<T>
): Promise<T> {
  const ctx = await getWorkspaceContext();
  if (!ctx) throw new WorkspaceError("UNAUTHENTICATED");
  return fn(ctx);
}

export class WorkspaceError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "NOT_FOUND") {
    super(code);
  }
}
