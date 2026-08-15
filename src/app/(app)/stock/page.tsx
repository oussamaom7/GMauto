import { Plus, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { ProductTable } from "@/components/stock/ProductTable";
import { StockValueBanner } from "@/components/stock/StockValueBanner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

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

  const products = await prisma.product.findMany({
    where,
    include: { category: true, brand: true },
    orderBy: { reference: "asc" },
  });

  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = products.reduce(
    (sum, p) => sum + p.quantity * Number(p.rmb),
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
            <Button href="/stock/mouvements" variant="secondary" icon={<History size={16} />}>
              Mouvements
            </Button>
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
