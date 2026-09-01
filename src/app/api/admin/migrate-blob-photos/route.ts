// TEMPORARY diagnostic/migration route — delete after use.
// Attempts to pull old product photos out of the suspended Vercel Blob
// store via the OIDC-authenticated get() API (bypassing the public CDN URL,
// which already confirmed 403), and re-uploads any that succeed to
// Supabase Storage, updating the product record to point at the new URL.
import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const products = await prisma.product.findMany({
    where: { imageUrl: { contains: "vercel-storage.com" } },
  });

  const results: { reference: string; status: string }[] = [];

  for (const product of products) {
    try {
      const result = await get(product.imageUrl!, { access: "public", useCache: false });
      if (!result || result.statusCode !== 200 || !result.stream) {
        results.push({ reference: product.reference, status: "get() returned no content" });
        continue;
      }

      const chunks: Uint8Array[] = [];
      const reader = result.stream.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      const raw = Buffer.concat(chunks);
      const jpeg = await sharp(raw).jpeg({ quality: 80 }).toBuffer();

      const objectPath = `products/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage
        .from("uploads")
        .upload(objectPath, jpeg, { contentType: "image/jpeg" });
      if (error) {
        results.push({ reference: product.reference, status: `supabase upload failed: ${error.message}` });
        continue;
      }

      const publicUrl = supabase.storage.from("uploads").getPublicUrl(objectPath).data.publicUrl;
      await prisma.product.update({ where: { id: product.id }, data: { imageUrl: publicUrl } });
      results.push({ reference: product.reference, status: "migrated" });
    } catch (err) {
      results.push({
        reference: product.reference,
        status: `error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  const migrated = results.filter((r) => r.status === "migrated").length;
  return NextResponse.json({ total: products.length, migrated, results });
}
