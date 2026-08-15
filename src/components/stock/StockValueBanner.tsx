import { Package, Layers, Wallet } from "lucide-react";
import { KpiCard } from "@/components/ui/KpiCard";
import { formatCurrency } from "@/lib/format";

export function StockValueBanner({
  productCount,
  totalQuantity,
  totalValue,
}: {
  productCount: number;
  totalQuantity: number;
  totalValue: number;
}) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard label="Produits" value={productCount} icon={<Package size={18} />} tone="blue" />
      <KpiCard
        label="Quantité totale"
        value={totalQuantity}
        icon={<Layers size={18} />}
        tone="default"
      />
      <KpiCard
        label="Valeur du stock"
        value={formatCurrency(totalValue)}
        icon={<Wallet size={18} />}
        tone="emerald"
      />
    </div>
  );
}
