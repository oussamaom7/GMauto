import "dotenv/config";
import { prisma } from "./src/lib/prisma";

async function main() {
  const customers = await prisma.customer.findMany({ where: { name: "Audit Item Ref Client" } });
  for (const c of customers) {
    const orders = await prisma.orderConfirmation.findMany({ where: { customerId: c.id } });
    for (const o of orders) {
      await prisma.orderConfirmationItem.deleteMany({ where: { orderConfirmationId: o.id } });
      await prisma.orderConfirmation.delete({ where: { id: o.id } });
    }
    await prisma.customer.delete({ where: { id: c.id } });
  }
  await prisma.product.deleteMany({ where: { reference: "AUDIT-ITEMREF-001" } });
  console.log("cleaned up");
}

main().finally(() => prisma.$disconnect());
