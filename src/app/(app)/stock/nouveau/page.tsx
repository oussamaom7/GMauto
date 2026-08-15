import { prisma } from "@/lib/prisma";
import { createProduct } from "@/actions/products";
import { ProductForm } from "@/components/stock/ProductForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function NouveauProduitPage() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Ajouter une pièce" description="Renseignez les informations de la pièce à ajouter au stock." />
      <ProductForm
        action={createProduct}
        mode="create"
        categoryOptions={categories.map((c) => c.name)}
        brandOptions={brands.map((b) => b.name)}
      />
    </div>
  );
}
