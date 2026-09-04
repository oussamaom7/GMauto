import { NextResponse } from "next/server";
import { list, del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * TEMPORARY — remove once the Blob store is back under its quota.
 *
 * The store is suspended for exceeding the Hobby 10GB limit, which blocks
 * reads of every old product photo. Our upload code never deleted replaced
 * or removed photos, so most of that 10GB is orphaned files no row in the
 * database points at. Deleting only those should drop the store back under
 * quota and restore access to the photos that are still in use.
 *
 * GET ?mode=dry-run (default) — reports counts/sizes, deletes nothing.
 * GET ?mode=delete           — deletes only files absent from the keep-set.
 */
export const maxDuration = 60;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const mode = new URL(req.url).searchParams.get("mode") === "delete" ? "delete" : "dry-run";

  // The keep-set is derived from the database, never hardcoded — anything
  // still referenced by a product or by the company logo must survive.
  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      where: { imageUrl: { contains: "vercel-storage.com" } },
      select: { imageUrl: true },
    }),
    prisma.settings.findUnique({ where: { id: "singleton" } }),
  ]);

  const keep = new Set<string>();
  const toPathname = (url: string) => new URL(url).pathname.replace(/^\//, "");
  for (const p of products) {
    if (p.imageUrl) keep.add(toPathname(p.imageUrl));
  }
  if (settings?.companyLogoUrl?.includes("vercel-storage.com")) {
    keep.add(toPathname(settings.companyLogoUrl));
  }

  const all: { pathname: string; size: number; url: string }[] = [];
  let cursor: string | undefined;
  try {
    do {
      const page = await list({ cursor, limit: 1000 });
      all.push(...page.blobs.map((b) => ({ pathname: b.pathname, size: b.size, url: b.url })));
      cursor = page.cursor;
    } while (cursor);
  } catch (err) {
    return NextResponse.json(
      { step: "list", error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  const kept = all.filter((b) => keep.has(b.pathname));
  const orphans = all.filter((b) => !keep.has(b.pathname));
  const mb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;

  const summary = {
    mode,
    totalFiles: all.length,
    totalMB: mb(all.reduce((s, b) => s + b.size, 0)),
    expectedToKeep: keep.size,
    matchedInStore: kept.length,
    orphanFiles: orphans.length,
    orphanMB: mb(orphans.reduce((s, b) => s + b.size, 0)),
  };

  if (mode === "dry-run") {
    return NextResponse.json({
      ...summary,
      note: "Rien supprimé. Relancer avec ?mode=delete pour supprimer les orphelins.",
      sampleOrphans: orphans.slice(0, 5).map((b) => b.pathname),
    });
  }

  // Refuse to delete if the keep-set didn't line up with the store — that
  // would mean the pathname matching is wrong, and deleting on a bad match
  // could destroy photos that are actually still in use.
  if (kept.length !== keep.size) {
    return NextResponse.json(
      {
        ...summary,
        aborted:
          "Suppression refusée : les fichiers à conserver trouvés dans le store ne correspondent pas à la liste attendue.",
      },
      { status: 409 }
    );
  }

  let deleted = 0;
  const errors: string[] = [];
  for (let i = 0; i < orphans.length; i += 100) {
    const batch = orphans.slice(i, i + 100).map((b) => b.url);
    try {
      await del(batch);
      deleted += batch.length;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return NextResponse.json({ ...summary, deleted, errors: errors.slice(0, 5) });
}
