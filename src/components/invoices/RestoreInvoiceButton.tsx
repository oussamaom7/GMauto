"use client";

import { RotateCcw } from "lucide-react";
import { restoreInvoice } from "@/actions/invoices";

export function RestoreInvoiceButton({ invoiceId }: { invoiceId: string }) {
  return (
    <form
      action={restoreInvoice.bind(null, invoiceId)}
      onSubmit={(e) => {
        if (!confirm("Restaurer cette facture ? Les pièces liées seront à nouveau sorties du stock.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-900/60 dark:hover:bg-blue-950/40"
      >
        <RotateCcw size={15} />
        Restaurer la facture
      </button>
    </form>
  );
}
