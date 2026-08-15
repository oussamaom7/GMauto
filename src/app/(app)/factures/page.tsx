import { Plus, Receipt } from "lucide-react";
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
          </THead>
          <tbody>
            {invoices.map((inv) => (
              <TR key={inv.id}>
                <TD>
                  <a
                    href={`/factures/${inv.id}`}
                    className="font-medium text-zinc-900 hover:text-blue-600 hover:underline dark:text-zinc-50"
                  >
                    {inv.number}
                  </a>
                </TD>
                <TD>{inv.customer.name}</TD>
                <TD>{formatDate(inv.date)}</TD>
                <TD className="tabular-nums font-medium">{formatInvoiceAmount(inv.total)}</TD>
                <TD className="tabular-nums">{formatInvoiceAmount(inv.remainingAmount)}</TD>
                <TD>
                  <StatusBadge status={inv.status} />
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
