import { notFound } from "next/navigation";
import { FileDown, ArrowLeft, CircleCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { OrderStatusBadge } from "@/components/orderConfirmations/OrderStatusBadge";
import { ConvertToInvoiceButton } from "@/components/orderConfirmations/ConvertToInvoiceButton";
import { DeleteOrderConfirmationButton } from "@/components/orderConfirmations/DeleteOrderConfirmationButton";
import { formatDate, formatInvoiceAmount } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table, THead, TH, TR, TD } from "@/components/ui/Table";

export default async function BonDeCommandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.orderConfirmation.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true } },
      invoice: true,
    },
  });

  if (!order) {
    notFound();
  }

  const isPending = order.status === "EN_ATTENTE";

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={order.number}
        description={
          order.reference
            ? `${formatDate(order.date)} · Réf. client : ${order.reference}`
            : formatDate(order.date)
        }
        actions={
          <>
            <Button href="/bons-de-commande" variant="secondary" icon={<ArrowLeft size={16} />}>
              Retour
            </Button>
            <Button href={`/bons-de-commande/${order.id}/pdf`} target="_blank" icon={<FileDown size={16} />}>
              Télécharger le PDF
            </Button>
          </>
        }
      />

      <div className="flex items-center gap-2">
        <OrderStatusBadge status={order.status} />
      </div>

      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Commande de</p>
        <a
          href={`/clients/${order.customerId}`}
          className="font-medium text-zinc-900 hover:text-blue-600 hover:underline dark:text-zinc-50"
        >
          {order.customer.name}
        </a>
        {order.customer.phone && <p className="text-sm text-zinc-500">{order.customer.phone}</p>}
        {order.customer.email && <p className="text-sm text-zinc-500">{order.customer.email}</p>}
      </Card>

      <Table>
        <THead>
          <TH>Désignation</TH>
          <TH>Quantité</TH>
          <TH>PU</TH>
          <TH>Montant</TH>
        </THead>
        <tbody>
          {order.items.map((item) => (
            <TR key={item.id}>
              <TD>
                {item.description}
                {item.product && (
                  <span className="ml-1 text-xs text-zinc-400">({item.product.reference})</span>
                )}
              </TD>
              <TD className="tabular-nums">{item.quantity}</TD>
              <TD className="tabular-nums">{formatInvoiceAmount(item.unitPrice, order.currency)}</TD>
              <TD className="tabular-nums font-medium">{formatInvoiceAmount(item.total, order.currency)}</TD>
            </TR>
          ))}
        </tbody>
      </Table>

      <div className="flex justify-end">
        <Card className="w-full max-w-xs space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Sous-total</span>
            <span className="tabular-nums">{formatInvoiceAmount(order.subtotal, order.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">TVA ({Number(order.vatRate)}%)</span>
            <span className="tabular-nums">{formatInvoiceAmount(order.vatAmount, order.currency)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-200 pt-2.5 text-base font-semibold dark:border-zinc-800">
            <span>Total</span>
            <span className="tabular-nums">{formatInvoiceAmount(order.total, order.currency)}</span>
          </div>
        </Card>
      </div>

      {order.invoice && (
        <Card className="flex items-center gap-2.5 border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <CircleCheck size={18} className="shrink-0 text-emerald-600" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            Converti en facture{" "}
            <a href={`/factures/${order.invoice.id}`} className="font-medium underline">
              {order.invoice.number}
            </a>
            .
          </p>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {isPending && <ConvertToInvoiceButton orderId={order.id} orderNumber={order.number} />}
        {isPending && (
          <DeleteOrderConfirmationButton
            orderId={order.id}
            orderNumber={order.number}
            redirectTo="/bons-de-commande"
          />
        )}
      </div>
    </div>
  );
}
