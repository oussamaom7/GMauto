import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DeactivatedProductTable } from "@/components/stock/DeactivatedProductTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default async function DeactivatedProductsPage() {
  const products = await prisma.product.findMany({
    where: { isActive: false },
    include: { category: true, brand: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Pièces désactivées"
        description="Pièces retirées du Stock. Réactivez-les pour qu'elles réapparaissent dans l'inventaire."
        actions={
          <Button href="/stock" variant="secondary" icon={<ArrowLeft size={16} />}>
            Retour au stock
          </Button>
        }
      />

      <DeactivatedProductTable products={products} />
    </div>
  );
}
