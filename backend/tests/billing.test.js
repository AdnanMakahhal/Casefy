import assert from "node:assert/strict";
import { test } from "node:test";
import Stripe from "stripe";
import { createBillingController } from "../controllers/billingController.js";
import { createBillingService, subscriptionState } from "../services/billingService.js";

const config = { origin: "http://localhost:5173", webhookSecret: "whsec_unit_test", liveMode: false, portalConfiguration: "bpc_test", integrationIdentifier: "casefy-billing-abcdefgh", prices: { plus: { monthly: "price_plus" }, pro: { monthly: "price_pro" } } };
const baseUser = { id: 8, name: "Test User", email: "test@example.com", plan: "free", createdAt: new Date("2026-01-01"), stripeCustomerId: "cus_test", stripeCheckoutSessionId: null };
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const subscription = (overrides = {}) => ({ id: "sub_test", customer: "cus_test", created: 100, status: "active", latest_invoice: { status: "paid" }, items: { data: [{ price: { id: "price_plus" }, current_period_end: 1800000000 }] }, ...overrides });

function fixture(overrides = {}) {
  let user = { ...baseUser, ...overrides };
  let subscriptions = [];
  const sessions = new Map();
  const processed = new Map();
  const calls = { checkout: [], expired: [], canceled: [], portal: [], updates: 0, reads: 0 };
  const tx = {
    $queryRaw: async () => [],
    user: {
      findUnique: async () => user,
      update: async ({ data }) => { calls.updates++; user = { ...user, ...data }; return user; },
      delete: async () => { user = null; },
    },
    stripeWebhookEvent: { findUnique: async ({ where }) => processed.get(where.id), create: async ({ data }) => { processed.set(data.id, data); return data; } },
  };
  const db = { ...tx, $transaction: async (action) => action(tx) };
  const stripe = {
    customers: { create: async () => ({ id: "cus_new" }) },
    subscriptions: {
      list: () => (async function* () { calls.reads++; yield* subscriptions; })(),
      cancel: async (id) => { calls.canceled.push(id); },
    },
    checkout: { sessions: {
      create: async (data, options) => { calls.checkout.push({ data, options }); const session = { id: "cs_test_123", customer: data.customer, client_reference_id: data.client_reference_id, status: "open", metadata: data.metadata, url: "https://checkout.stripe.com/test" }; sessions.set(session.id, session); return session; },
      retrieve: async (id) => sessions.get(id),
      expire: async (id) => { calls.expired.push(id); sessions.get(id).status = "expired"; },
    } },
    billingPortal: { sessions: { create: async (data) => { calls.portal.push(data); return { url: "https://billing.stripe.com/test" }; } } },
    prices: { retrieve: async (id) => ({ id, active: true, currency: "usd", unit_amount: id === "price_plus" ? 2400 : 7900, recurring: { interval: "month" } }) },
    webhooks: new Stripe("sk_test_unit_only").webhooks,
  };
  return { db, stripe, calls, sessions, processed, get user() { return user; }, setSubscriptions(value) { subscriptions = value; } };
}

test("checkout uses trusted prices and return URLs rather than client supplied values", async () => {
  const f = fixture();
  const { createCheckout } = createBillingController(f.db, f.stripe, () => config);
  const res = response();
  await createCheckout({ user: baseUser, body: { plan: "plus", billing: "monthly", price: "attacker_price", customer: "cus_other", success_url: "https://attacker.example", amount: 1 } }, res);
  assert.equal(res.statusCode, 200);
  const { data } = f.calls.checkout[0];
  assert.equal(data.mode, "subscription");
  assert.equal(data.customer, "cus_test");
  assert.deepEqual(data.line_items, [{ price: "price_plus", quantity: 1 }]);
  assert.equal(data.success_url, "http://localhost:5173/checkout/success?session_id={CHECKOUT_SESSION_ID}");
  assert.equal(data.payment_method_types, undefined);
  assert.equal(data.subscription_data.billing_mode.type, "flexible");
  assert.equal(data.origin_context, "web");
  assert.equal(data.integration_identifier, config.integrationIdentifier);
  assert.equal(data.consent_collection, undefined);
  assert.equal(f.user.plan, "free");
});

