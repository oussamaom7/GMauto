import Link from "next/link";
import { Search, Bell, Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { MobileMenuButton } from "@/components/layout/MobileMenuButton";

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

      <form action="/stock" method="GET" className="relative min-w-0 flex-1 sm:max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="text"
          name="q"
          placeholder="Rechercher une référence..."
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:bg-zinc-900"
        />
      </form>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
