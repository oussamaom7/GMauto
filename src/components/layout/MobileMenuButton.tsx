"use client";

import { Menu } from "lucide-react";
import { useMobileNav } from "@/components/layout/MobileNavProvider";

export function MobileMenuButton() {
  const { toggle } = useMobileNav();

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 lg:hidden"
      aria-label="Ouvrir le menu"
    >
      <Menu size={20} />
    </button>
  );
}
