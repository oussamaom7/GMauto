import { auth } from "@/lib/auth";

/**
 * Explicit per-action authorization check. The proxy/middleware already gates
 * page navigation and action requests by path, but Server Actions and Route
 * Handlers should never rely on that alone — this is the defense-in-depth
 * check Next.js's own docs recommend doing inside the handler itself.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Non autorisé");
  }
  return session;
}
