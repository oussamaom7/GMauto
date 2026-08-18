import { notFound } from "next/navigation";
import { ArrowLeft, Wallet, Receipt, Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { updateCustomer } from "@/actions/customers";
import { CustomerForm } from "@/components/clients/CustomerForm";
import { StatusBadge } from "@/components/invoices/StatusBadge";
import { formatDate, formatInvoiceAmount } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { Table, THead, TH, TR, TD } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { invoices: { orderBy: { date: "desc" } } },
  });

  if (!customer) {
    notFound();
  }

  const activeInvoices = customer.invoices.filter((inv) => inv.status !== "ANNULEE");
  // Invoices can be in different currencies — convert each to MAD via its
  // own snapshotted exchange rate before summing.
  const totalAchete = activeInvoices.reduce(
    (sum, inv) => sum + Number(inv.total) * Number(inv.exchangeRate),
    0
  );
  const solde = activeInvoices.reduce(
    (sum, inv) => sum + Number(inv.remainingAmount) * Number(inv.exchangeRate),
    0
  );

  const boundUpdateCustomer = updateCustomer.bind(null, id);

  return (
    <div className="space-y-8">
      <PageHeader
        title={customer.name}
        actions={
          <Button href="/clients" variant="secondary" icon={<ArrowLeft size={16} />}>
            Retour aux clients
          </Button>
        }
      />

      <CustomerForm
        action={boundUpdateCustomer}
        initialValues={{
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:max-w-2xl">
        <KpiCard label="Factures" value={activeInvoices.length} icon={<Receipt size={18} />} tone="blue" />
        <KpiCard
          label="Total acheté"
          value={formatInvoiceAmount(totalAchete)}
          icon={<Wallet size={18} />}
          tone="emerald"
        />
        <KpiCard
          label="Solde"
          value={formatInvoiceAmount(solde)}
          icon={<Wallet size={18} />}
          tone={solde > 0 ? "red" : "default"}
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Factures</h2>
        {customer.invoices.length === 0 ? (
          <EmptyState title="Aucune facture pour ce client." />
        ) : (
          <Table>
            <THead>
              <TH>N°</TH>
              <TH>Date</TH>
              <TH>Total</TH>
              <TH>Statut</TH>
              <TH className="sticky right-0 bg-zinc-50 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)] dark:bg-zinc-900" />
            </THead>
            <tbody>
              {customer.invoices.map((inv) => (
                <TR key={inv.id}>
                  <TD className="font-medium text-zinc-900 dark:text-zinc-50">{inv.number}</TD>
                  <TD>{formatDate(inv.date)}</TD>
                  <TD className="tabular-nums">{formatInvoiceAmount(inv.total, inv.currency)}</TD>
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
    </div>
  );
}
