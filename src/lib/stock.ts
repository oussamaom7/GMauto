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
