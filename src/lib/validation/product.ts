import { z } from "zod";

export const productSchema = z.object({
  reference: z.string().trim().min(1, "Référence requise"),
  name: z.string().trim().min(1, "Désignation requise"),
  quantity: z.coerce.number().int("La quantité doit être un nombre entier"),
  rmb: z.coerce.number().min(0, "RMB doit être positif"),
  sellingPrice: z.coerce.number().min(0).optional(),
  minimumStock: z.coerce.number().int().min(0).default(0),
  location: z.string().trim().optional(),
  category: z.string().trim().optional(),
  brand: z.string().trim().optional(),
});

export const productUpdateSchema = productSchema.omit({ quantity: true });

export const adjustStockSchema = z.object({
  productId: z.string().min(1),
  delta: z.coerce
    .number()
    .int("La quantité doit être un nombre entier")
    .refine((v) => v !== 0, "La quantité doit être différente de zéro"),
  note: z.string().trim().min(1, "Motif requis"),
});
