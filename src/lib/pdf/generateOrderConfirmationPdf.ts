import PDFDocument from "pdfkit";
import type { Customer, OrderConfirmation, OrderConfirmationItem, Product, Settings } from "@prisma/client";
import { formatDate, formatInvoiceAmount } from "@/lib/format";
import { loadImageBuffer } from "@/lib/pdf/loadImage";

type OrderConfirmationWithRelations = OrderConfirmation & {
  customer: Customer;
  items: (OrderConfirmationItem & { product: Product | null })[];
};

const MARGIN = 50;
const HEADER_COLOR = "#be123c";
const TEXT_COLOR = "#111827";
const MUTED_COLOR = "#6b7280";
const BORDER_COLOR = "#e5e7eb";
const PHOTO_SIZE = 24;

export async function generateOrderConfirmationPdf(
  order: OrderConfirmationWithRelations,
  settings: Settings
): Promise<Buffer> {
  const [logoBuffer, photoBuffers] = await Promise.all([
    loadImageBuffer(settings.companyLogoUrl),
    Promise.all(order.items.map((item) => loadImageBuffer(item.product?.imageUrl))),
  ]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const contentWidth = doc.page.width - MARGIN * 2;
    const vatRate = Number(order.vatRate);

    // Header
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
      .fontSize(22)
      .fillColor(TEXT_COLOR)
      .text("BON DE COMMANDE", MARGIN, MARGIN, { width: contentWidth, align: "right" });

    let y = MARGIN + 50;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + contentWidth, y).strokeColor(BORDER_COLOR).stroke();
    y += 20;

    // Client block (left) + meta block (right)
    const blockTop = y;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED_COLOR).text("COMMANDE DE", MARGIN, y);
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(TEXT_COLOR)
      .text(order.customer.name, MARGIN, y + 14);
    let clientY = y + 32;
    if (order.customer.phone) {
      doc.font("Helvetica").fontSize(9).fillColor(MUTED_COLOR).text(order.customer.phone, MARGIN, clientY);
      clientY += 13;
    }
    if (order.customer.email) {
      doc.font("Helvetica").fontSize(9).fillColor(MUTED_COLOR).text(order.customer.email, MARGIN, clientY);
      clientY += 13;
    }

    const metaWidth = 200;
    const metaX = MARGIN + contentWidth - metaWidth;
    doc.font("Helvetica").fontSize(9).fillColor(MUTED_COLOR).text("N°", metaX, blockTop, { width: 80 });
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(TEXT_COLOR)
      .text(order.number, metaX + 80, blockTop, { width: 120, align: "right" });
    doc.font("Helvetica").fontSize(9).fillColor(MUTED_COLOR).text("Date", metaX, blockTop + 16, { width: 80 });
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(TEXT_COLOR)
      .text(formatDate(order.date), metaX + 80, blockTop + 16, { width: 120, align: "right" });

    let metaBottom = blockTop + 40;
    if (order.reference) {
      doc.font("Helvetica").fontSize(9).fillColor(MUTED_COLOR).text("Réf. client", metaX, blockTop + 32, { width: 80 });
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(TEXT_COLOR)
        .text(order.reference, metaX + 80, blockTop + 32, { width: 120, align: "right" });
      metaBottom = blockTop + 56;
    }
    

    y = Math.max(clientY, metaBottom) + 20;

    // Items table
    const cols = {
      photo: { x: MARGIN, width: 34 },
      desc: { x: MARGIN + 34, width: contentWidth * 0.4 - 34 },
      qty: { x: MARGIN + contentWidth * 0.4, width: contentWidth * 0.13 },
      pu: { x: MARGIN + contentWidth * 0.53, width: contentWidth * 0.17 },
      tva: { x: MARGIN + contentWidth * 0.7, width: contentWidth * 0.1 },
      montant: { x: MARGIN + contentWidth * 0.8, width: contentWidth * 0.2 },
    };
    const headerHeight = 24;

    function drawTableHeader() {
      doc.rect(MARGIN, y, contentWidth, headerHeight).fill(HEADER_COLOR);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8.5);
      doc.text("PHOTO", cols.photo.x + 4, y + 8, { width: cols.photo.width });
      doc.text("DÉSIGNATION", cols.desc.x + 8, y + 8, { width: cols.desc.width - 8 });
      doc.text("QUANTITÉ", cols.qty.x, y + 8, { width: cols.qty.width, align: "right" });
      doc.text("PRIX UNITAIRE", cols.pu.x, y + 8, { width: cols.pu.width - 8, align: "right" });
      doc.text("TVA", cols.tva.x, y + 8, { width: cols.tva.width, align: "right" });
      doc.text("MONTANT", cols.montant.x, y + 8, { width: cols.montant.width - 8, align: "right" });
      y += headerHeight;
    }

    drawTableHeader();

    const MIN_ROW_HEIGHT = 30;

    doc.font("Helvetica").fontSize(9.5).fillColor(TEXT_COLOR);
    order.items.forEach((item, i) => {
      const reference = item.reference || item.product?.reference || null;

      // Long descriptions wrap to multiple lines within the narrow desc
      // column — measure the actual wrapped height so the row grows to fit
      // instead of the next row's photo/text overlapping it.
      doc.font("Helvetica").fontSize(9.5);
      const descHeight = doc.heightOfString(item.description, { width: cols.desc.width - 12 });
      const refHeight = reference ? 12 : 0;
      const rowHeight = Math.max(MIN_ROW_HEIGHT, descHeight + refHeight + 20);

      if (y + rowHeight > doc.page.height - 220) {
        doc.addPage();
        y = MARGIN;
        drawTableHeader();
        doc.font("Helvetica").fontSize(9.5).fillColor(TEXT_COLOR);
      }

      const rowTop = y;
      const photoBuf = photoBuffers[i];
      if (photoBuf) {
        try {
          doc.image(photoBuf, cols.photo.x + 4, rowTop + (rowHeight - PHOTO_SIZE) / 2, {
            fit: [PHOTO_SIZE, PHOTO_SIZE],
          });
        } catch {
          // Corrupt/unreadable image — skip drawing it, keep the row.
        }
      }
      doc.font("Helvetica").fontSize(9.5).fillColor(TEXT_COLOR);
      doc.text(item.description, cols.desc.x + 8, rowTop + 10, { width: cols.desc.width - 12 });
      if (reference) {
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(MUTED_COLOR)
          .text(reference, cols.desc.x + 8, rowTop + 10 + descHeight + 2, { width: cols.desc.width - 12 });
      }
      const valueY = rowTop + (rowHeight - 12) / 2;
      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor(TEXT_COLOR)
        .text(String(item.quantity), cols.qty.x, valueY, { width: cols.qty.width, align: "right" });
      doc.text(formatInvoiceAmount(item.unitPrice, order.currency), cols.pu.x, valueY, { width: cols.pu.width - 8, align: "right" });
      doc.text(`${vatRate}%`, cols.tva.x, valueY, { width: cols.tva.width, align: "right" });
      doc.text(formatInvoiceAmount(item.total, order.currency), cols.montant.x, valueY, { width: cols.montant.width - 8, align: "right" });
      y += rowHeight;
      doc.moveTo(MARGIN, y).lineTo(MARGIN + contentWidth, y).strokeColor(BORDER_COLOR).stroke();
    });

    y += 20;
    if (y > doc.page.height - 150) {
      doc.addPage();
      y = MARGIN;
    }

    // Totals block — no payment lines, this is a pre-invoice document.
    const totalsWidth = 220;
    const totalsX = MARGIN + contentWidth - totalsWidth;

    function totalLine(label: string, value: string, opts: { bold?: boolean } = {}) {
      const bold = opts.bold ?? false;
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 9.5).fillColor(TEXT_COLOR);
      doc.text(label, totalsX, y, { width: totalsWidth * 0.5 });
      doc.text(value, totalsX + totalsWidth * 0.5, y, { width: totalsWidth * 0.5, align: "right" });
      y += bold ? 20 : 16;
    }

    totalLine("SOUS-TOTAL", formatInvoiceAmount(order.subtotal, order.currency));
    totalLine(`TVA (${vatRate}%)`, formatInvoiceAmount(order.vatAmount, order.currency));
    doc.moveTo(totalsX, y).lineTo(totalsX + totalsWidth, y).strokeColor(BORDER_COLOR).stroke();
    y += 6;
    totalLine("TOTAL", formatInvoiceAmount(order.total, order.currency), { bold: true });

    const footerParts = [
      settings.companyAddress,
      settings.companyPhone,
      settings.ice ? `ICE: ${settings.ice}` : null,
    ].filter(Boolean);

    // See generateInvoicePdf.ts: PDFKit's auto-pagination check is based on
    // page.margins.bottom, not a per-call text option — zero it first so a
    // footer drawn inside the margin doesn't spill onto a blank extra page.
    const originalBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED_COLOR)
      .text("Ce document est une confirmation de commande, pas une facture.", MARGIN, doc.page.height - 70, {
        width: contentWidth,
        align: "center",
      });
    if (footerParts.length > 0) {
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(MUTED_COLOR)
        .text(footerParts.join("  ·  "), MARGIN, doc.page.height - 56, {
          width: contentWidth,
          align: "center",
        });
    }

    doc.page.margins.bottom = originalBottomMargin;

    doc.end();
  });
}
