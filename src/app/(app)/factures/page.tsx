import { Plus, Receipt } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FacturesTable } from "@/components/invoices/FacturesTable";

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
        <FacturesTable invoices={invoices} />
      )}
    </div>
  );
}
