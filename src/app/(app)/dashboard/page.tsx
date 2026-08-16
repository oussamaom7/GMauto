import { Package, Wallet, Layers, AlertTriangle, PackageX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatCurrency, formatDate, formatInvoiceAmount } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card } from "@/components/ui/Card";
import { Table, THead, TH, TR, TD } from "@/components/ui/Table";
import { StatusBadge } from "@/components/invoices/StatusBadge";
import { StockAlerts } from "@/components/dashboard/StockAlerts";
import { CategoryDonutChart } from "@/components/dashboard/CategoryDonutChart";
import { getSettings } from "@/lib/settings";
import { toMad } from "@/lib/currency";

export default async function DashboardPage() {
  const session = await auth();

  const [products, recentInvoices, recentMovements, settings] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: { category: true, brand: true },
    }),
    prisma.invoice.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: { customer: true },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { product: true },
    }),
    getSettings(),
  ]);

  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = products.reduce(
    (sum, p) => sum + toMad(p.quantity * Number(p.rmb), p.rmbCurrency, settings),
    0
  );
  const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= p.minimumStock);
  const outOfStock = products.filter((p) => p.quantity <= 0);
  const alerts = [...outOfStock, ...lowStock].slice(0, 6);

  const categoryMap = new Map<string, number>();
  for (const p of products) {
    const label = p.category?.name ?? "Sans catégorie";
    categoryMap.set(label, (categoryMap.get(label) ?? 0) + 1);
  }
  const categorySegments = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Bienvenue, ${session?.user?.name ?? "Admin"} 👋`}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Produits" value={products.length} icon={<Package size={18} />} tone="blue" />
        <KpiCard label="Quantité totale" value={totalQuantity} icon={<Layers size={18} />} />
        <KpiCard
          label="Valeur du stock"
          value={formatCurrency(totalValue)}
          icon={<Wallet size={18} />}
          tone="emerald"
        />
        <KpiCard
          label="Stock faible"
          value={lowStock.length}
          icon={<AlertTriangle size={18} />}
          tone="amber"
        />
        <KpiCard label="Ruptures" value={outOfStock.length} icon={<PackageX size={18} />} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Dernières factures
            </h2>
            {recentInvoices.length === 0 ? (
              <Card>
                <p className="text-sm text-zinc-500">Aucune facture pour le moment.</p>
              </Card>
            ) : (
              <Table>
                <THead>
                  <TH>N°</TH>
                  <TH>Client</TH>
                  <TH>Date</TH>
                  <TH>Total</TH>
                  <TH>Statut</TH>
                </THead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <TR key={inv.id}>
                      <TD>
                        <a href={`/factures/${inv.id}`} className="font-medium hover:text-blue-600 hover:underline">
                          {inv.number}
                        </a>
                      </TD>
                      <TD>{inv.customer.name}</TD>
                      <TD>{formatDate(inv.date)}</TD>
                      <TD className="tabular-nums">{formatInvoiceAmount(inv.total, inv.currency)}</TD>
                      <TD>
                        <StatusBadge status={inv.status} />
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Derniers mouvements
            </h2>
            {recentMovements.length === 0 ? (
              <Card>
                <p className="text-sm text-zinc-500">Aucun mouvement pour le moment.</p>
              </Card>
            ) : (
              <Table>
                <THead>
                  <TH>Date</TH>
                  <TH>Pièce</TH>
                  <TH>Type</TH>
                  <TH>Quantité</TH>
                </THead>
                <tbody>
                  {recentMovements.map((m) => (
                    <TR key={m.id}>
                      <TD>{formatDate(m.createdAt)}</TD>
                      <TD>
                        <a href={`/stock/${m.productId}`} className="hover:text-blue-600 hover:underline">
                          {m.product.name}
                        </a>
                      </TD>
                      <TD>{m.type}</TD>
                      <TD className={`tabular-nums font-medium ${m.quantity > 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Alertes de stock
            </h2>
            <StockAlerts
              products={alerts.map((p) => ({
                id: p.id,
                reference: p.reference,
                name: p.name,
                quantity: p.quantity,
                brand: p.brand,
              }))}
            />
          </Card>

          <Card>
            <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Répartition des produits
            </h2>
            <CategoryDonutChart segments={categorySegments} />
          </Card>
        </div>
      </div>
    </div>
  );
}
