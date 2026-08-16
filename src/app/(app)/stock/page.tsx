import { Plus, History, FileDown, Archive } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { ProductTable } from "@/components/stock/ProductTable";
import { StockValueBanner } from "@/components/stock/StockValueBanner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getSettings } from "@/lib/settings";
import { toMad } from "@/lib/currency";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(q
      ? {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [products, settings, inactiveCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true },
      orderBy: { reference: "asc" },
    }),
    getSettings(),
    prisma.product.count({ where: { isActive: false } }),
  ]);

  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = products.reduce(
    (sum, p) => sum + toMad(p.quantity * Number(p.rmb), p.rmbCurrency, settings),
    0
  );

  return (
    <div>
      <PageHeader
        title="Stock"
        description={
          q
            ? `Résultats pour « ${q} »`
            : "Inventaire des pièces, quantités et valorisation."
        }
        actions={
          <>
            <Button
              href={`/stock/pdf${q ? `?q=${encodeURIComponent(q)}` : ""}`}
              target="_blank"
              variant="secondary"
              icon={<FileDown size={16} />}
            >
              Exporter PDF
            </Button>
            <Button href="/stock/mouvements" variant="secondary" icon={<History size={16} />}>
              Mouvements
            </Button>
            {inactiveCount > 0 && (
              <Button href="/stock/desactivees" variant="secondary" icon={<Archive size={16} />}>
                Désactivées ({inactiveCount})
              </Button>
            )}
            <Button href="/stock/nouveau" icon={<Plus size={16} />}>
              Ajouter une pièce
            </Button>
          </>
        }
      />

      <StockValueBanner
        productCount={products.length}
        totalQuantity={totalQuantity}
        totalValue={totalValue}
      />

      <ProductTable products={products} />
    </div>
  );
}
