export function formatCheckoutMoney(cents, currency, maximumFractionDigits = 2) {
  if (!Number.isFinite(cents) || typeof currency !== "string" || !/^[a-z]{3}$/i.test(currency)) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits }).format(cents / 100);
}
