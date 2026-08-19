import { z } from "zod";
import { CURRENCIES } from "@/lib/currency";
import { invoiceItemSchema } from "@/lib/validation/invoice";

export const createOrderConfirmationSchema = z
  .object({
    customerId: z.string().optional(),
    reference: z.string().trim().optional(),
    newCustomerName: z.string().trim().optional(),
    newCustomerPhone: z.string().trim().optional(),
    newCustomerEmail: z.string().trim().optional(),
    date: z.string().min(1, "Date requise"),
    currency: z.enum(CURRENCIES).default("MAD"),
    applyVat: z.preprocess((v) => v === "on" || v === true, z.boolean()).default(true),
    items: z.array(invoiceItemSchema).min(1, "Ajoutez au moins une ligne"),
  })
  .refine((data) => !!data.customerId || !!data.newCustomerName, {
    message: "Sélectionnez un client ou renseignez un nouveau client",
    path: ["customerId"],
  });
