import Link from "next/link";
import { PackageX } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type AlertProduct = {
  id: string;
  reference: string;
  name: string;
  quantity: number;
  brand: { name: string } | null;
};

export function StockAlerts({ products }: { products: AlertProduct[] }) {
  if (products.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Aucune alerte de stock — tout va bien.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {products.map((p) => (
        <li key={p.id}>
          <Link
            href={`/stock/${p.id}`}
            className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-500/10">
              <PackageX size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {p.name}
              </p>
              <p className="truncate text-xs text-zinc-500">
                {p.brand?.name ?? "—"} ({p.reference})
              </p>
            </div>
            <Badge color={p.quantity <= 0 ? "red" : "orange"}>
              {p.quantity} unité{p.quantity > 1 ? "s" : ""}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
