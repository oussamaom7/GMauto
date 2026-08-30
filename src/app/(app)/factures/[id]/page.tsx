import { notFound } from "next/navigation";
import { FileDown, ArrowLeft, CircleAlert, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/invoices/StatusBadge";
import { RecordPaymentForm } from "@/components/invoices/RecordPaymentForm";
import { VoidInvoiceButton } from "@/components/invoices/VoidInvoiceButton";
import { DeleteInvoiceButton } from "@/components/invoices/DeleteInvoiceButton";
import { formatDate, formatInvoiceAmount } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table, THead, TH, TR, TD } from "@/components/ui/Table";

export default async function FactureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true } },
      payments: { orderBy: { date: "desc" } },
    },
  });

  if (!invoice) {
    notFound();
  }

  const isVoided = invoice.status === "ANNULEE";
  const canPay = !isVoided && Number(invoice.remainingAmount) > 0;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={invoice.number}
        description={formatDate(invoice.date)}
        actions={
          <>
            <Button href="/factures" variant="secondary" icon={<ArrowLeft size={16} />}>
              Retour
            </Button>
            {!isVoided && (
              <Button
                href={`/factures/${invoice.id}/modifier`}
                variant="secondary"
                icon={<Pencil size={16} />}
              >
                Modifier
              </Button>
            )}
            <Button href={`/factures/${invoice.id}/pdf`} target="_blank" icon={<FileDown size={16} />}>
              Télécharger le PDF
            </Button>
          </>
        }
      />

      <div className="flex items-center gap-2">
        <StatusBadge status={invoice.status} />
      </div>

      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Facture à</p>
        <a
          href={`/clients/${invoice.customerId}`}
          className="font-medium text-zinc-900 hover:text-blue-600 hover:underline dark:text-zinc-50"
        >
          {invoice.customer.name}
        </a>
        {invoice.customer.phone && (
          <p className="text-sm text-zinc-500">{invoice.customer.phone}</p>
        )}
        {invoice.customer.email && (
          <p className="text-sm text-zinc-500">{invoice.customer.email}</p>
        )}
      </Card>

      <Table>
        <THead>
          <TH>Désignation</TH>
          <TH>Quantité</TH>
          <TH>PU</TH>
          <TH>Montant</TH>
        </THead>
        <tbody>
          {invoice.items.map((item) => (
            <TR key={item.id}>
              <TD>
                {item.description}
                {item.product && (
                  <span className="ml-1 text-xs text-zinc-400">({item.product.reference})</span>
                )}
              </TD>
              <TD className="tabular-nums">{item.quantity}</TD>
              <TD className="tabular-nums">{formatInvoiceAmount(item.unitPrice, invoice.currency)}</TD>
              <TD className="tabular-nums font-medium">{formatInvoiceAmount(item.total, invoice.currency)}</TD>
            </TR>
          ))}
        </tbody>
      </Table>

      <div className="flex justify-end">
        <Card className="w-full max-w-xs space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Sous-total</span>
            <span className="tabular-nums">{formatInvoiceAmount(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">TVA ({Number(invoice.vatRate)}%)</span>
            <span className="tabular-nums">{formatInvoiceAmount(invoice.vatAmount, invoice.currency)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-200 pt-2.5 text-base font-semibold dark:border-zinc-800">
            <span>Total</span>
            <span className="tabular-nums">{formatInvoiceAmount(invoice.total, invoice.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Payé</span>
            <span className="tabular-nums">{formatInvoiceAmount(invoice.paidAmount, invoice.currency)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Solde à payer</span>
            <span
              className={`tabular-nums ${Number(invoice.remainingAmount) > 0 ? "text-red-600" : "text-emerald-600"}`}
            >
              {formatInvoiceAmount(invoice.remainingAmount, invoice.currency)}
            </span>
          </div>
        </Card>
      </div>

      {isVoided && (
        <Card className="flex items-center gap-2.5 border-zinc-200 bg-zinc-50 dark:bg-zinc-900/60">
          <CircleAlert size={18} className="shrink-0 text-zinc-400" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Cette facture a été annulée. Le stock des pièces liées a été restauré.
          </p>
        </Card>
      )}

      {invoice.payments.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Paiements
          </h2>
          <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {invoice.payments.map((p) => (
              <li key={p.id}>
                {formatDate(p.date)} — {formatInvoiceAmount(p.amount, invoice.currency)}
                {p.method ? ` (${p.method})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {canPay && <RecordPaymentForm invoiceId={invoice.id} />}

      <div className="flex flex-wrap gap-2">
        {!isVoided && <VoidInvoiceButton invoiceId={invoice.id} />}
        <DeleteInvoiceButton
          invoiceId={invoice.id}
          invoiceNumber={invoice.number}
          redirectTo="/factures"
        />
      </div>
    </div>
  );
}
