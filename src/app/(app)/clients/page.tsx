import { Plus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatInvoiceAmount } from "@/lib/format";
import { DeleteCustomerButton } from "@/components/clients/DeleteCustomerButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table, THead, TH, TR, TD } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ClientsPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: { invoices: { where: { status: { not: "ANNULEE" } } } },
  });

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Historique d'achats et solde par client."
        actions={
          <Button href="/clients/nouveau" icon={<Plus size={16} />}>
            Nouveau client
          </Button>
        }
      />

      {customers.length === 0 ? (
        <EmptyState
          icon={<Users size={22} />}
          title="Aucun client"
          description="Ajoutez votre premier client pour commencer à facturer."
          action={<Button href="/clients/nouveau">Nouveau client</Button>}
        />
      ) : (
        <Table minWidth={720}>
          <THead>
            <TH>Nom</TH>
            <TH>Téléphone</TH>
            <TH>Email</TH>
            <TH>Factures</TH>
            <TH>Total acheté</TH>
            <TH>Solde</TH>
            <TH className="sticky right-0 bg-zinc-50 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)] dark:bg-zinc-900" />
          </THead>
          <tbody>
            {customers.map((c) => {
              // Invoices can be in different currencies — convert each to MAD
              // via its own snapshotted exchange rate before summing.
              const totalAchete = c.invoices.reduce(
                (sum, inv) => sum + Number(inv.total) * Number(inv.exchangeRate),
                0
              );
              const solde = c.invoices.reduce(
                (sum, inv) => sum + Number(inv.remainingAmount) * Number(inv.exchangeRate),
                0
              );
              return (
                <TR key={c.id}>
                  <TD>
                    <a
                      href={`/clients/${c.id}`}
                      className="font-medium text-zinc-900 hover:text-blue-600 hover:underline dark:text-zinc-50"
                    >
                      {c.name}
                    </a>
                  </TD>
                  <TD>{c.phone ?? "—"}</TD>
                  <TD>{c.email ?? "—"}</TD>
                  <TD className="tabular-nums">{c.invoices.length}</TD>
                  <TD className="tabular-nums font-medium">{formatInvoiceAmount(totalAchete)}</TD>
                  <TD className={`tabular-nums ${solde > 0 ? "text-red-600" : ""}`}>
                    {formatInvoiceAmount(solde)}
                  </TD>
                  <TD className="sticky right-0 bg-white shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)] dark:bg-zinc-900">
                    <div className="flex justify-end">
                      <DeleteCustomerButton customerId={c.id} customerName={c.name} size="sm" />
                    </div>
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
