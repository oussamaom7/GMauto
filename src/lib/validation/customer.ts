import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Email invalide").optional().or(z.literal("")),
  address: z.string().trim().optional(),
});
