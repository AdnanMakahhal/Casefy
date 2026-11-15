import "../config.js";
import { siteOrigin } from "./siteOrigin.js";

export const suppliedPayPalClientId = "BAADUQzKaL-AHs7DWbaqgPZW3poSNDMrVrxUHfZnJnirYGSjmzm6XeYzz8HgH4ywgDHHp-tinFAuK_s09k";
export const suppliedPayPalPlanId = "P-79U58668YW295372JNL4QHKA";
export const paypalBlocksCheckout = (user) => Boolean(user?.paypalSubscriptionId && !["CANCELLED", "EXPIRED"].includes(user.paypalStatus));
export function paypalConfig() {
  return {
    clientId: process.env.PAYPAL_CLIENT_ID || suppliedPayPalClientId,
    secret: process.env.PAYPAL_CLIENT_SECRET,
    webhookId: process.env.PAYPAL_WEBHOOK_ID,
    environment: process.env.PAYPAL_ENV === "sandbox" ? "sandbox" : "live",
    origin: siteOrigin(),
    plans: {
      plus: { monthly: process.env.PAYPAL_PLAN_PLUS_MONTHLY, annual: process.env.PAYPAL_PLAN_PLUS_ANNUAL },
      pro: { monthly: process.env.PAYPAL_PLAN_PRO_MONTHLY, annual: process.env.PAYPAL_PLAN_PRO_ANNUAL },
    },
  };
}

export function createPayPalClient(config, request = fetch) {
  const origin = config.environment === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  let token;
  async function json(url, options) {
    let response;
    try { response = await request(url, { ...options, signal: AbortSignal.timeout(10000) }); }
    catch { throw Object.assign(new Error("PayPal could not be reached. Please retry."), { status: 502 }); }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error("PayPal could not complete this request. Check the PayPal account configuration or contact support."), { status: 502 });
    return body;
  }
  async function accessToken() {
    if (!config.secret) throw Object.assign(new Error("PayPal checkout is not configured yet."), { status: 503 });
    if (token && token.expires > Date.now()) return token.value;
    const result = await json(`${origin}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
    if (typeof result.access_token !== "string" || !result.access_token || !Number.isFinite(result.expires_in)) throw Object.assign(new Error("PayPal authentication did not return a valid token."), { status: 502 });
    token = { value: result.access_token, expires: Date.now() + Math.max(0, result.expires_in - 60) * 1000 };
    return token.value;
  }
  return {
    async call(path, method = "GET", body, idempotencyKey) {
      return json(`${origin}${path}`, { method, headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json", ...(idempotencyKey ? { "PayPal-Request-Id": idempotencyKey } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    },
  };
}
