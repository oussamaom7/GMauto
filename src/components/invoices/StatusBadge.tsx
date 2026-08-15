import { Badge } from "@/components/ui/Badge";
import type { InvoiceStatus } from "@prisma/client";

const LABELS: Record<InvoiceStatus, { label: string; color: "green" | "orange" | "red" | "gray" }> = {
  PAYEE: { label: "Payée", color: "green" },
  PARTIELLEMENT_PAYEE: { label: "Partiellement payée", color: "orange" },
  NON_PAYEE: { label: "Non payée", color: "red" },
  ANNULEE: { label: "Annulée", color: "gray" },
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const { label, color } = LABELS[status];
  return (
    <Badge color={color} dot>
      {label}
    </Badge>
  );
}
