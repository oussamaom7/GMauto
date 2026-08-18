"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteCustomer } from "@/actions/customers";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";

export function DeleteCustomerButton({
  customerId,
  customerName,
  redirectTo,
  size = "md",
}: {
  customerId: string;
  customerName: string;
  redirectTo?: string;
  size?: "sm" | "md";
}) {
  const [isPending, setIsPending] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  async function handleClick() {
    if (!confirm(`Supprimer définitivement le client "${customerName}" ?`)) {
      return;
    }

    setIsPending(true);
    const result = await deleteCustomer(customerId);
    if (result?.error) {
      showToast(result.error, "error");
      setIsPending(false);
      return;
    }

    showToast(`"${customerName}" a été supprimé.`, "success");
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
