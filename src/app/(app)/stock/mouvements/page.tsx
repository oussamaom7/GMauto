import { ArrowLeft, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table, THead, TH, TR, TD } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

const TYPE_COLOR = {
  ENTREE: "green",
  SORTIE: "red",
  AJUSTEMENT: "orange",
} as const;

export default async function MouvementsPage() {
  const movements = await prisma.stockMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { product: true, user: true },
  });

  return (
    <div>
      <PageHeader
        title="Historique des mouvements"
        description="Journal de tous les mouvements de stock (ventes, entrées, ajustements)."
        actions={
          <Button href="/stock" variant="secondary" icon={<ArrowLeft size={16} />}>
            Retour au stock
          </Button>
        }
      />

      {movements.length === 0 ? (
        <EmptyState
          icon={<History size={22} />}
          title="Aucun mouvement de stock enregistré"
        />
      ) : (
        <Table minWidth={780}>
          <THead>
            <TH>Date</TH>
            <TH>Type</TH>
            <TH>Pièce</TH>
            <TH>Quantité</TH>
            <TH>Référence / Motif</TH>
            <TH>Utilisateur</TH>
          </THead>
          <tbody>
            {movements.map((m) => (
              <TR key={m.id}>
                <TD>{formatDate(m.createdAt)}</TD>
                <TD>
                  <Badge color={TYPE_COLOR[m.type]}>{m.type}</Badge>
                </TD>
                <TD>
                  <a href={`/stock/${m.productId}`} className="hover:text-blue-600 hover:underline">
                    {m.product.name}
                  </a>
                </TD>
                <TD className={`tabular-nums font-medium ${m.quantity > 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                </TD>
                <TD>{m.reference ?? m.note ?? "—"}</TD>
                <TD>{m.user?.name ?? "—"}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
