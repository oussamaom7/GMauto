import type { Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

/**
 * Atomically increments the singleton counter row. The row-level lock taken by
 * this UPDATE serializes concurrent transactions, so two invoices can never
 * receive the same number even under concurrent submissions.
 */
export async function getNextInvoiceNumber(
  tx: TxClient,
  prefix: string,
  padding: number
): Promise<string> {
  const counter = await tx.invoiceCounter.update({
    where: { id: "singleton" },
    data: { lastNumber: { increment: 1 } },
  });

  return `${prefix}${String(counter.lastNumber).padStart(padding, "0")}`;
}

/**
 * Same atomic-increment pattern as getNextInvoiceNumber, on its own counter.
 * Uses upsert (not update) since existing databases were already seeded
 * before this counter existed — this self-creates the singleton row on
 * first use instead of depending on a reseed.
 */
export async function getNextOrderNumber(tx: TxClient): Promise<string> {
  const counter = await tx.orderConfirmationCounter.upsert({
    where: { id: "singleton" },
    update: { lastNumber: { increment: 1 } },
    create: { id: "singleton", lastNumber: 1 },
  });

  return `BC${String(counter.lastNumber).padStart(4, "0")}`;
}
