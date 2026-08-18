import Link from "next/link";
import { Bell, Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { MobileMenuButton } from "@/components/layout/MobileMenuButton";
import { HeaderSearch } from "@/components/layout/HeaderSearch";

export async function Topbar() {
  const [lowStockProducts, settings] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { quantity: true, minimumStock: true },
    }),
    getSettings(),
  ]);
  const alertCount = lowStockProducts.filter((p) => p.quantity <= p.minimumStock).length;

  return (
    <header className="flex h-16 items-center gap-2 border-b border-zinc-200 bg-white/80 px-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 sm:gap-4 sm:px-6">
      <MobileMenuButton />

      <HeaderSearch />

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          href="/stock"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          title={`${alertCount} pièce(s) en stock faible ou en rupture`}
        >
          <Bell size={18} />
          {alertCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {alertCount}
            </span>
          )}
        </Link>

        <div className="hidden items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300 sm:flex">
          <Building2 size={15} className="text-zinc-400" />
          {settings.companyName}
        </div>
      </div>
    </header>
  );
}
