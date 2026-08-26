"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Plus, Loader2 } from "lucide-react";
import { PRODUCT_SIDES, PRODUCT_SIDE_LABELS, type ProductSideCode } from "@/lib/productSide";
import type { CurrencyCode } from "@/lib/currency";
import { quickCreateProduct } from "@/actions/products";

export type ProductOption = {
  id: string;
  reference: string;
  name: string;
  sellingPrice: number | null;
  rmb: number;
  rmbCurrency: CurrencyCode;
  quantity: number;
  side: ProductSideCode | null;
};

function productLabel(p: ProductOption) {
  return `${p.reference} · ${p.name}${p.side ? ` (${PRODUCT_SIDE_LABELS[p.side]})` : ""}`;
}

export function ProductCombobox({
  products,
  value,
  onSelect,
  onProductCreated,
}: {
  products: ProductOption[];
  value: string | null;
  onSelect: (productId: string | null) => void;
  onProductCreated: (product: ProductOption) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRef, setNewRef] = useState("");
  const [newName, setNewName] = useState("");
  const [newSide, setNewSide] = useState<ProductSideCode | "">("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = products.find((p) => p.id === value) ?? null;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
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

  function startCreating() {
    setCreateError(null);
    setNewRef(query.trim());
    setNewName("");
    setNewSide("");
    setCreating(true);
  }

  async function handleCreate() {
    if (!newRef.trim()) {
      setCreateError("Référence requise");
      return;
    }
    setSaving(true);
    setCreateError(null);
    const fd = new FormData();
    fd.set("reference", newRef.trim());
    fd.set("name", newName.trim());
    if (newSide) fd.set("side", newSide);

    const result = await quickCreateProduct(fd);
    setSaving(false);
    if ("error" in result) {
      setCreateError(result.error);
      return;
    }
    // onProductCreated is responsible for both adding this product to the
    // shared list AND selecting/prefilling this row — doing it from the
    // freshly-returned object here, rather than round-tripping through
    // onSelect(id) + a `products.find(id)` lookup in the parent, sidesteps
    // React state batching: that lookup would run against the parent's
    // pre-update `products` closure and silently miss the brand new product.
    onProductCreated(result.product);
    setCreating(false);
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
            setCreating(false);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
            setCreating(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered.length > 0) selectProduct(filtered[0]);
            } else if (e.key === "Escape") {
              setOpen(false);
              setCreating(false);
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
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {creating ? (
            <div className="space-y-2 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Nouveau produit
              </p>
              <input
                type="text"
                autoFocus
                value={newRef}
                onChange={(e) => setNewRef(e.target.value)}
                placeholder="Référence *"
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Désignation (optionnel)"
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <select
                value={newSide}
                onChange={(e) => setNewSide(e.target.value as ProductSideCode | "")}
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Côté (aucun)</option>
                {PRODUCT_SIDES.map((s) => (
                  <option key={s} value={s}>
                    {PRODUCT_SIDE_LABELS[s]}
                  </option>
                ))}
              </select>
              {createError && <p className="text-xs text-red-600">{createError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {saving ? "Création..." : "Créer et sélectionner"}
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <>
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
              <button
                type="button"
                onClick={startCreating}
                className="flex w-full items-center gap-1.5 border-t border-zinc-100 px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 dark:border-zinc-800 dark:hover:bg-blue-950/30"
              >
                <Plus size={14} />
                {query.trim() ? `Créer "${query.trim()}" comme nouveau produit` : "Créer un nouveau produit"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
