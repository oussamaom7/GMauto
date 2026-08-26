"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";
import {
  adjustStockSchema,
  productSchema,
  productUpdateSchema,
} from "@/lib/validation/product";
import { saveProductPhoto, UploadValidationError } from "@/lib/upload";
import { recordStockMovement } from "@/lib/stock";
import { PRODUCT_SIDES } from "@/lib/productSide";
import { CURRENCIES } from "@/lib/currency";
import type { ProductOption } from "@/components/stock/ProductCombobox";

export type ActionState = { error: string } | undefined;

/**
 * Generates a unique placeholder reference for a quick-created product left
 * without one — the shop can rename it later from Stock once they know the
 * part's real reference.
 */
async function generatePlaceholderReference(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `SANS-REF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const existing = await prisma.product.findUnique({ where: { reference: candidate } });
    if (!existing) return candidate;
  }
  throw new Error("Impossible de générer une référence unique");
}

/**
 * Lets a new part be added on the fly from the Facture/Bon de commande line
 * item editor, without leaving the page to go create it in Stock first.
 * Photo/référence/prix are the fields that matter most here (mirrors the
 * shop's own priorities) — désignation and côté stay optional extras, and
 * référence itself is optional too (a placeholder is generated if left
 * blank, since the shop sometimes adds a part before knowing its reference).
 */
export async function quickCreateProduct(
  formData: FormData
): Promise<{ error: string } | { product: ProductOption }> {
  const session = await requireSession();

  let reference = String(formData.get("reference") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const sideRaw = String(formData.get("side") ?? "");
  const side = (PRODUCT_SIDES as readonly string[]).includes(sideRaw)
    ? (sideRaw as (typeof PRODUCT_SIDES)[number])
    : null;
  const rmb = Number(formData.get("rmb")) || 0;
  const rmbCurrencyRaw = String(formData.get("rmbCurrency") ?? "MAD");
  const rmbCurrency = (CURRENCIES as readonly string[]).includes(rmbCurrencyRaw)
    ? (rmbCurrencyRaw as (typeof CURRENCIES)[number])
    : "MAD";
  const quantity = Math.trunc(Number(formData.get("quantity"))) || 0;

  if (reference) {
    const existing = await prisma.product.findUnique({ where: { reference } });
    if (existing) {
      return { error: "Cette référence existe déjà." };
    }
  } else {
    reference = await generatePlaceholderReference();
  }

  const photo = formData.get("photo");
  let imageUrl: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    try {
      imageUrl = await saveProductPhoto(photo);
    } catch (err) {
      if (err instanceof UploadValidationError) {
        return { error: err.message };
      }
      console.error("Product photo upload failed:", err);
      return {
        error:
          "Échec de l'upload. Si le problème persiste en production, vérifiez qu'un Vercel Blob store est bien connecté au projet.",
      };
    }
  }

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        reference,
        name: name || reference,
        quantity: 0,
        rmb,
        rmbCurrency,
        side,
        imageUrl,
      },
    });

    if (quantity !== 0) {
      await recordStockMovement(tx, {
        productId: created.id,
        type: "ENTREE",
        delta: quantity,
        note: "Stock initial",
        userId: session?.user?.id,
      });
    }

    return created;
  });

  revalidatePath("/stock");

  return {
    product: {
      id: product.id,
      reference: product.reference,
      name: product.name,
      sellingPrice: null,
      rmb: Number(product.rmb),
      rmbCurrency: product.rmbCurrency,
      quantity,
      side: product.side,
    },
  };
}

async function resolveTaxonomyIds(
  tx: Pick<typeof prisma, "category" | "brand">,
  category?: string,
  brand?: string
) {
  const categoryId = category
    ? (
        await tx.category.upsert({
          where: { name: category },
          update: {},
          create: { name: category },
        })
      ).id
    : null;

  const brandId = brand
    ? (
        await tx.brand.upsert({
          where: { name: brand },
          update: {},
          create: { name: brand },
        })
      ).id
    : null;

  return { categoryId, brandId };
}

export async function createProduct(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const parsed = productSchema.safeParse({
    reference: formData.get("reference"),
    name: formData.get("name"),
    quantity: formData.get("quantity") || 0,
    rmb: formData.get("rmb") || 0,
    rmbCurrency: formData.get("rmbCurrency") || undefined,
    sellingPrice: formData.get("sellingPrice") || undefined,
    minimumStock: formData.get("minimumStock") || 0,
    location: formData.get("location") || undefined,
    side: formData.get("side") || undefined,
    category: formData.get("category") || undefined,
    brand: formData.get("brand") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const existing = await prisma.product.findUnique({
    where: { reference: parsed.data.reference },
  });
  if (existing) {
    return { error: "Cette référence existe déjà." };
  }

  const photo = formData.get("photo");
  let imageUrl: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    try {
      imageUrl = await saveProductPhoto(photo);
    } catch (err) {
      if (err instanceof UploadValidationError) {
        return { error: err.message };
      }
      console.error("Product photo upload failed:", err);
      return {
        error:
          "Échec de l'upload. Si le problème persiste en production, vérifiez qu'un Vercel Blob store est bien connecté au projet.",
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    const { categoryId, brandId } = await resolveTaxonomyIds(
      tx,
      parsed.data.category,
      parsed.data.brand
    );

    const product = await tx.product.create({
      data: {
        reference: parsed.data.reference,
        name: parsed.data.name || parsed.data.reference,
        quantity: 0,
        rmb: parsed.data.rmb,
        rmbCurrency: parsed.data.rmbCurrency,
        sellingPrice: parsed.data.sellingPrice,
        minimumStock: parsed.data.minimumStock,
        location: parsed.data.location,
        side: parsed.data.side ?? null,
        categoryId,
        brandId,
        imageUrl,
      },
    });

    if (parsed.data.quantity !== 0) {
      await recordStockMovement(tx, {
        productId: product.id,
        type: "ENTREE",
        delta: parsed.data.quantity,
        note: "Stock initial",
        userId: session?.user?.id,
      });
    }
  });

  revalidatePath("/stock");
  redirect("/stock");
}

export async function updateProduct(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSession();

  const parsed = productUpdateSchema.safeParse({
    reference: formData.get("reference"),
    name: formData.get("name"),
    rmb: formData.get("rmb") || 0,
    rmbCurrency: formData.get("rmbCurrency") || undefined,
    sellingPrice: formData.get("sellingPrice") || undefined,
    minimumStock: formData.get("minimumStock") || 0,
    location: formData.get("location") || undefined,
    side: formData.get("side") || undefined,
    category: formData.get("category") || undefined,
    brand: formData.get("brand") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const duplicate = await prisma.product.findFirst({
    where: { reference: parsed.data.reference, NOT: { id } },
  });
  if (duplicate) {
    return { error: "Cette référence existe déjà." };
  }

  const photo = formData.get("photo");
  let imageUrl: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    try {
      imageUrl = await saveProductPhoto(photo);
    } catch (err) {
      if (err instanceof UploadValidationError) {
        return { error: err.message };
      }
      console.error("Product photo upload failed:", err);
      return {
        error:
          "Échec de l'upload. Si le problème persiste en production, vérifiez qu'un Vercel Blob store est bien connecté au projet.",
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    const { categoryId, brandId } = await resolveTaxonomyIds(
      tx,
      parsed.data.category,
      parsed.data.brand
    );

    await tx.product.update({
      where: { id },
      data: {
        reference: parsed.data.reference,
        name: parsed.data.name || parsed.data.reference,
        rmb: parsed.data.rmb,
        rmbCurrency: parsed.data.rmbCurrency,
        sellingPrice: parsed.data.sellingPrice,
        minimumStock: parsed.data.minimumStock,
        location: parsed.data.location,
        side: parsed.data.side ?? null,
        categoryId,
        brandId,
        ...(imageUrl ? { imageUrl } : {}),
      },
    });
  });

  revalidatePath("/stock");
  redirect("/stock");
}

export async function deactivateProduct(id: string) {
  await requireSession();

  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
  revalidatePath("/stock");
  revalidatePath("/stock/desactivees");
}

export async function reactivateProduct(id: string) {
  await requireSession();

  await prisma.product.update({
    where: { id },
    data: { isActive: true },
  });
  revalidatePath("/stock");
  revalidatePath("/stock/desactivees");
}

export async function deleteProduct(id: string) {
  await requireSession();

  // Stock movements referencing this product block the delete (FK is
  // ON DELETE RESTRICT, unlike invoice items which are ON DELETE SET NULL
  // to preserve the invoice's already-frozen description/price) — clear
  // that history first since it has no meaning once the product is gone.
  await prisma.$transaction([
    prisma.stockMovement.deleteMany({ where: { productId: id } }),
    prisma.product.delete({ where: { id } }),
  ]);

  revalidatePath("/stock");
  revalidatePath("/stock/desactivees");
  revalidatePath("/stock/mouvements");
}

export async function adjustStock(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const parsed = adjustStockSchema.safeParse({
    productId: formData.get("productId"),
    delta: formData.get("delta"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  await prisma.$transaction((tx) =>
    recordStockMovement(tx, {
      productId: parsed.data.productId,
      type: "AJUSTEMENT",
      delta: parsed.data.delta,
      note: parsed.data.note,
      userId: session?.user?.id,
    })
  );

  revalidatePath("/stock");
  revalidatePath("/stock/mouvements");
  revalidatePath(`/stock/${parsed.data.productId}`);
}
