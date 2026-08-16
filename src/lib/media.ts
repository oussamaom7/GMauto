/**
 * Product/logo images are stored either as a full Vercel Blob URL (production)
 * or a relative "subfolder/filename" path served by /api/uploads (local dev)
 * — see src/lib/upload.ts for which backend gets picked and why.
 */
export function resolveMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `/api/uploads/${value}`;
}
