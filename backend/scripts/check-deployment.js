import "../config.js";
import { siteOrigin } from "../utils/siteOrigin.js";
import { stripe, billingConfig } from "../utils/stripe.js";
import { paypalConfig, createPayPalClient } from "../utils/paypal.js";
import { validatePayPalPlan } from "../controllers/paypalController.js";
import prisma from "../db.js";

// Read-only provider checks. Never prints credentials or creates billing objects.
let blockers = 0;
function report(name, ready, detail = "") {
  if (!ready) blockers++;
  console.log(`${ready ? "OK" : "NEEDS SETUP"} ${name}${detail ? `: ${detail}` : ""}`);
}
const expected = { plus: { monthly: 2400, annual: 23040 }, pro: { monthly: 7900, annual: 75840 } };
try {
  let origin;
  try { origin = siteOrigin(); report("Website domain", origin.startsWith("https://"), origin); }
  catch { report("Website domain", false, "Set FRONTEND_URL to public HTTPS, or use Vercel's automatic domain variables"); }
  report("JWT secret", Boolean(process.env.JWT_SECRET));
  report("Database configuration", Boolean(process.env.DATABASE_URL));
  if (process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const migrations = await prisma.$queryRaw`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
      const { readdirSync } = await import("node:fs");
      const directories = readdirSync(new URL("../prisma/migrations/", import.meta.url), { withFileTypes: true }).filter((item) => item.isDirectory()).map((item) => item.name);
      const applied = new Set(migrations.map((row) => row.migration_name));
      report("Neon connectivity", true);
      report("Database migrations", directories.every((name) => applied.has(name)), `${applied.size}/${directories.length} applied`);
    } catch { report("Neon connectivity/schema", false, "Check DATABASE_URL and run npm run db:migrate"); }
  }
  report("Stripe server key", Boolean(stripe), stripe ? billingConfig().liveMode ? "live mode" : "test mode" : "Set STRIPE_SECRET_KEY");
  report("Stripe webhook signing secret", Boolean(process.env.STRIPE_WEBHOOK_SECRET), "Must belong to the deployed endpoint, not the local Stripe CLI listener");
  if (stripe) {
    const config = billingConfig();
    for (const tier of ["plus", "pro"]) for (const period of ["monthly", "annual"]) {
      const priceId = config.prices[tier][period];
      if (!priceId) { report(`Stripe ${tier} ${period}`, false, "Missing price mapping"); continue; }
      try {
        const price = await stripe.prices.retrieve(priceId);
        report(`Stripe ${tier} ${period}`, Boolean(price.active && price.livemode === config.liveMode && price.currency === "usd" && price.unit_amount === expected[tier][period] && price.recurring?.interval === (period === "annual" ? "year" : "month") && price.recurring.interval_count === 1));
      } catch { report(`Stripe ${tier} ${period}`, false, "Price cannot be read with this server key"); }
    }
    try {
      const portal = config.portalConfiguration ? await stripe.billingPortal.configurations.retrieve(config.portalConfiguration) : null;
      report("Stripe billing portal", Boolean(portal?.active));
      if (origin?.startsWith("https://")) {
        const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
        report("Stripe deployed webhook", endpoints.data.some((endpoint) => endpoint.status === "enabled" && endpoint.url === `${origin}/api/billing/webhook`), "Register the exact deployed endpoint and use its signing secret");
      } else report("Stripe deployed webhook", false, "Register after Vercel assigns the public domain");
      if (config.liveMode) {
        const account = await stripe.accounts.retrieve();
        report("Stripe live payments enabled", Boolean(account.charges_enabled));
      }
    } catch { report("Stripe account/portal", false, "Verify the configured Stripe account and portal"); }
  }
  const paypal = paypalConfig();
  report("PayPal server credentials", Boolean(process.env.PAYPAL_CLIENT_ID && paypal.secret), `${paypal.environment} mode`);
  report("PayPal webhook ID", Boolean(paypal.webhookId));
  const client = createPayPalClient(paypal);
  if (paypal.secret && paypal.webhookId && origin?.startsWith("https://")) {
    try {
      const webhook = await client.call(`/v1/notifications/webhooks/${encodeURIComponent(paypal.webhookId)}`);
      report("PayPal deployed webhook", webhook.url === `${origin}/api/billing/paypal/webhook`);
    } catch { report("PayPal deployed webhook", false, "Webhook is not readable with these app credentials"); }
  }
  for (const tier of ["plus", "pro"]) for (const period of ["monthly", "annual"]) {
    const planId = paypal.plans[tier][period];
    if (!planId || !paypal.secret) { report(`PayPal ${tier} ${period}`, false, "Set matching plan ID and server credentials"); continue; }
    try { validatePayPalPlan(await client.call(`/v1/billing/plans/${encodeURIComponent(planId)}`), tier, period); report(`PayPal ${tier} ${period}`, true); }
    catch { report(`PayPal ${tier} ${period}`, false, "Plan must be active and match the tier's USD price and period"); }
  }
  if (origin?.startsWith("https://")) {
    console.log(`Stripe webhook URL: ${origin}/api/billing/webhook`);
    console.log(`PayPal webhook URL: ${origin}/api/billing/paypal/webhook`);
  }
  console.log(blockers ? `${blockers} configuration items still need setup. No charges or subscriptions were created.` : "Deployment configuration checks passed. No charges or subscriptions were created.");
  process.exitCode = blockers ? 1 : 0;
} finally { await prisma.$disconnect(); }
