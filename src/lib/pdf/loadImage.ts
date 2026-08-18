import { readFile } from "fs/promises";
import path from "path";

/**
 * Images are stored either as a full Vercel Blob URL (production) or a
 * relative "subfolder/filename" path on local disk (dev) — see
 * src/lib/upload.ts for which backend gets picked and why. PDF generation
 * needs the actual bytes, not the app-relative URL browsers use.
 */
export async function loadImageBuffer(imageUrl: string | null | undefined): Promise<Buffer | null> {
  if (!imageUrl) return null;
  try {
    if (imageUrl.startsWith("http")) {
      const res = await fetch(imageUrl);
      return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
    }
    return await readFile(path.join(process.cwd(), "storage", "uploads", imageUrl));
  } catch {
    return null;
  }
}
