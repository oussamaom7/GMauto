import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { updateInvoice } from "@/actions/invoices";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function ModifierFacturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [invoice, customers, products, settings] = await Promise.all([
    prisma.invoice.findUnique({ where: { id }, include: { items: true } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { reference: "asc" } }),
    getSettings(),
  ]);

  if (!invoice) {
    notFound();
  }
  if (invoice.status === "ANNULEE") {
    notFound();
  }

  const boundUpdateInvoice = updateInvoice.bind(null, id);

  return (
    <div>
      <PageHeader
        title={`Modifier ${invoice.number}`}
        description="Les paiements déjà enregistrés ne sont pas affectés ; le stock est ajusté automatiquement."
      />
      <InvoiceForm
        action={boundUpdateInvoice}
        mode="edit"
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        products={products.map((p) => ({
          id: p.id,
          reference: p.reference,
          name: p.name,
          sellingPrice: p.sellingPrice ? Number(p.sellingPrice) : null,
          rmb: Number(p.rmb),
          rmbCurrency: p.rmbCurrency,
          quantity: p.quantity,
          side: p.side,
        }))}
        vatRate={Number(settings.defaultVatRate)}
        rates={{
          eurToMad: Number(settings.eurToMad),
          usdToMad: Number(settings.usdToMad),
          cnyToMad: Number(settings.cnyToMad),
        }}
        initialValues={{
          customerId: invoice.customerId,
          date: invoice.date.toISOString().slice(0, 10),
          currency: invoice.currency,
          applyVat: Number(invoice.vatRate) > 0,
          paidAmount: Number(invoice.paidAmount),
          items: invoice.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
          })),
        }}
      />
    </div>
  );
}
