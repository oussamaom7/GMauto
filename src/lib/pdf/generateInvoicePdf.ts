import PDFDocument from "pdfkit";
import type { Customer, Invoice, InvoiceItem, Product, Settings } from "@prisma/client";
import { formatDate, formatInvoiceAmount } from "@/lib/format";
import { loadImageBuffer } from "@/lib/pdf/loadImage";

type InvoiceWithRelations = Invoice & {
  customer: Customer;
  items: (InvoiceItem & { product: Product | null })[];
};

const MARGIN = 50;
const HEADER_COLOR = "#be123c";
const TEXT_COLOR = "#111827";
const MUTED_COLOR = "#6b7280";
const BORDER_COLOR = "#e5e7eb";
const PHOTO_SIZE = 24;

export async function generateInvoicePdf(
  invoice: InvoiceWithRelations,
  settings: Settings
): Promise<Buffer> {
  const [logoBuffer, photoBuffers] = await Promise.all([
    loadImageBuffer(settings.companyLogoUrl),
    Promise.all(invoice.items.map((item) => loadImageBuffer(item.product?.imageUrl))),
  ]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const contentWidth = doc.page.width - MARGIN * 2;
    const vatRate = Number(invoice.vatRate);

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
      .fontSize(26)
      .fillColor(TEXT_COLOR)
      .text("FACTURE", MARGIN, MARGIN, { width: contentWidth, align: "right" });

    let y = MARGIN + 50;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + contentWidth, y).strokeColor(BORDER_COLOR).stroke();
    y += 20;

    // Client block (left) + meta block (right)
    const blockTop = y;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED_COLOR).text("FACTURE À", MARGIN, y);
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(TEXT_COLOR)
      .text(invoice.customer.name, MARGIN, y + 14);
    let clientY = y + 32;
    if (invoice.customer.phone) {
      doc.font("Helvetica").fontSize(9).fillColor(MUTED_COLOR).text(invoice.customer.phone, MARGIN, clientY);
      clientY += 13;
    }
    if (invoice.customer.email) {
      doc.font("Helvetica").fontSize(9).fillColor(MUTED_COLOR).text(invoice.customer.email, MARGIN, clientY);
      clientY += 13;
    }

    const metaWidth = 200;
    const metaX = MARGIN + contentWidth - metaWidth;
    doc.font("Helvetica").fontSize(9).fillColor(MUTED_COLOR).text("N°", metaX, blockTop, { width: 80 });
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(TEXT_COLOR)
      .text(invoice.number, metaX + 80, blockTop, { width: 120, align: "right" });
    doc.font("Helvetica").fontSize(9).fillColor(MUTED_COLOR).text("Date", metaX, blockTop + 16, { width: 80 });
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(TEXT_COLOR)
      .text(formatDate(invoice.date), metaX + 80, blockTop + 16, { width: 120, align: "right" });

    y = Math.max(clientY, blockTop + 40) + 20;

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
    invoice.items.forEach((item, i) => {
      // Long descriptions wrap to multiple lines within the narrow desc
      // column — measure the actual wrapped height so the row grows to fit
      // instead of the next row's photo/text overlapping it.
      doc.font("Helvetica").fontSize(9.5);
      const descHeight = doc.heightOfString(item.description, { width: cols.desc.width - 12 });
      const rowHeight = Math.max(MIN_ROW_HEIGHT, descHeight + 20);

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
      const valueY = rowTop + (rowHeight - 12) / 2;
      doc.text(String(item.quantity), cols.qty.x, valueY, { width: cols.qty.width, align: "right" });
      doc.text(formatInvoiceAmount(item.unitPrice, invoice.currency), cols.pu.x, valueY, { width: cols.pu.width - 8, align: "right" });
      doc.text(`${vatRate}%`, cols.tva.x, valueY, { width: cols.tva.width, align: "right" });
      doc.text(formatInvoiceAmount(item.total, invoice.currency), cols.montant.x, valueY, { width: cols.montant.width - 8, align: "right" });
      y += rowHeight;
      doc.moveTo(MARGIN, y).lineTo(MARGIN + contentWidth, y).strokeColor(BORDER_COLOR).stroke();
    });

    y += 20;
    if (y > doc.page.height - 180) {
      doc.addPage();
      y = MARGIN;
    }

    // Totals block
    const totalsWidth = 220;
    const totalsX = MARGIN + contentWidth - totalsWidth;

    function totalLine(label: string, value: string, opts: { bold?: boolean; color?: string } = {}) {
      const bold = opts.bold ?? false;
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 9.5).fillColor(opts.color ?? TEXT_COLOR);
      doc.text(label, totalsX, y, { width: totalsWidth * 0.5 });
      doc.text(value, totalsX + totalsWidth * 0.5, y, { width: totalsWidth * 0.5, align: "right" });
      y += bold ? 20 : 16;
    }

    const totalPieces = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
    totalLine("NOMBRE DE PIÈCES", String(totalPieces));
    totalLine("SOUS-TOTAL", formatInvoiceAmount(invoice.subtotal, invoice.currency));
    totalLine(`TVA (${vatRate}%)`, formatInvoiceAmount(invoice.vatAmount, invoice.currency));
    doc.moveTo(totalsX, y).lineTo(totalsX + totalsWidth, y).strokeColor(BORDER_COLOR).stroke();
    y += 6;
    totalLine("TOTAL", formatInvoiceAmount(invoice.total, invoice.currency), { bold: true });
    totalLine("PAYÉ", formatInvoiceAmount(invoice.paidAmount, invoice.currency));
    totalLine("SOLDE À PAYER", formatInvoiceAmount(invoice.remainingAmount, invoice.currency), {
      bold: true,
      color: Number(invoice.remainingAmount) > 0 ? "#b91c1c" : "#15803d",
    });

    const footerParts = [
      settings.companyAddress,
      settings.companyPhone,
      settings.ice ? `ICE: ${settings.ice}` : null,
    ].filter(Boolean);

    // This footer is placed inside the page's bottom margin on purpose.
    // PDFKit's auto-pagination check is based on page.margins.bottom, not
    // any per-call text option — without zeroing it first, drawing text this
    // close to the edge silently spills onto a near-blank extra page.
    const originalBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED_COLOR)
      .text("Merci de votre confiance.", MARGIN, doc.page.height - 70, {
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
