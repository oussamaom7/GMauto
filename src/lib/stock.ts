import type { Prisma, StockMovementType } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

/**
 * `delta` is always the signed change applied to Product.quantity
 * (positive = entrée, negative = sortie), regardless of `type` — `type` is
 * purely a label for display/audit (ENTREE, SORTIE, AJUSTEMENT).
 */
export async function recordStockMovement(
  tx: TxClient,
  params: {
    productId: string;
    type: StockMovementType;
    delta: number;
    reference?: string;
    invoiceId?: string;
    userId?: string;
    note?: string;
  }
) {
  await tx.product.update({
    where: { id: params.productId },
    data: { quantity: { increment: params.delta } },
  });

  await tx.stockMovement.create({
    data: {
      productId: params.productId,
      type: params.type,
      quantity: params.delta,
      reference: params.reference,
      invoiceId: params.invoiceId,
      userId: params.userId,
      note: params.note,
    },
  });
}

type StockMovementParams = Parameters<typeof recordStockMovement>[1];

/**
 * Batched equivalent of calling recordStockMovement per line: one product
 * update per distinct product (deltas summed) plus a single createMany for
 * the movement rows, so cost doesn't grow with the number of invoice lines.
 */
export async function recordStockMovements(
  tx: TxClient,
  movements: StockMovementParams[]
) {
  if (movements.length === 0) return;

  const deltaByProduct = new Map<string, number>();
  for (const m of movements) {
    deltaByProduct.set(m.productId, (deltaByProduct.get(m.productId) ?? 0) + m.delta);
  }

  await Promise.all(
    [...deltaByProduct].map(([productId, delta]) =>
      tx.product.update({
        where: { id: productId },
        data: { quantity: { increment: delta } },
      })
    )
  );

  await tx.stockMovement.createMany({
    data: movements.map((m) => ({
      productId: m.productId,
      type: m.type,
      quantity: m.delta,
      reference: m.reference,
      invoiceId: m.invoiceId,
      userId: m.userId,
      note: m.note,
    })),
  });
}
