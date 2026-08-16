import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { generateStockPdf } from "@/lib/pdf/generateStockPdf";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(q
      ? {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true },
      orderBy: { reference: "asc" },
    }),
    getSettings(),
  ]);

  const pdfBuffer = await generateStockPdf(products, settings);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="stock.pdf"`,
    },
  });
}
