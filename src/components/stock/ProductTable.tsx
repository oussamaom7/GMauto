import { Package, ImageOff, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import type { CurrencyCode } from "@/lib/currency";
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
        <TH />
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
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{product.name}</p>
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
            <TD>
              <div className="flex justify-end gap-1">
                <a
                  href={`/stock/${product.id}`}
                  title="Modifier"
                  aria-label="Modifier"
                  className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <Pencil size={16} />
                </a>
                <form action={deactivateProduct.bind(null, product.id)}>
                  <button
                    type="submit"
                    title="Désactiver"
                    aria-label="Désactiver"
                    className="rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40"
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
