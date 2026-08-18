"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteInvoice } from "@/actions/invoices";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";

export function DeleteInvoiceButton({
  invoiceId,
  invoiceNumber,
  redirectTo,
  size = "md",
}: {
  invoiceId: string;
  invoiceNumber: string;
  redirectTo?: string;
  size?: "sm" | "md";
}) {
  const [isPending, setIsPending] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  async function handleClick() {
    if (
      !confirm(
        `Supprimer définitivement la facture ${invoiceNumber} ? Cette action est irréversible et restockera les pièces liées si la facture n'était pas déjà annulée.`
      )
    ) {
      return;
    }

    setIsPending(true);
    try {
      await deleteInvoice(invoiceId);
      showToast(`Facture ${invoiceNumber} supprimée.`, "success");
      if (redirectTo) router.push(redirectTo);
    } catch {
      showToast("Échec de la suppression.", "error");
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="danger"
      size={size}
      onClick={handleClick}
      disabled={isPending}
      icon={<Trash2 size={size === "sm" ? 14 : 15} />}
    >
      {isPending ? "Suppression..." : "Supprimer"}
    </Button>
  );
}
