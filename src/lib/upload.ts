import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, before compression
const MAX_DIMENSION = 1600; // px, longest side — plenty for any view/PDF use in this app
const JPEG_QUALITY = 80;
const SUPABASE_BUCKET = "uploads";

export class UploadValidationError extends Error {}

/**
 * Detects the real image format from its magic bytes. Never trust `file.type`
 * or the filename extension for this — both are just metadata the browser
 * derives from the filename and are trivially spoofed by naming any file
 * "x.png". Only the actual byte content can't be faked this cheaply.
 */
function detectImageExtension(buffer: Buffer): string | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return ".png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return ".jpg";
  }
  if (
    buffer.length >= 6 &&
    buffer.toString("ascii", 0, 3) === "GIF" &&
    (buffer.toString("ascii", 3, 6) === "87a" || buffer.toString("ascii", 3, 6) === "89a")
  ) {
    return ".gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return ".webp";
  }
  return null;
}

/**
 * Re-encodes every upload as a resized JPEG, regardless of the original
 * format. A phone-camera photo (often 3-8MB) shrinks to well under 500KB —
 * this app never displays a photo bigger than a small thumbnail (Stock
 * table, PDFs), so nothing is lost, and it matters a lot on a storage-capped
 * plan (Vercel Blob's Hobby tier is 10GB total).
 */
async function compressImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .rotate() // bake in EXIF orientation before it gets stripped below
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
  } catch {
    throw new UploadValidationError("Image invalide ou corrompue.");
  }
}

/**
 * Server-only Supabase client using the service role key, which bypasses
 * Storage RLS — safe here since every caller is already an authenticated
 * Server Action (see requireSession() at each call site), and this key is
 * never sent to the browser. Returns null when unconfigured so local dev
 * can fall back to disk without needing Supabase credentials.
 */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * Storage backend is picked at runtime: Supabase Storage when configured,
 * local disk otherwise — so local dev needs no cloud credentials, and
 * production (whose filesystem is ephemeral on Vercel) gets persistent,
 * publicly-servable storage automatically.
 */
async function saveUploadedFile(file: File, subfolder: string): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadValidationError("Fichier trop volumineux (5 Mo maximum).");
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  if (!detectImageExtension(rawBuffer)) {
    throw new UploadValidationError("Format d'image non supporté (JPEG, PNG, WEBP ou GIF requis).");
  }

  const buffer = await compressImage(rawBuffer);
  const filename = `${crypto.randomUUID()}.jpg`;
  const objectPath = `${subfolder}/${filename}`;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(objectPath, buffer, { contentType: "image/jpeg" });
    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }
    return supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(objectPath).data.publicUrl;
  }

  const dir = path.join(UPLOAD_ROOT, subfolder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return objectPath;
}

export function saveProductPhoto(file: File): Promise<string> {
  return saveUploadedFile(file, "products");
}

export function saveCompanyLogo(file: File): Promise<string> {
  return saveUploadedFile(file, "company");
}
