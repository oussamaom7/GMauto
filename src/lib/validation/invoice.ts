import { z } from "zod";
import { CURRENCIES } from "@/lib/currency";

export const invoiceItemSchema = z.object({
  productId: z.string().nullable(),
  description: z.string().trim().min(1, "Désignation requise"),
  quantity: z.coerce.number().int("Quantité invalide").positive("Quantité invalide"),
  unitPrice: z.coerce.number().min(0, "Prix invalide"),
});

export const createInvoiceSchema = z
  .object({
    customerId: z.string().optional(),
    newCustomerName: z.string().trim().optional(),
    newCustomerPhone: z.string().trim().optional(),
    newCustomerEmail: z.string().trim().optional(),
    date: z.string().min(1, "Date requise"),
    currency: z.enum(CURRENCIES).default("MAD"),
    paidAmount: z.coerce.number().min(0).default(0),
    applyVat: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(true),
    items: z.array(invoiceItemSchema).min(1, "Ajoutez au moins une ligne"),
  })
  .refine((data) => !!data.customerId || !!data.newCustomerName, {
    message: "Sélectionnez un client ou renseignez un nouveau client",
    path: ["customerId"],
  });

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive("Montant invalide"),
  method: z.string().trim().optional(),
  note: z.string().trim().optional(),
});
