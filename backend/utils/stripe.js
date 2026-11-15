import "../config.js";
import Stripe from "stripe";
import { siteOrigin } from "./siteOrigin.js";

export const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, timeout: 10000 }) : null;

export function billingConfig() {
  const origin = siteOrigin();
  const liveMode = /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY || "");
  return {
    origin,
    liveMode,
    // Sandbox accounts can test Checkout before publishing their legal pages.
    // Live Checkout always requires the Terms URL configured in Stripe.
    requireTermsOfService: liveMode || process.env.STRIPE_REQUIRE_TERMS_OF_SERVICE === "true",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    portalConfiguration: process.env.STRIPE_PORTAL_CONFIGURATION_ID,
    integrationIdentifier: process.env.STRIPE_INTEGRATION_IDENTIFIER || "casefy-billing-qmzprtal",
    prices: {
      plus: { monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY, annual: process.env.STRIPE_PRICE_PLUS_ANNUAL },
      pro: { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY, annual: process.env.STRIPE_PRICE_PRO_ANNUAL },
    },
  };
}
