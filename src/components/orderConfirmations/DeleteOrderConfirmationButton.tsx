"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteOrderConfirmation } from "@/actions/orderConfirmations";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";

export function DeleteOrderConfirmationButton({
  orderId,
  orderNumber,
  redirectTo,
  size = "md",
}: {
  orderId: string;
  orderNumber: string;
  redirectTo?: string;
  size?: "sm" | "md";
}) {
  const [isPending, setIsPending] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  async function handleClick() {
    if (!confirm(`Supprimer définitivement le bon de commande ${orderNumber} ?`)) {
      return;
    }

    setIsPending(true);
    const result = await deleteOrderConfirmation(orderId);
    if (result?.error) {
      showToast(result.error, "error");
      setIsPending(false);
      return;
    }

    showToast(`Bon de commande ${orderNumber} supprimé.`, "success");
    if (redirectTo) router.push(redirectTo);
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
