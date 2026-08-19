"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { PRODUCT_SIDE_LABELS, type ProductSideCode } from "@/lib/productSide";

type ProductOption = {
  id: string;
  reference: string;
  name: string;
  side: ProductSideCode | null;
};

function productLabel(p: ProductOption) {
  return `${p.reference} · ${p.name}${p.side ? ` (${PRODUCT_SIDE_LABELS[p.side]})` : ""}`;
}

export function ProductCombobox({
  products,
  value,
  onSelect,
}: {
  products: ProductOption[];
  value: string | null;
  onSelect: (productId: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = products.find((p) => p.id === value) ?? null;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = (
    q
      ? products.filter((p) => p.name.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q))
      : products
  ).slice(0, 30);

  function selectProduct(p: ProductOption | null) {
    onSelect(p ? p.id : null);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={open ? query : selected ? productLabel(selected) : ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered.length > 0) selectProduct(filtered[0]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="— Ligne libre — ou rechercher un produit"
          className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-7 pr-7 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {selected && !open && (
          <button
            type="button"
            onClick={() => selectProduct(null)}
            title="Retirer le produit"
            aria-label="Retirer le produit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => selectProduct(null)}
            className="block w-full px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            — Ligne libre —
          </button>
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-zinc-400">Aucun produit trouvé.</p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProduct(p)}
                className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {productLabel(p)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