test("live Checkout always collects terms consent even if explicitly disabled", async () => {
  const f = fixture();
  const res = response();
  await createBillingController(f.db, f.stripe, () => ({ ...config, liveMode: true, requireTermsOfService: false })).createCheckout({ user: baseUser, body: { plan: "plus", requireTermsOfService: false } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(f.calls.checkout[0].data.consent_collection, { terms_of_service: "required" });
});

test("sandbox terms consent can be enabled through server configuration", async () => {
  const f = fixture();
  const res = response();
  await createBillingController(f.db, f.stripe, () => ({ ...config, requireTermsOfService: true })).createCheckout({ user: baseUser, body: { plan: "plus" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(f.calls.checkout[0].data.consent_collection, { terms_of_service: "required" });
});

test("missing Stripe terms configuration returns an actionable error", async (t) => {
  t.mock.method(console, "error", () => {});
  const f = fixture();
  f.stripe.checkout.sessions.create = async () => { throw Object.assign(new Error("You cannot collect consent to your terms of service unless a URL is set in the Stripe Dashboard."), { type: "StripeInvalidRequestError" }); };
  const res = response();
  await createBillingController(f.db, f.stripe, () => config).createCheckout({ user: baseUser, body: { plan: "plus" } }, res);
  assert.equal(res.statusCode, 503);
  assert.match(res.body.message, /Terms of service URL/);
  assert.equal(f.user.stripeCheckoutSessionId, null);
  assert.equal(f.user.plan, "free");
});

test("Free, Enterprise, unconfigured annual and unknown prices cannot create Checkout sessions", async () => {
  const { createCheckout } = createBillingController({}, {}, () => config);
  for (const body of [{ plan: "free" }, { plan: "enterprise" }, { plan: "plus", billing: "annual" }, { plan: "attacker" }]) {
    const res = response();
    await createCheckout({ user: baseUser, body }, res);
    assert.equal(res.statusCode, 400);
  }
});

test("repeated checkout requests reuse one open session", async () => {
  const f = fixture({ stripeCustomerId: null });
  const { createCheckout } = createBillingController(f.db, f.stripe, () => config);
  for (let i = 0; i < 2; i++) {
    const res = response();
    await createCheckout({ user: baseUser, body: { plan: "plus" } }, res);
    assert.equal(res.statusCode, 200);
  }
  assert.equal(f.calls.checkout.length, 1);
  assert.equal(f.user.stripeCustomerId, "cus_new");
});

test("changing the selected plan expires the old open checkout", async () => {
  const f = fixture({ stripeCheckoutSessionId: "cs_test_old" });
  f.sessions.set("cs_test_old", { id: "cs_test_old", status: "open", metadata: { casefyPlan: "plus", casefyBilling: "monthly" } });
  const res = response();
  await createBillingController(f.db, f.stripe, () => config).createCheckout({ user: baseUser, body: { plan: "pro" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(f.calls.expired, ["cs_test_old"]);
});

test("active and delinquent subscriptions prevent duplicate purchases", async (t) => {
  t.mock.method(console, "error", () => {});
  for (const status of ["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]) {
    const f = fixture();
    f.setSubscriptions([subscription({ status })]);
    const res = response();
    await createBillingController(f.db, f.stripe, () => config).createCheckout({ user: baseUser, body: { plan: "plus" } }, res);
    assert.equal(res.statusCode, 409);
    assert.equal(f.calls.checkout.length, 0);
  }
});

test("billing portal sessions belong to the authenticated customer", async () => {
  const f = fixture();
  const res = response();
  await createBillingController(f.db, f.stripe, () => config).createPortal({ user: baseUser, body: { customer: "cus_other", return_url: "https://attacker.example" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(f.calls.portal[0], { customer: "cus_test", return_url: "http://localhost:5173/profile", configuration: "bpc_test" });
});

test("checkout results cannot be read by a different account", async () => {
  const f = fixture();
  f.sessions.set("cs_test_other", { customer: "cus_other", client_reference_id: "99" });
  const res = response();
  await createBillingController(f.db, f.stripe, () => config).checkoutStatus({ user: baseUser, params: { sessionId: "cs_test_other" } }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(f.calls.reads, 0);
});

test("only paid active subscriptions or configured trials grant known paid plans", () => {
  assert.equal(subscriptionState([subscription()], config.prices).plan, "plus");
  assert.equal(subscriptionState([subscription({ items: { data: [{ price: { id: "price_pro" } }] } })], config.prices).plan, "pro");
  for (const status of ["past_due", "unpaid", "canceled", "incomplete", "paused", "incomplete_expired"]) assert.equal(subscriptionState([subscription({ status })], config.prices).plan, "free");
  assert.equal(subscriptionState([subscription({ latest_invoice: { status: "open" } })], config.prices).plan, "free");
  assert.equal(subscriptionState([subscription({ pause_collection: { behavior: "void" } })], config.prices).plan, "free");
  assert.equal(subscriptionState([subscription({ items: { data: [{ price: { id: "price_unknown" } }] } })], config.prices).plan, "free");
  assert.equal(subscriptionState([subscription({ status: "trialing", latest_invoice: null })], config.prices).plan, "plus");
});

test("period-end cancellation retains access until Stripe marks the subscription canceled", () => {
  const scheduled = subscriptionState([subscription({ cancel_at_period_end: true })], config.prices);
  assert.equal(scheduled.plan, "plus");
  assert.equal(scheduled.cancelAtPeriodEnd, true);
  assert.equal(scheduled.subscriptionPeriodEnd.toISOString(), new Date(1800000000000).toISOString());
  assert.equal(subscriptionState([subscription({ status: "canceled" })], config.prices).plan, "free");
});

function webhookRequest(stripe, event) {
  const body = JSON.stringify(event);
  return { body: Buffer.from(body), headers: { "stripe-signature": stripe.webhooks.generateTestHeaderString({ payload: body, secret: config.webhookSecret }) } };
}

test("invalid webhook signatures are rejected before processing", async () => {
  const f = fixture();
  const res = response();
  await createBillingController({}, f.stripe, () => config).webhook({ body: Buffer.from("{}"), headers: { "stripe-signature": "invalid" } }, res);
  assert.equal(res.statusCode, 400);
  const tampered = webhookRequest(f.stripe, { id: "evt_original", livemode: false, type: "invoice.paid" });
  tampered.body = Buffer.from("{}");
  const tamperedResponse = response();
  await createBillingController({}, f.stripe, () => config).webhook(tampered, tamperedResponse);
  assert.equal(tamperedResponse.statusCode, 400);
});

test("signed duplicate and out-of-order events reconcile current Stripe state once", async () => {
  const f = fixture();
  f.setSubscriptions([subscription()]);
  const webhook = createBillingController(f.db, f.stripe, () => config).webhook;
  const event = { id: "evt_unit", type: "customer.subscription.deleted", livemode: false, data: { object: { customer: "cus_test", status: "canceled" } } };
  for (let i = 0; i < 2; i++) {
    const res = response();
    await webhook(webhookRequest(f.stripe, event), res);
    assert.equal(res.statusCode, 200);
  }
  assert.equal(f.user.plan, "plus");
  assert.equal(f.processed.size, 1);
  assert.equal(f.calls.reads, 1);
  f.setSubscriptions([subscription({ status: "canceled" })]);
  await webhook(webhookRequest(f.stripe, { ...event, id: "evt_unit_new", type: "invoice.paid" }), response());
  assert.equal(f.user.plan, "free");
});

test("webhooks for the wrong Stripe mode do not change entitlement", async () => {
  const f = fixture();
  const event = { id: "evt_live", type: "invoice.paid", livemode: true, data: { object: { customer: "cus_test" } } };
  const res = response();
  await createBillingController({}, f.stripe, () => config).webhook(webhookRequest(f.stripe, event), res);
  assert.equal(res.statusCode, 400);
});

test("account deletion closes checkout and cancels subscriptions before removing the user", async () => {
  const f = fixture({ stripeCheckoutSessionId: "cs_test_open" });
  f.sessions.set("cs_test_open", { id: "cs_test_open", status: "open" });
  f.setSubscriptions([subscription()]);
  await createBillingService(f.db, f.stripe, config).deleteAccount(baseUser.id);
  assert.deepEqual(f.calls.expired, ["cs_test_open"]);
  assert.deepEqual(f.calls.canceled, ["sub_test"]);
  assert.equal(f.user, null);
});

test("public billing catalog returns amounts without exposing secrets or price identifiers", async () => {
  const f = fixture();
  const res = response();
  await createBillingController({}, f.stripe, () => config).catalog({}, res);
  assert.deepEqual(res.body.plans.plus.monthly, { amount: 2400, currency: "usd", interval: "month" });
  assert.equal(res.body.plans.plus.annual, undefined);
  assert.equal(res.body.secret, undefined);
});

const annualConfig = {
  ...config,
  prices: { plus: { monthly: "price_plus", annual: "price_plus_annual" }, pro: { monthly: "price_pro", annual: "price_pro_annual" } },
};

test("annual checkout selects each plan's configured yearly price and ignores client discounts", async () => {
  for (const plan of ["plus", "pro"]) {
    const f = fixture();
    const res = response();
    await createBillingController(f.db, f.stripe, () => annualConfig).createCheckout({ user: baseUser, body: { plan, billing: "annual", amount: 1, discount: 100, price: "price_attacker" } }, res);
    assert.equal(res.statusCode, 200);
    const data = f.calls.checkout[0].data;
    assert.deepEqual(data.line_items, [{ price: annualConfig.prices[plan].annual, quantity: 1 }]);
    assert.equal(data.metadata.casefyBilling, "annual");
    assert.equal(data.discounts, undefined);
    assert.ok(data.cancel_url.includes("billing=annual"));
  }
});

test("paid annual subscriptions grant the correct plan through the existing entitlement checks", () => {
  for (const plan of ["plus", "pro"]) {
    const state = subscriptionState([subscription({ items: { data: [{ price: { id: annualConfig.prices[plan].annual }, current_period_end: 1800000000 }] } })], annualConfig.prices);
    assert.equal(state.plan, plan);
  }
});

test("catalog exposes the discounted annual charge and keeps monthly prices unchanged", async () => {
  const f = fixture();
  const prices = { price_plus: [2400, "month"], price_pro: [7900, "month"], price_plus_annual: [23040, "year"], price_pro_annual: [75840, "year"] };
  f.stripe.prices.retrieve = async (id) => ({ active: true, currency: "usd", unit_amount: prices[id][0], recurring: { interval: prices[id][1] } });
  const res = response();
  await createBillingController({}, f.stripe, () => annualConfig).catalog({}, res);
  assert.equal(res.body.plans.plus.monthly.amount, 2400);
  assert.equal(res.body.plans.pro.monthly.amount, 7900);
  assert.deepEqual(res.body.plans.plus.annual, { amount: 23040, currency: "usd", interval: "year" });
  assert.deepEqual(res.body.plans.pro.annual, { amount: 75840, currency: "usd", interval: "year" });
});
