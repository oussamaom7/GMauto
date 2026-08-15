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
