import "../config.js";
import Stripe from "stripe";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

if (!/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || "")) throw new Error("Sandbox setup requires a test API key");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2 });
const envPath = fileURLToPath(new URL("../.env", import.meta.url));
const updates = {};
const products = [];

for (const [plan, amount] of [["plus", 2400], ["pro", 7900]]) {
  const productId = `casefy_${plan}_v1`;
  let product;
  try { product = await stripe.products.retrieve(productId); }
  catch (error) {
    if (error.code !== "resource_missing") throw error;
    product = await stripe.products.create({ id: productId, name: `Casefy ${plan === "plus" ? "Plus" : "Pro"}`, metadata: { app: "casefy", plan } }, { idempotencyKey: `casefy-product-${plan}-v1` });
  }
  if (product.metadata.app !== "casefy" || product.metadata.plan !== plan) throw new Error("Existing product metadata does not match Casefy");
  const intervals = [["monthly", "month", amount], ["annual", "year", Math.round(amount * 12 * 80 / 100)]];
  const priceIds = [];
  for (const [billing, interval, unitAmount] of intervals) {
    const lookupKey = billing === "annual" ? `casefy_${plan}_annual_usd_20off_v1` : `casefy_${plan}_${billing}_usd_v1`;
    let price = (await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 })).data[0];
    if (!price) price = await stripe.prices.create({ product: product.id, currency: "usd", unit_amount: unitAmount, recurring: { interval }, lookup_key: lookupKey, metadata: { app: "casefy", plan, billing } }, { idempotencyKey: lookupKey });
    if (price.unit_amount !== unitAmount || price.currency !== "usd" || price.recurring?.interval !== interval || price.product !== product.id) throw new Error("Existing price does not match the configured catalog");
    updates[`STRIPE_PRICE_${plan.toUpperCase()}_${billing.toUpperCase()}`] = price.id;
    priceIds.push(price.id);
  }
  products.push({ product: product.id, prices: priceIds });
}

const portalSettings = {
  business_profile: { headline: "Manage your Casefy subscription" },
  features: {
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: { enabled: true, mode: "at_period_end" },
    subscription_update: { enabled: true, default_allowed_updates: ["price"], products, proration_behavior: "always_invoice" },
  },
};
const portal = process.env.STRIPE_PORTAL_CONFIGURATION_ID
  ? await stripe.billingPortal.configurations.update(process.env.STRIPE_PORTAL_CONFIGURATION_ID, portalSettings)
  : await stripe.billingPortal.configurations.create(portalSettings, { idempotencyKey: "casefy-billing-portal-v1" });
updates.STRIPE_PORTAL_CONFIGURATION_ID = portal.id;
updates.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
updates.STRIPE_INTEGRATION_IDENTIFIER = process.env.STRIPE_INTEGRATION_IDENTIFIER || `casefy-billing-${Array.from(randomBytes(8), (value) => String.fromCharCode(97 + value % 26)).join("")}`;
let env = readFileSync(envPath, "utf8");
for (const [key, value] of Object.entries(updates)) {
  const pattern = new RegExp(`^${key}=.*$`, "m");
  env = pattern.test(env) ? env.replace(pattern, `${key}=${value}`) : `${env.trimEnd()}\n${key}=${value}\n`;
}
writeFileSync(envPath, env);
console.log("Sandbox catalog ready: Plus $24/month or $230.40/year; Pro $79/month or $758.40/year. Annual prices include a recurring 20% discount.");
console.log("Configured separate products, recurring prices, and the customer portal. Saved IDs to backend/.env.");
