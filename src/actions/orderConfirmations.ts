"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";
import { createOrderConfirmationSchema } from "@/lib/validation/orderConfirmation";
import { getNextOrderNumber, getNextInvoiceNumber } from "@/lib/invoiceNumbering";
import { getSettings } from "@/lib/settings";
import { recordStockMovement } from "@/lib/stock";
import { toMad } from "@/lib/currency";

export type ActionState = { error: string } | undefined;

function computeStatus(total: number, paid: number) {
  if (paid <= 0) return "NON_PAYEE" as const;
  if (paid >= total) return "PAYEE" as const;
  return "PARTIELLEMENT_PAYEE" as const;
}

export async function createOrderConfirmation(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSession();

  let itemsRaw: unknown;
  try {
    itemsRaw = JSON.parse(String(formData.get("itemsJson") ?? "[]"));
  } catch {
    return { error: "Lignes invalides" };
  }

  const parsed = createOrderConfirmationSchema.safeParse({
    customerId: formData.get("customerId") || undefined,
    reference: formData.get("reference") || undefined,
    newCustomerName: formData.get("newCustomerName") || undefined,
    newCustomerPhone: formData.get("newCustomerPhone") || undefined,
    newCustomerEmail: formData.get("newCustomerEmail") || undefined,
    date: formData.get("date"),
    currency: formData.get("currency") || undefined,
    applyVat: formData.get("applyVat"),
    items: itemsRaw,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const settings = await getSettings();
  const exchangeRate = toMad(1, parsed.data.currency, settings);
  const vatRate = parsed.data.applyVat ? Number(settings.defaultVatRate) : 0;
  const subtotal = parsed.data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  const result = await prisma.$transaction(async (tx) => {
    const customerId = parsed.data.customerId
      ? parsed.data.customerId
      : (
          await tx.customer.create({
            data: {
              name: parsed.data.newCustomerName!,
              phone: parsed.data.newCustomerPhone || null,
              email: parsed.data.newCustomerEmail || null,
            },
          })
        ).id;

    const number = await getNextOrderNumber(tx);

    const order = await tx.orderConfirmation.create({
      data: {
        number,
        reference: parsed.data.reference || null,
        customerId,
        date: new Date(parsed.data.date),
        currency: parsed.data.currency,
        exchangeRate,
        subtotal,
        vatRate,
        vatAmount,
        total,
        items: {
          create: parsed.data.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
    });

    return { orderId: order.id, customerId };
  });

  revalidatePath("/bons-de-commande");
  revalidatePath("/clients");
  revalidatePath(`/clients/${result.customerId}`);
  redirect(`/bons-de-commande/${result.orderId}`);
}

export async function deleteOrderConfirmation(id: string): Promise<ActionState> {
  await requireSession();

  const order = await prisma.orderConfirmation.findUnique({ where: { id } });
  if (!order) return undefined;
  if (order.status === "CONVERTIE") {
    return {
      error: "Ce bon de commande a déjà été converti en facture et ne peut pas être supprimé.",
    };
  }

  await prisma.orderConfirmation.delete({ where: { id } });
  revalidatePath("/bons-de-commande");
  return undefined;
}

export async function convertOrderToInvoice(
  orderId: string
): Promise<{ error: string } | { invoiceId: string }> {
  const session = await requireSession();

  let invoiceId: string;
  try {
    invoiceId = await prisma.$transaction(async (tx) => {
      const order = await tx.orderConfirmation.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) throw new Error("Bon de commande introuvable");
      if (order.status !== "EN_ATTENTE") {
        throw new Error("Ce bon de commande a déjà été traité");
      }

      const settings = await getSettings();
      const number = await getNextInvoiceNumber(
        tx,
        settings.invoicePrefix,
        settings.invoiceNumberPadding
      );

      const total = Number(order.total);
      const invoice = await tx.invoice.create({
        data: {
          number,
          customerId: order.customerId,
          date: new Date(),
          currency: order.currency,
          exchangeRate: order.exchangeRate,
          subtotal: order.subtotal,
          vatRate: order.vatRate,
          vatAmount: order.vatAmount,
          total: order.total,
          paidAmount: 0,
          remainingAmount: total,
          status: computeStatus(total, 0),
          items: {
            create: order.items.map((item) => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of invoice.items) {
        if (item.productId) {
          await recordStockMovement(tx, {
            productId: item.productId,
            type: "SORTIE",
            delta: -item.quantity,
            reference: invoice.number,
            invoiceId: invoice.id,
            userId: session?.user?.id,
          });
        }
      }

      await tx.orderConfirmation.update({
        where: { id: orderId },
        data: { status: "CONVERTIE", invoiceId: invoice.id },
      });

      return invoice.id;
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inconnue" };
  }

  revalidatePath("/bons-de-commande");
  revalidatePath(`/bons-de-commande/${orderId}`);
  revalidatePath("/factures");
  revalidatePath("/stock");
  revalidatePath("/stock/mouvements");
  return { invoiceId };
}
