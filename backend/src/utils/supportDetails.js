export const requestCategories = ["support", "contact", "payment", "refund", "live_chat"];

export function supportDetails(category, value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid request details.");
  const data = {};
  for (const [key, limit] of Object.entries({ company: 100, phone: 40, paymentReference: 160, reason: 500, preferredContact: 30 })) {
    if (value[key] == null || value[key] === "") continue;
    if (typeof value[key] !== "string" || value[key].trim().length > limit) throw new Error(`Invalid ${key}.`);
    data[key] = value[key].trim();
  }
  for (const key of ["refundAmount"]) {
    if (value[key] == null || value[key] === "") continue;
    const number = ["budget", "refundAmount"].includes(key) ? Math.round(Number(value[key]) * 100) : Number(value[key]);
    if (!Number.isSafeInteger(number) || number < 1 || number > 100000000) throw new Error(`Enter a positive whole number for ${key}.`);
    data[key] = number;
  }
  if (category === "refund" && (!data.paymentReference || !data.reason)) throw new Error("Refund requests need a payment reference and reason.");
  return data;
}
