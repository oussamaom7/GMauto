"use client";

import { Ban } from "lucide-react";
import { voidInvoice } from "@/actions/invoices";

export function VoidInvoiceButton({ invoiceId }: { invoiceId: string }) {
  return (
    <form
      action={voidInvoice.bind(null, invoiceId)}
      onSubmit={(e) => {
        if (!confirm("Annuler cette facture et restocker les pièces liées ?")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40"
      >
        <Ban size={15} />
        Annuler la facture
      </button>
    </form>
  );
}
