import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

async function saveUploadedFile(file: File, subfolder: string): Promise<string> {
  const extFromName = path.extname(file.name);
  const ext = extFromName || EXTENSION_BY_MIME[file.type] || ".jpg";
  const filename = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(UPLOAD_ROOT, subfolder);

  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `${subfolder}/${filename}`;
}

export function saveProductPhoto(file: File): Promise<string> {
  return saveUploadedFile(file, "products");
}

export function saveCompanyLogo(file: File): Promise<string> {
  return saveUploadedFile(file, "company");
}
