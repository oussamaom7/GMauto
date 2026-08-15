"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  Settings,
  LogOut,
  Car,
  History,
  ChevronDown,
} from "lucide-react";
import { logout } from "@/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/stock/mouvements", label: "Mouvements", icon: History },
  { href: "/factures", label: "Factures", icon: Receipt },
  { href: "/clients", label: "Clients", icon: Users },
];

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const initial = userName.charAt(0).toUpperCase();

  return (
    <aside className="flex h-full w-64 flex-col bg-[#0b1220] text-zinc-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
          <Car size={20} strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-white">VHU MAROC</p>
          <p className="text-[11px] text-zinc-500">Gestion de stock</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/stock"
              ? pathname === "/stock" || (pathname.startsWith("/stock/") && !pathname.startsWith("/stock/mouvements"))
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              }`}
            >
              <Icon size={17} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-white/10 px-3 py-3">
        <Link
          href="/parametres"
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname.startsWith("/parametres")
              ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
          }`}
        >
          <Settings size={17} strokeWidth={2} />
          Paramètres
        </Link>
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="group relative">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-100">{userName}</p>
              <p className="text-xs text-zinc-500">Administrateur</p>
            </div>
            <ChevronDown size={14} className="text-zinc-500" />
          </div>
          <form
            action={logout}
            className="invisible absolute inset-x-0 bottom-full mb-1 rounded-lg border border-white/10 bg-[#131c2e] p-1 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
          >
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              <LogOut size={15} />
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
