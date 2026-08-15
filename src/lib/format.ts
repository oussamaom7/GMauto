const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatCurrency(value: unknown): string {
  const n = Number(value ?? 0);
  return `${currencyFormatter.format(n)} DH`;
}

const invoiceAmountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Matches the client's real invoice format: "MAD 12,000.00" (used on Factures pages + PDF). */
export function formatInvoiceAmount(value: unknown): string {
  const n = Number(value ?? 0);
  return `MAD ${invoiceAmountFormatter.format(n)}`;
}

export function formatDate(value: Date | string): string {
  return dateFormatter.format(new Date(value));
}
