import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { createOrderConfirmation } from "@/actions/orderConfirmations";
import { OrderConfirmationForm } from "@/components/orderConfirmations/OrderConfirmationForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function NouveauBonDeCommandePage() {
  const [customers, products, settings] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { reference: "asc" } }),
    getSettings(),
  ]);

  return (
    <div>
      <PageHeader
        title="Nouveau bon de commande"
        description="Sélectionnez le client et ajoutez les produits ou services commandés."
      />
      <OrderConfirmationForm
        action={createOrderConfirmation}
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
      />
    </div>
  );
}
