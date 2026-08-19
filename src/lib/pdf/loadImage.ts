import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

/**
 * Images are stored either as a full Vercel Blob URL (production) or a
 * relative "subfolder/filename" path on local disk (dev) — see
 * src/lib/upload.ts for which backend gets picked and why. PDF generation
 * needs the actual bytes, not the app-relative URL browsers use.
 *
 * PDFKit's `.image()` only decodes JPEG and PNG — uploads are also accepted
 * as WEBP/GIF (see detectImageExtension in upload.ts), and PDFKit throws
 * "Unknown image format" on those, which the caller's try/catch silently
 * swallows, making the photo just not appear. Re-encoding everything here
 * guarantees any accepted upload format actually renders.
 *
 * These embed at ~24-46px in the generated PDFs, so the source photo's full
 * resolution is wasted weight — resizing down and using JPEG (not a lossless
 * PNG re-encode) keeps a multi-photo PDF from ballooning to tens of MB with
 * zero visible quality loss at that render size. Transparency (e.g. a logo
 * with a transparent background) is flattened onto white to match the page.
 */
export async function loadImageBuffer(imageUrl: string | null | undefined): Promise<Buffer | null> {
  if (!imageUrl) return null;
  try {
    let raw: Buffer;
    if (imageUrl.startsWith("http")) {
      const res = await fetch(imageUrl);
      if (!res.ok) return null;
      raw = Buffer.from(await res.arrayBuffer());
    } else {
      raw = await readFile(path.join(process.cwd(), "storage", "uploads", imageUrl));
    }
    return await sharp(raw)
      .resize(240, 240, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    return null;
  }
}
