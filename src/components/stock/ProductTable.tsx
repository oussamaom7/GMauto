import { Package, ImageOff, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import type { CurrencyCode } from "@/lib/currency";
import { PRODUCT_SIDE_LABELS, type ProductSideCode } from "@/lib/productSide";
import { deactivateProduct } from "@/actions/products";

type ProductRow = {
  id: string;
  reference: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  rmb: unknown;
  rmbCurrency: CurrencyCode;
  minimumStock: number;
  side: ProductSideCode | null;
  category: { name: string } | null;
  brand: { name: string } | null;
};

function stockBadge(quantity: number, minimumStock: number) {
  if (quantity <= 0) return <Badge color="red" dot>Rupture</Badge>;
  if (quantity <= minimumStock) return <Badge color="orange" dot>Stock faible</Badge>;
  return <Badge color="green" dot>En stock</Badge>;
}

export function ProductTable({ products }: { products: ProductRow[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Package size={22} />}
        title="Aucune pièce en stock"
        description="Ajoutez votre première pièce pour commencer à suivre votre inventaire."
        action={<Button href="/stock/nouveau">Ajouter une pièce</Button>}
      />
    );
  }

  return (
    <Table>
      <THead>
        <TH className="hidden sm:table-cell">Photo</TH>
        <TH>Référence / Pièce</TH>
        <TH>Quantité</TH>
        <TH className="hidden sm:table-cell">Prix unitaire</TH>
        <TH>Total</TH>
        <TH>Stock</TH>
        <TH className="sticky right-0 bg-zinc-50 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)] dark:bg-zinc-900" />
      </THead>
      <tbody>
        {products.map((product) => (
          <TR key={product.id}>
            <TD className="hidden sm:table-cell">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveMediaUrl(product.imageUrl) ?? undefined}
                  alt={product.name}
                  className="h-11 w-11 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100 text-zinc-300 dark:bg-zinc-800 dark:text-zinc-600">
                  <ImageOff size={16} />
                </div>
              )}
            </TD>
            <TD>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {product.name}
                {product.side && (
                  <span className="ml-1.5 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {PRODUCT_SIDE_LABELS[product.side]}
                  </span>
                )}
              </p>
              <p className="text-xs text-zinc-500">
                {product.reference}
                {product.category ? ` · ${product.category.name}` : ""}
                {product.brand ? ` · ${product.brand.name}` : ""}
              </p>
            </TD>
            <TD className="tabular-nums">{product.quantity}</TD>
            <TD className="hidden tabular-nums sm:table-cell">
              {formatCurrency(product.rmb, product.rmbCurrency)}
            </TD>
            <TD className="tabular-nums font-medium">
              {formatCurrency(Number(product.rmb) * product.quantity, product.rmbCurrency)}
            </TD>
            <TD>{stockBadge(product.quantity, product.minimumStock)}</TD>
            <TD className="sticky right-0 bg-white shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)] dark:bg-zinc-900">
              <div className="flex justify-end gap-1.5">
                <a
                  href={`/stock/${product.id}`}
                  title="Modifier"
                  aria-label="Modifier"
                  className="rounded-lg border border-zinc-200 bg-white p-3 text-zinc-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-blue-950/30"
                >
                  <Pencil size={16} />
                </a>
                <form action={deactivateProduct.bind(null, product.id)}>
                  <button
                    type="submit"
                    title="Désactiver"
                    aria-label="Désactiver"
                    className="rounded-lg border border-zinc-200 bg-white p-3 text-zinc-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-red-950/30"
                  >
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            </TD>
          </TR>
        ))}
      </tbody>
    </Table>
  );
}
