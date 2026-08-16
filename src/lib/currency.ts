export const CURRENCIES = ["MAD", "EUR", "USD", "CNY"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  MAD: "MAD (Dirham)",
  EUR: "EUR (Euro)",
  USD: "USD (Dollar)",
  CNY: "CNY (Yuan)",
};

type ExchangeRates = {
  eurToMad: unknown;
  usdToMad: unknown;
  cnyToMad: unknown;
};

/** Converts an amount in `currency` to MAD using the configured rates. */
export function toMad(amount: number, currency: CurrencyCode, rates: ExchangeRates): number {
  switch (currency) {
    case "EUR":
      return amount * Number(rates.eurToMad);
    case "USD":
      return amount * Number(rates.usdToMad);
    case "CNY":
      return amount * Number(rates.cnyToMad);
    default:
      return amount;
  }
}

/** Converts an amount in MAD to `currency` using the configured rates. */
export function fromMad(amountInMad: number, currency: CurrencyCode, rates: ExchangeRates): number {
  switch (currency) {
    case "EUR":
      return amountInMad / Number(rates.eurToMad);
    case "USD":
      return amountInMad / Number(rates.usdToMad);
    case "CNY":
      return amountInMad / Number(rates.cnyToMad);
    default:
      return amountInMad;
  }
}
