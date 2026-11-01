"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { StatusBadge } from "@/components/invoices/StatusBadge";
import { DeleteInvoiceButton } from "@/components/invoices/DeleteInvoiceButton";
import { formatDate, formatInvoiceAmount } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Table, THead, TH, TR, TD } from "@/components/ui/Table";
import type { Currency, InvoiceStatus } from "@prisma/client";

type Invoice = {
  id: string;
  number: string;
  date: Date;
  currency: Currency;
  total: number | string | { toString(): string };
  remainingAmount: number | string | { toString(): string };
  status: InvoiceStatus;
  customer: { name: string };
};

export function FacturesTable({ invoices }: { invoices: Invoice[] }) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => setVisible((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label={visible ? "Masquer les prix" : "Afficher les prix"}
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          {visible ? "Masquer les prix" : "Afficher les prix"}
        </button>
      </div>

      <Table minWidth={680}>
        <THead>
          <TH>N°</TH>
          <TH>Client</TH>
          <TH>Date</TH>
          <TH>Total</TH>
          <TH>Solde</TH>
          <TH>Statut</TH>
          <TH className="sticky right-0 bg-zinc-50 shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)] dark:bg-zinc-900" />
        </THead>
        <tbody>
          {invoices.map((inv) => (
            <TR key={inv.id}>
              <TD className="font-medium text-zinc-900 dark:text-zinc-50">{inv.number}</TD>
              <TD>{inv.customer.name}</TD>
              <TD>{formatDate(inv.date)}</TD>
              <TD className="tabular-nums font-medium">
                {visible ? (
                  formatInvoiceAmount(inv.total, inv.currency)
                ) : (
                  <span className="tracking-widest text-zinc-400">••••••</span>
                )}
              </TD>
              <TD className="tabular-nums">
                {visible ? (
                  formatInvoiceAmount(inv.remainingAmount, inv.currency)
                ) : (
                  <span className="tracking-widest text-zinc-400">••••••</span>
                )}
              </TD>
              <TD>
                <StatusBadge status={inv.status} />
              </TD>
              <TD className="sticky right-0 bg-white shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)] dark:bg-zinc-900">
                <div className="flex justify-end gap-1.5">
                  <Button href={`/factures/${inv.id}`} variant="secondary" size="sm" icon={<Eye size={14} />}>
                    Voir
                  </Button>
                  <DeleteInvoiceButton invoiceId={inv.id} invoiceNumber={inv.number} size="sm" />
                </div>
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
