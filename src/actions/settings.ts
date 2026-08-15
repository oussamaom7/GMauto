"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";
import { settingsSchema } from "@/lib/validation/settings";
import { saveCompanyLogo, UploadValidationError } from "@/lib/upload";

export type ActionState = { error: string } | undefined;

export async function updateSettings(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSession();

  const parsed = settingsSchema.safeParse({
    companyName: formData.get("companyName"),
    companyAddress: formData.get("companyAddress") || undefined,
    companyPhone: formData.get("companyPhone") || undefined,
    companyEmail: formData.get("companyEmail") || undefined,
    ice: formData.get("ice") || undefined,
    defaultVatRate: formData.get("defaultVatRate"),
    invoicePrefix: formData.get("invoicePrefix"),
    invoiceNumberPadding: formData.get("invoiceNumberPadding"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const logo = formData.get("logo");
  let companyLogoUrl: string | undefined;
  if (logo instanceof File && logo.size > 0) {
    try {
      companyLogoUrl = await saveCompanyLogo(logo);
    } catch (err) {
      return { error: err instanceof UploadValidationError ? err.message : "Échec de l'upload." };
    }
  }

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {
      companyName: parsed.data.companyName,
      companyAddress: parsed.data.companyAddress || null,
      companyPhone: parsed.data.companyPhone || null,
      companyEmail: parsed.data.companyEmail || null,
      ice: parsed.data.ice || null,
      defaultVatRate: parsed.data.defaultVatRate,
      invoicePrefix: parsed.data.invoicePrefix,
      invoiceNumberPadding: parsed.data.invoiceNumberPadding,
      ...(companyLogoUrl ? { companyLogoUrl } : {}),
    },
    create: {
      id: "singleton",
      companyName: parsed.data.companyName,
      companyAddress: parsed.data.companyAddress || null,
      companyPhone: parsed.data.companyPhone || null,
      companyEmail: parsed.data.companyEmail || null,
      ice: parsed.data.ice || null,
      defaultVatRate: parsed.data.defaultVatRate,
      invoicePrefix: parsed.data.invoicePrefix,
      invoiceNumberPadding: parsed.data.invoiceNumberPadding,
      companyLogoUrl,
    },
  });

  revalidatePath("/parametres");
  revalidatePath("/factures/nouveau");
  return undefined;
}
