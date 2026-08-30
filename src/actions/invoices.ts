"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { InvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";
import { createInvoiceSchema, recordPaymentSchema } from "@/lib/validation/invoice";
import { getNextInvoiceNumber } from "@/lib/invoiceNumbering";
import { getSettings } from "@/lib/settings";
import { recordStockMovement } from "@/lib/stock";
import { toMad } from "@/lib/currency";

export type ActionState = { error: string } | undefined;

function computeStatus(total: number, paid: number): InvoiceStatus {
  if (paid <= 0) return "NON_PAYEE";
  if (paid >= total) return "PAYEE";
  return "PARTIELLEMENT_PAYEE";
}

export async function createInvoice(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  let itemsRaw: unknown;
  try {
    itemsRaw = JSON.parse(String(formData.get("itemsJson") ?? "[]"));
  } catch {
    return { error: "Lignes de facture invalides" };
  }

  const parsed = createInvoiceSchema.safeParse({
    customerId: formData.get("customerId") || undefined,
    newCustomerName: formData.get("newCustomerName") || undefined,
    newCustomerPhone: formData.get("newCustomerPhone") || undefined,
    newCustomerEmail: formData.get("newCustomerEmail") || undefined,
    date: formData.get("date"),
    currency: formData.get("currency") || undefined,
    paidAmount: formData.get("paidAmount") || 0,
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
  const remainingAmount = Math.max(total - parsed.data.paidAmount, 0);
  const status = computeStatus(total, parsed.data.paidAmount);

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

    const number = await getNextInvoiceNumber(
      tx,
      settings.invoicePrefix,
      settings.invoiceNumberPadding
    );

    const invoice = await tx.invoice.create({
      data: {
        number,
        customerId,
        date: new Date(parsed.data.date),
        currency: parsed.data.currency,
        exchangeRate,
        subtotal,
        vatRate,
        vatAmount,
        total,
        paidAmount: parsed.data.paidAmount,
        remainingAmount,
        status,
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

    return { invoiceId: invoice.id, customerId };
  });

  revalidatePath("/factures");
  revalidatePath("/stock");
  revalidatePath("/stock/mouvements");
  revalidatePath("/clients");
  revalidatePath(`/clients/${result.customerId}`);
  redirect(`/factures/${result.invoiceId}`);
}

export async function updateInvoice(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  let itemsRaw: unknown;
  try {
    itemsRaw = JSON.parse(String(formData.get("itemsJson") ?? "[]"));
  } catch {
    return { error: "Lignes de facture invalides" };
  }

  const parsed = createInvoiceSchema.safeParse({
    customerId: formData.get("customerId") || undefined,
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

  let customerId: string;
  try {
    customerId = await prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!existing) throw new Error("Facture introuvable");
      if (existing.status === "ANNULEE") {
        throw new Error("Cette facture est annulée et ne peut plus être modifiée.");
      }

      // Restock everything the current version of the invoice decremented,
      // then re-deduct fresh for the edited items below — simpler and more
      // robust than diffing old vs new line-by-line, and it keeps a full,
      // honest movement history instead of silently rewriting it.
      for (const item of existing.items) {
        if (item.productId) {
          await recordStockMovement(tx, {
            productId: item.productId,
            type: "ENTREE",
            delta: item.quantity,
            reference: `Modification ${existing.number}`,
            userId: session?.user?.id,
          });
        }
      }

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

      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

      // Payments already recorded are untouched by editing line items — only
      // the balance owed is recomputed against the new total.
      const paidAmount = Number(existing.paidAmount);
      const remainingAmount = Math.max(total - paidAmount, 0);
      const status = computeStatus(total, paidAmount);

      const updated = await tx.invoice.update({
        where: { id },
        data: {
          customerId,
          date: new Date(parsed.data.date),
          currency: parsed.data.currency,
          exchangeRate,
          subtotal,
          vatRate,
          vatAmount,
          total,
          remainingAmount,
          status,
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
        include: { items: true },
      });

      for (const item of updated.items) {
        if (item.productId) {
          await recordStockMovement(tx, {
            productId: item.productId,
            type: "SORTIE",
            delta: -item.quantity,
            reference: updated.number,
            invoiceId: updated.id,
            userId: session?.user?.id,
          });
        }
      }

      return customerId;
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inconnue" };
  }

  revalidatePath("/factures");
  revalidatePath(`/factures/${id}`);
  revalidatePath("/stock");
  revalidatePath("/stock/mouvements");
  revalidatePath("/clients");
  revalidatePath(`/clients/${customerId}`);
  redirect(`/factures/${id}`);
}

export async function recordPayment(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSession();

  const parsed = recordPaymentSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    amount: formData.get("amount"),
    method: formData.get("method") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  let customerId: string;
  try {
    customerId = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: parsed.data.invoiceId },
      });
      if (!invoice) throw new Error("Facture introuvable");
      if (invoice.status === "ANNULEE") {
        throw new Error("Cette facture est annulée, paiement impossible");
      }

      await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: parsed.data.amount,
          method: parsed.data.method || null,
          note: parsed.data.note || null,
        },
      });

      const newPaid = Number(invoice.paidAmount) + parsed.data.amount;
      const total = Number(invoice.total);
      const remainingAmount = Math.max(total - newPaid, 0);
      const status = computeStatus(total, newPaid);

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { paidAmount: newPaid, remainingAmount, status },
      });

      return invoice.customerId;
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inconnue" };
  }

  revalidatePath("/factures");
  revalidatePath(`/factures/${parsed.data.invoiceId}`);
  revalidatePath("/clients");
  revalidatePath(`/clients/${customerId}`);
}

export async function voidInvoice(invoiceId: string) {
  const session = await requireSession();

  const customerId = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });
    if (!invoice || invoice.status === "ANNULEE") {
      return invoice?.customerId ?? null;
    }

    for (const item of invoice.items) {
      if (item.productId) {
        await recordStockMovement(tx, {
          productId: item.productId,
          type: "ENTREE",
          delta: item.quantity,
          reference: `Annulation ${invoice.number}`,
          invoiceId: invoice.id,
          userId: session?.user?.id,
        });
      }
    }

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: "ANNULEE" },
    });

    return invoice.customerId;
  });

  revalidatePath("/factures");
  revalidatePath(`/factures/${invoiceId}`);
  revalidatePath("/stock");
  revalidatePath("/stock/mouvements");
  revalidatePath("/clients");
  if (customerId) revalidatePath(`/clients/${customerId}`);
}

export async function deleteInvoice(invoiceId: string) {
  const session = await requireSession();

  const customerId = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });
    if (!invoice) return null;

    // Restock, same as voidInvoice, unless it was already voided (stock
    // was already restored then — crediting it again would double-count).
    if (invoice.status !== "ANNULEE") {
      for (const item of invoice.items) {
        if (item.productId) {
          await recordStockMovement(tx, {
            productId: item.productId,
            type: "ENTREE",
            delta: item.quantity,
            reference: `Suppression ${invoice.number}`,
            userId: session?.user?.id,
          });
        }
      }
    }

    // Items/payments cascade at the DB level; any stock movement still
    // pointing at this invoice (including the compensating ones just
    // created above) has its invoiceId set null rather than being deleted.
    await tx.invoice.delete({ where: { id: invoiceId } });

    return invoice.customerId;
  });

  revalidatePath("/factures");
  revalidatePath("/stock");
  revalidatePath("/stock/mouvements");
  revalidatePath("/clients");
  if (customerId) revalidatePath(`/clients/${customerId}`);
}
