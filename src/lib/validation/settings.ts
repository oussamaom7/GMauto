import { z } from "zod";

export const settingsSchema = z.object({
  companyName: z.string().trim().min(1, "Nom de société requis"),
  companyAddress: z.string().trim().optional(),
  companyPhone: z.string().trim().optional(),
  companyEmail: z.string().trim().email("Email invalide").optional().or(z.literal("")),
  ice: z.string().trim().optional(),
  defaultVatRate: z.coerce.number().min(0).max(100),
  invoicePrefix: z.string().trim().min(1, "Préfixe requis"),
  invoiceNumberPadding: z.coerce.number().int().min(1).max(10),
  eurToMad: z.coerce.number().positive("Taux invalide"),
  usdToMad: z.coerce.number().positive("Taux invalide"),
  cnyToMad: z.coerce.number().positive("Taux invalide"),
});
