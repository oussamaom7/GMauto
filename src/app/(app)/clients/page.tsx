import { Plus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatInvoiceAmount } from "@/lib/format";
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
          </THead>
          <tbody>
            {customers.map((c) => {
              const totalAchete = c.invoices.reduce(
                (sum, inv) => sum + Number(inv.total),
                0
              );
              const solde = c.invoices.reduce(
                (sum, inv) => sum + Number(inv.remainingAmount),
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
                </TR>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
