"use client";

import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/actions/products";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteProduct.bind(null, id)}
      onSubmit={(e) => {
        if (
          !confirm(
            `Supprimer définitivement "${name}" ? Cette action est irréversible et effacera aussi son historique de mouvements de stock.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
      >
        <Trash2 size={13} />
        Supprimer
      </button>
    </form>
  );
}
