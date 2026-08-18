import { Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { MobileMenuButton } from "@/components/layout/MobileMenuButton";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { NotificationBell } from "@/components/layout/NotificationBell";

export async function Topbar() {
  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, reference: true, name: true, quantity: true, minimumStock: true },
    }),
    getSettings(),
  ]);
  const alerts = products
    .filter((p) => p.quantity <= p.minimumStock)
    .sort((a, b) => a.quantity - b.quantity);

  return (
    <header className="flex h-16 items-center gap-2 border-b border-zinc-200 bg-white/80 px-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 sm:gap-4 sm:px-6">
      <MobileMenuButton />

      <HeaderSearch />

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <NotificationBell alerts={alerts} />

        <div className="hidden items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300 sm:flex">
          <Building2 size={15} className="text-zinc-400" />
          {settings.companyName}
        </div>
      </div>
    </header>
  );
}
