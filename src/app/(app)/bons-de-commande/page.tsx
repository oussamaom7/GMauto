import { Plus, ClipboardList, Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { OrderStatusBadge } from "@/components/orderConfirmations/OrderStatusBadge";
import { DeleteOrderConfirmationButton } from "@/components/orderConfirmations/DeleteOrderConfirmationButton";
import { formatDate, formatInvoiceAmount } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table, THead, TH, TR, TD } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function BonsDeCommandePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where: Prisma.OrderConfirmationWhereInput = q
    ? {
        OR: [
          { number: { contains: q, mode: "insensitive" } },
          { reference: { contains: q, mode: "insensitive" } },
          { customer: { name: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const orders = await prisma.orderConfirmation.findMany({
    where,
    orderBy: { date: "desc" },
    include: { customer: true },
  });

  return (
    <div>
      <PageHeader
        title="Bons de commande"
        description={
          q
            ? `Résultats pour « ${q} »`
            : "Confirmations de commande client, convertibles en facture."
        }
        actions={
          <Button href="/bons-de-commande/nouveau" icon={<Plus size={16} />}>
            Nouveau bon de commande
          </Button>
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={22} />}
          title={q ? "Aucun résultat" : "Aucun bon de commande"}
          description={
            q
              ? "Essayez une autre référence, un autre numéro ou un autre nom de client."
              : "Créez un bon de commande pour confirmer une commande avant de la facturer."
          }
          action={!q ? <Button href="/bons-de-commande/nouveau">Nouveau bon de commande</Button> : undefined}
        />
      ) : (
        <Table minWidth={680}>
          <THead>
            <TH>N°</TH>
            <TH>Client</TH>
            <TH>Date</TH>
            <TH>Total</TH>
            <TH>Statut</TH>
            <TH className="sticky right-0 bg-zinc-50 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)] dark:bg-zinc-900" />
          </THead>
          <tbody>
            {orders.map((o) => (
              <TR key={o.id}>
                <TD className="font-medium text-zinc-900 dark:text-zinc-50">{o.number}</TD>
                <TD>{o.customer.name}</TD>
                <TD>{formatDate(o.date)}</TD>
                <TD className="tabular-nums font-medium">{formatInvoiceAmount(o.total, o.currency)}</TD>
                <TD>
                  <OrderStatusBadge status={o.status} />
                </TD>
                <TD className="sticky right-0 bg-white shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)] dark:bg-zinc-900">
                  <div className="flex justify-end gap-1.5">
                    <Button href={`/bons-de-commande/${o.id}`} variant="secondary" size="sm" icon={<Eye size={14} />}>
                      Voir
                    </Button>
                    {o.status !== "CONVERTIE" && (
                      <DeleteOrderConfirmationButton orderId={o.id} orderNumber={o.number} size="sm" />
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
