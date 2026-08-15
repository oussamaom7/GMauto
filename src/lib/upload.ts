import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

async function saveUploadedFile(file: File, subfolder: string): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadValidationError("Fichier trop volumineux (5 Mo maximum).");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = detectImageExtension(buffer);
  if (!ext) {
    throw new UploadValidationError("Format d'image non supporté (JPEG, PNG, WEBP ou GIF requis).");
  }

  const filename = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(UPLOAD_ROOT, subfolder);

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  return `${subfolder}/${filename}`;
}

export function saveProductPhoto(file: File): Promise<string> {
  return saveUploadedFile(file, "products");
}

export function saveCompanyLogo(file: File): Promise<string> {
  return saveUploadedFile(file, "company");
}
