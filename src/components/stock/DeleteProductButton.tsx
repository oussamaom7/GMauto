"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/actions/products";
import { useToast } from "@/components/ui/ToastProvider";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [isPending, setIsPending] = useState(false);
  const { showToast } = useToast();

  async function handleClick() {
    if (
      !confirm(
        `Supprimer définitivement "${name}" ? Cette action est irréversible et effacera aussi son historique de mouvements de stock.`
      )
    ) {
      return;
    }

    setIsPending(true);
    try {
      await deleteProduct(id);
      showToast(`"${name}" a été supprimé définitivement.`, "success");
    } catch {
      showToast("Échec de la suppression.", "error");
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      <Trash2 size={13} />
      {isPending ? "Suppression..." : "Supprimer"}
    </button>
  );
}
