import "../config.js";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Local convenience export for Vercel's environment import. Never commit this output.
const keys = ["DATABASE_URL", "DIRECT_URL", "JWT_SECRET", "INTEGRATION_ENCRYPTION_KEY",
  "STRIPE_SECRET_KEY", "STRIPE_PRICE_PLUS_MONTHLY", "STRIPE_PRICE_PLUS_ANNUAL", "STRIPE_PRICE_PRO_MONTHLY", "STRIPE_PRICE_PRO_ANNUAL", "STRIPE_PORTAL_CONFIGURATION_ID", "STRIPE_INTEGRATION_IDENTIFIER", "STRIPE_REQUIRE_TERMS_OF_SERVICE",
  "PAYPAL_ENV", "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID", "PAYPAL_PLAN_PLUS_MONTHLY", "PAYPAL_PLAN_PLUS_ANNUAL", "PAYPAL_PLAN_PRO_MONTHLY", "PAYPAL_PLAN_PRO_ANNUAL",
  "OPENAI_API_KEY", "OPENAI_MODEL", "DEEPSEEK_API_KEY", "DEEPSEEK_MODEL", "GEMINI_API_KEY", "GEMINI_MODEL", "RESEND_API_KEY", "RESEND_FROM_EMAIL"];
const configured = keys.filter((key) => process.env[key]);
const text = ["# Private Vercel environment import. DO NOT COMMIT OR SHARE.",
  "# FRONTEND_URL and VITE_API_URL omitted: use Vercel's automatic domain and same-origin API.",
  "# Local Stripe webhook secret omitted: add the new deployed endpoint's signing secret in Vercel.",
  ...configured.map((key) => `${key}=${JSON.stringify(process.env[key])}`), ""].join("\n");
const output = fileURLToPath(new URL("../../.env.vercel", import.meta.url));
writeFileSync(output, text, { mode: 0o600 });
console.log(`Exported ${configured.length} configured variables to the Git-ignored .env.vercel file. No values printed.`);
console.log("After importing into Vercel, add the deployed Stripe webhook secret and any missing PayPal credentials, webhook ID and plan mappings, then redeploy.");
