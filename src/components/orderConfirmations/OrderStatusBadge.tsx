import { Badge } from "@/components/ui/Badge";
import type { OrderConfirmationStatus } from "@prisma/client";

const LABELS: Record<OrderConfirmationStatus, { label: string; color: "green" | "orange" | "red" | "gray" }> = {
  EN_ATTENTE: { label: "En attente", color: "orange" },
  CONVERTIE: { label: "Convertie en facture", color: "green" },
  ANNULEE: { label: "Annulée", color: "gray" },
};

export function OrderStatusBadge({ status }: { status: OrderConfirmationStatus }) {
  const { label, color } = LABELS[status];
  return (
    <Badge color={color} dot>
      {label}
    </Badge>
  );
}
