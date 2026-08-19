import "dotenv/config";
import { writeFile } from "fs/promises";
import { prisma } from "./src/lib/prisma";
import { getSettings } from "./src/lib/settings";
import { generateOrderConfirmationPdf } from "./src/lib/pdf/generateOrderConfirmationPdf";

async function main() {
  const order = await prisma.orderConfirmation.findFirst({
    where: { customer: { name: "Audit Item Ref Client" } },
    orderBy: { createdAt: "desc" },
    include: { customer: true, items: { include: { product: true } } },
  });
  if (!order) throw new Error("not found");
  const settings = await getSettings();
  const buffer = await generateOrderConfirmationPdf(order, settings);
  await writeFile("item-ref-test.pdf", buffer);
  console.log("PDF generated, bytes:", buffer.length);
}

main().finally(() => prisma.$disconnect());
