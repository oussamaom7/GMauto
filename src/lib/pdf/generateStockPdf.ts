import PDFDocument from "pdfkit";
import { readFile } from "fs/promises";
import path from "path";
import type { Brand, Category, Product, Settings } from "@prisma/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { toMad, type CurrencyCode } from "@/lib/currency";

type ProductWithRelations = Product & {
  category: Category | null;
  brand: Brand | null;
};

const MARGIN = 50;
const HEADER_COLOR = "#be123c";
const TEXT_COLOR = "#111827";
const MUTED_COLOR = "#6b7280";
const BORDER_COLOR = "#e5e7eb";
const PHOTO_SIZE = 28;
const ROW_HEIGHT = 38;
const HEADER_HEIGHT = 22;

/**
 * `formatCurrency` groups thousands with a narrow no-break space (fr-FR locale),
 * a glyph PDFKit's built-in Helvetica font doesn't have — it renders as garbage
 * ("/") instead of a space. Swap it for a plain ASCII space, which the font does
 * support.
 */
function pdfCurrency(value: unknown, currency: CurrencyCode): string {
  return formatCurrency(value, currency).replace(/[  ]/g, " ");
}

async function loadImageBuffer(imageUrl: string | null): Promise<Buffer | null> {
  if (!imageUrl) return null;
  try {
    if (imageUrl.startsWith("http")) {
      const res = await fetch(imageUrl);
      return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
    }
    return await readFile(path.join(process.cwd(), "storage", "uploads", imageUrl));
  } catch {
    return null;
  }
}

export async function generateStockPdf(
  products: ProductWithRelations[],
  settings: Settings
): Promise<Buffer> {
  const [logoBuffer, photoBuffers] = await Promise.all([
    loadImageBuffer(settings.companyLogoUrl),
    Promise.all(products.map((p) => loadImageBuffer(p.imageUrl))),
  ]);

  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalValueMad = products.reduce(
    (sum, p) => sum + toMad(Number(p.rmb) * p.quantity, p.rmbCurrency as CurrencyCode, settings),
    0
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const contentWidth = doc.page.width - MARGIN * 2;

    let nameX = MARGIN;
    if (logoBuffer) {
      doc.image(logoBuffer, MARGIN, MARGIN, { fit: [36, 36] });
      nameX = MARGIN + 46;
    }
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(TEXT_COLOR)
      .text(settings.companyName, nameX, MARGIN + (logoBuffer ? 9 : 0));
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(TEXT_COLOR)
      .text("INVENTAIRE DU STOCK", MARGIN, MARGIN, { width: contentWidth, align: "right" });

    let y = MARGIN + 50;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + contentWidth, y).strokeColor(BORDER_COLOR).stroke();
    y += 10;
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(MUTED_COLOR)
      .text(`Généré le ${formatDate(new Date())} — ${products.length} pièce(s)`, MARGIN, y);
    y += 24;

    const cols = {
      photo: { x: MARGIN, width: 46 },
      ref: { x: MARGIN + 46, width: contentWidth * 0.4 - 46 },
      qty: { x: MARGIN + contentWidth * 0.4, width: contentWidth * 0.14 },
      rmb: { x: MARGIN + contentWidth * 0.54, width: contentWidth * 0.22 },
      total: { x: MARGIN + contentWidth * 0.76, width: contentWidth * 0.24 },
    };

    function drawTableHeader() {
      doc.rect(MARGIN, y, contentWidth, HEADER_HEIGHT).fill(HEADER_COLOR);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8.5);
      doc.text("PHOTO", cols.photo.x + 4, y + 7, { width: cols.photo.width });
      doc.text("RÉFÉRENCE / DÉSIGNATION", cols.ref.x, y + 7, { width: cols.ref.width });
      doc.text("QUANTITÉ", cols.qty.x, y + 7, { width: cols.qty.width, align: "right" });
      doc.text("RMB", cols.rmb.x, y + 7, { width: cols.rmb.width - 8, align: "right" });
      doc.text("TOTAL", cols.total.x, y + 7, { width: cols.total.width - 8, align: "right" });
      y += HEADER_HEIGHT;
    }

    drawTableHeader();

    products.forEach((product, i) => {
      if (y + ROW_HEIGHT > doc.page.height - 130) {
        doc.addPage();
        y = MARGIN;
        drawTableHeader();
      }

      const rowTop = y;
      const photoBuf = photoBuffers[i];
      if (photoBuf) {
        try {
          doc.image(photoBuf, cols.photo.x + 4, rowTop + 5, { fit: [PHOTO_SIZE, PHOTO_SIZE] });
        } catch {
          // Corrupt/unreadable image — skip drawing it, keep the row.
        }
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(TEXT_COLOR)
        .text(product.name, cols.ref.x, rowTop + 5, { width: cols.ref.width });
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(MUTED_COLOR)
        .text(product.reference, cols.ref.x, rowTop + 19, { width: cols.ref.width });

      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(TEXT_COLOR)
        .text(String(product.quantity), cols.qty.x, rowTop + 12, { width: cols.qty.width, align: "right" });
      doc.text(pdfCurrency(product.rmb, product.rmbCurrency as CurrencyCode), cols.rmb.x, rowTop + 12, {
        width: cols.rmb.width - 8,
        align: "right",
      });
      doc
        .font("Helvetica-Bold")
        .text(
          pdfCurrency(Number(product.rmb) * product.quantity, product.rmbCurrency as CurrencyCode),
          cols.total.x,
          rowTop + 12,
          { width: cols.total.width - 8, align: "right" }
        );

      y += ROW_HEIGHT;
      doc.moveTo(MARGIN, y).lineTo(MARGIN + contentWidth, y).strokeColor(BORDER_COLOR).stroke();
    });

    y += 20;
    if (y > doc.page.height - 150) {
      doc.addPage();
      y = MARGIN;
    }

    const totalsWidth = 260;
    const totalsX = MARGIN + contentWidth - totalsWidth;
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(TEXT_COLOR)
      .text("Quantité totale", totalsX, y, { width: totalsWidth * 0.5 });
    doc.text(String(totalQuantity), totalsX + totalsWidth * 0.5, y, {
      width: totalsWidth * 0.5,
      align: "right",
    });
    y += 18;
    doc.moveTo(totalsX, y).lineTo(totalsX + totalsWidth, y).strokeColor(BORDER_COLOR).stroke();
    y += 8;
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(TEXT_COLOR)
      .text("VALEUR TOTALE DU STOCK", totalsX, y, { width: totalsWidth * 0.5 });
    doc.text(pdfCurrency(totalValueMad, "MAD"), totalsX + totalsWidth * 0.5, y, {
      width: totalsWidth * 0.5,
      align: "right",
    });

    doc.end();
  });
}
