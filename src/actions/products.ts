"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  adjustStockSchema,
  productSchema,
  productUpdateSchema,
} from "@/lib/validation/product";
import { saveProductPhoto } from "@/lib/upload";
import { recordStockMovement } from "@/lib/stock";

export type ActionState = { error: string } | undefined;

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
  const session = await auth();

  const parsed = productSchema.safeParse({
    reference: formData.get("reference"),
    name: formData.get("name"),
    quantity: formData.get("quantity"),
    rmb: formData.get("rmb"),
    sellingPrice: formData.get("sellingPrice") || undefined,
    minimumStock: formData.get("minimumStock") || 0,
    location: formData.get("location") || undefined,
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
  const imageUrl =
    photo instanceof File && photo.size > 0
      ? await saveProductPhoto(photo)
      : undefined;

  await prisma.$transaction(async (tx) => {
    const { categoryId, brandId } = await resolveTaxonomyIds(
      tx,
      parsed.data.category,
      parsed.data.brand
    );

    const product = await tx.product.create({
      data: {
        reference: parsed.data.reference,
        name: parsed.data.name,
        quantity: 0,
        rmb: parsed.data.rmb,
        sellingPrice: parsed.data.sellingPrice,
        minimumStock: parsed.data.minimumStock,
        location: parsed.data.location,
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
  const parsed = productUpdateSchema.safeParse({
    reference: formData.get("reference"),
    name: formData.get("name"),
    rmb: formData.get("rmb"),
    sellingPrice: formData.get("sellingPrice") || undefined,
    minimumStock: formData.get("minimumStock") || 0,
    location: formData.get("location") || undefined,
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
  const imageUrl =
    photo instanceof File && photo.size > 0
      ? await saveProductPhoto(photo)
      : undefined;

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
        name: parsed.data.name,
        rmb: parsed.data.rmb,
        sellingPrice: parsed.data.sellingPrice,
        minimumStock: parsed.data.minimumStock,
        location: parsed.data.location,
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
  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
  revalidatePath("/stock");
}

export async function adjustStock(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();

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
