import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { createInvoice } from "@/actions/invoices";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function NouvelleFacturePage() {
  const [customers, products, settings] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { reference: "asc" } }),
    getSettings(),
  ]);

  return (
    <div>
      <PageHeader title="Nouvelle facture" description="Sélectionnez le client et ajoutez les produits ou services facturés." />
      <InvoiceForm
        action={createInvoice}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        products={products.map((p) => ({
          id: p.id,
          reference: p.reference,
          name: p.name,
          sellingPrice: p.sellingPrice ? Number(p.sellingPrice) : null,
          rmb: Number(p.rmb),
          quantity: p.quantity,
        }))}
        vatRate={Number(settings.defaultVatRate)}
      />
    </div>
  );
}
