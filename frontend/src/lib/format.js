export const titleCase = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
export const displayDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not set";
export const currencyDigits = (currency) =>
  new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
    .maximumFractionDigits;
export const formatMoney = (amount, currency = "usd") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 10 ** currencyDigits(currency));
