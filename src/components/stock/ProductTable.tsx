import { Package, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { deactivateProduct } from "@/actions/products";

type ProductRow = {
  id: string;
  reference: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  rmb: unknown;
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
    <Table minWidth={780}>
      <THead>
        <TH>Photo</TH>
        <TH>Référence / Pièce</TH>
        <TH>Quantité</TH>
        <TH>RMB</TH>
        <TH>Total</TH>
        <TH>Stock</TH>
        <TH />
      </THead>
      <tbody>
        {products.map((product) => (
          <TR key={product.id}>
            <TD>
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
            <TD className="tabular-nums">{formatCurrency(product.rmb)}</TD>
            <TD className="tabular-nums font-medium">
              {formatCurrency(Number(product.rmb) * product.quantity)}
            </TD>
            <TD>{stockBadge(product.quantity, product.minimumStock)}</TD>
            <TD>
              <div className="flex justify-end gap-4">
                <a
                  href={`/stock/${product.id}`}
                  className="text-xs font-medium text-zinc-600 hover:text-blue-600 hover:underline dark:text-zinc-300"
                >
                  Modifier
                </a>
                <form action={deactivateProduct.bind(null, product.id)}>
                  <button
                    type="submit"
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Désactiver
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
