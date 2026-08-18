import { Plus, Receipt, Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/invoices/StatusBadge";
import { formatDate, formatInvoiceAmount } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table, THead, TH, TR, TD } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function FacturesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { date: "desc" },
    include: { customer: true },
  });

  return (
    <div>
      <PageHeader
        title="Factures"
        description="Historique des factures émises et leur statut de paiement."
        actions={
          <Button href="/factures/nouveau" icon={<Plus size={16} />}>
            Nouvelle facture
          </Button>
        }
      />

      {invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt size={22} />}
          title="Aucune facture"
          description="Créez votre première facture pour un client."
          action={<Button href="/factures/nouveau">Nouvelle facture</Button>}
        />
      ) : (
        <Table minWidth={680}>
          <THead>
            <TH>N°</TH>
            <TH>Client</TH>
            <TH>Date</TH>
            <TH>Total</TH>
            <TH>Solde</TH>
            <TH>Statut</TH>
            <TH className="sticky right-0 bg-zinc-50 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)] dark:bg-zinc-900" />
          </THead>
          <tbody>
            {invoices.map((inv) => (
              <TR key={inv.id}>
                <TD className="font-medium text-zinc-900 dark:text-zinc-50">{inv.number}</TD>
                <TD>{inv.customer.name}</TD>
                <TD>{formatDate(inv.date)}</TD>
                <TD className="tabular-nums font-medium">{formatInvoiceAmount(inv.total, inv.currency)}</TD>
                <TD className="tabular-nums">{formatInvoiceAmount(inv.remainingAmount, inv.currency)}</TD>
                <TD>
                  <StatusBadge status={inv.status} />
                </TD>
                <TD className="sticky right-0 bg-white shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)] dark:bg-zinc-900">
                  <Button href={`/factures/${inv.id}`} variant="secondary" size="sm" icon={<Eye size={14} />}>
                    Voir
                  </Button>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
