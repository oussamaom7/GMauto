import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { generateOrderConfirmationPdf } from "@/lib/pdf/generateOrderConfirmationPdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.orderConfirmation.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });

  if (!order) {
    return new NextResponse("Bon de commande introuvable", { status: 404 });
  }

  const settings = await getSettings();
  const pdfBuffer = await generateOrderConfirmationPdf(order, settings);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.number}.pdf"`,
    },
  });
}
