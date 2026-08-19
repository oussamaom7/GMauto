"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

const SEARCHABLE_SECTIONS = [
  { prefix: "/stock", action: "/stock", placeholder: "Rechercher une référence..." },
  {
    prefix: "/bons-de-commande",
    action: "/bons-de-commande",
    placeholder: "Rechercher un bon de commande...",
  },
];

export function HeaderSearch() {
  const pathname = usePathname();
  const section = SEARCHABLE_SECTIONS.find((s) => pathname.startsWith(s.prefix));
  if (!section) {
    return null;
  }

  return (
    <form
      key={section.action}
      action={section.action}
      method="GET"
      className="relative min-w-0 flex-1 sm:max-w-md"
    >
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
      />
      <input
        type="text"
        name="q"
        placeholder={section.placeholder}
        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:bg-zinc-900"
      />
    </form>
  );
}
