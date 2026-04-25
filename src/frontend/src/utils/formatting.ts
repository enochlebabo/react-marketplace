import { fromUnixTime } from "date-fns";

export function fromNanoseconds(timestamp: bigint): Date {
  return fromUnixTime(Number(timestamp) / 1_000_000_000);
}

// Formats a price with its currency code using Intl.NumberFormat when the
// code is recognized. Falls back to "CODE amount" if Intl rejects the code.
// Listings price is a whole-number bigint, so no fractional digits.
export function formatPrice(
  price: bigint,
  currency: string | undefined,
): string {
  const code = (currency ?? "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(Number(price));
  } catch {
    return `${code} ${price.toString()}`;
  }
}
