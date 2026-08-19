import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/actions/products";
import { ProductForm } from "@/components/stock/ProductForm";
import { AdjustStockForm } from "@/components/stock/AdjustStockForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Table, THead, TH, TR, TD } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";
import { PRODUCT_SIDE_LABELS } from "@/lib/productSide";

export default async function ModifierProduitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories, brands, movements] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { category: true, brand: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.stockMovement.findMany({
      where: { productId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  if (!product) {
    notFound();
  }

  const boundUpdateProduct = updateProduct.bind(null, id);

  return (
    <div className="space-y-8">
      <PageHeader
        title={product.name}
        description={
          product.side
            ? `Prix unitaire : ${formatCurrency(product.rmb, product.rmbCurrency)} · Côté : ${PRODUCT_SIDE_LABELS[product.side]}`
            : `Prix unitaire : ${formatCurrency(product.rmb, product.rmbCurrency)}`
        }
        actions={
          <Button href="/stock" variant="secondary" icon={<ArrowLeft size={16} />}>
            Retour au stock
          </Button>
        }
      />

      <ProductForm
        action={boundUpdateProduct}
        mode="edit"
        initialValues={{
          reference: product.reference,
          name: product.name,
          quantity: product.quantity,
          rmb: Number(product.rmb),
          rmbCurrency: product.rmbCurrency,
          sellingPrice: product.sellingPrice ? Number(product.sellingPrice) : null,
          minimumStock: product.minimumStock,
          location: product.location ?? "",
          side: product.side,
          category: product.category?.name ?? "",
          brand: product.brand?.name ?? "",
          imageUrl: product.imageUrl,
        }}
        categoryOptions={categories.map((c) => c.name)}
        brandOptions={brands.map((b) => b.name)}
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Ajuster le stock
        </h2>
        <AdjustStockForm productId={product.id} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Derniers mouvements
        </h2>
        {movements.length === 0 ? (
          <EmptyState title="Aucun mouvement pour cette pièce." />
        ) : (
          <Table>
            <THead>
              <TH>Date</TH>
              <TH>Type</TH>
              <TH>Quantité</TH>
              <TH>Référence / Motif</TH>
            </THead>
            <tbody>
              {movements.map((m) => (
                <TR key={m.id}>
                  <TD>{formatDate(m.createdAt)}</TD>
                  <TD>{m.type}</TD>
                  <TD className={`tabular-nums font-medium ${m.quantity > 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </TD>
                  <TD>{m.reference ?? m.note ?? "—"}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
