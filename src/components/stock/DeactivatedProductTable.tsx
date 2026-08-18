import { ArchiveRestore, ImageOff } from "lucide-react";
import { Table, THead, TH, TR, TD } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import type { CurrencyCode } from "@/lib/currency";
import { reactivateProduct } from "@/actions/products";

type ProductRow = {
  id: string;
  reference: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  rmb: unknown;
  rmbCurrency: CurrencyCode;
  category: { name: string } | null;
  brand: { name: string } | null;
};

export function DeactivatedProductTable({ products }: { products: ProductRow[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<ArchiveRestore size={22} />}
        title="Aucune pièce désactivée"
        description="Les pièces désactivées depuis le Stock apparaîtront ici."
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
                  className="h-11 w-11 rounded-lg object-cover opacity-60 ring-1 ring-zinc-200 dark:ring-zinc-800"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100 text-zinc-300 dark:bg-zinc-800 dark:text-zinc-600">
                  <ImageOff size={16} />
                </div>
              )}
            </TD>
            <TD>
              <p className="font-medium text-zinc-500 dark:text-zinc-400">{product.name}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {product.reference}
                {product.category ? ` · ${product.category.name}` : ""}
                {product.brand ? ` · ${product.brand.name}` : ""}
              </p>
            </TD>
            <TD className="tabular-nums text-zinc-500">{product.quantity}</TD>
            <TD className="hidden tabular-nums text-zinc-500 sm:table-cell">
              {formatCurrency(product.rmb, product.rmbCurrency)}
            </TD>
            <TD>
              <div className="flex justify-end">
                <form action={reactivateProduct.bind(null, product.id)}>
                  <button
                    type="submit"
                    className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                  >
                    <ArchiveRestore size={13} />
                    Réactiver
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
