import type { CurrencyCode } from "@/lib/currency";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const CURRENCY_SUFFIX: Record<CurrencyCode, string> = {
  MAD: "DH",
  EUR: "EUR",
  USD: "USD",
  CNY: "CNY",
};

/** Used on Stock/Product screens (RMB, stock value) — "1 234,00 DH" by default. */
export function formatCurrency(value: unknown, currency: CurrencyCode = "MAD"): string {
  const n = Number(value ?? 0);
  return `${currencyFormatter.format(n)} ${CURRENCY_SUFFIX[currency]}`;
}

const invoiceAmountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Matches the client's real invoice format: "MAD 12,000.00" (used on Factures pages + PDF). */
export function formatInvoiceAmount(value: unknown, currency: CurrencyCode = "MAD"): string {
  const n = Number(value ?? 0);
  return `${currency} ${invoiceAmountFormatter.format(n)}`;
}

export function formatDate(value: Date | string): string {
  return dateFormatter.format(new Date(value));
}
