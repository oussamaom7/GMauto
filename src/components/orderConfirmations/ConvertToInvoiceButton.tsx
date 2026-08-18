"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2 } from "lucide-react";
import { convertOrderToInvoice } from "@/actions/orderConfirmations";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";

export function ConvertToInvoiceButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const [isPending, setIsPending] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  async function handleClick() {
    if (
      !confirm(
        `Convertir le bon de commande ${orderNumber} en facture ? Le stock des pièces liées sera décrémenté.`
      )
    ) {
      return;
    }

    setIsPending(true);
    const result = await convertOrderToInvoice(orderId);
    if ("error" in result) {
      showToast(result.error, "error");
      setIsPending(false);
      return;
    }

    showToast(`Facture créée à partir du bon de commande ${orderNumber}.`, "success");
    router.push(`/factures/${result.invoiceId}`);
  }

  return (
    <Button type="button" onClick={handleClick} disabled={isPending} icon={<FileCheck2 size={15} />}>
      {isPending ? "Conversion..." : "Convertir en facture"}
    </Button>
  );
}
