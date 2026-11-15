import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createPayPalController,
  validatePayPalPlan,
  paypalPaidThrough,
} from "../src/controllers/paypalController.js";
import { effectiveUser } from "../src/utils/subscriptions.js";
import {
  paypalBlocksCheckout,
  suppliedPayPalClientId,
  suppliedPayPalPlanId,
} from "../src/utils/paypal.js";
import { createBillingController } from "../src/controllers/billingController.js";

const response = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});
const config = {
  clientId: suppliedPayPalClientId,
  secret: "test-secret-never-expose",
  webhookId: "wh_test",
  environment: "sandbox",
  origin: "http://localhost:5173",
  plans: { plus: { monthly: "P-PLUS" }, pro: { monthly: "P-PRO" } },
};
const plan = () => ({
  status: "ACTIVE",
  billing_cycles: [
    {
      tenure_type: "REGULAR",
      total_cycles: 0,
      frequency: { interval_unit: "MONTH", interval_count: 1 },
      pricing_scheme: { fixed_price: { currency_code: "USD", value: "24.00" } },
    },
  ],
});

function fixture() {
  let user = { id: 5, name: "Buyer", plan: "free" },
    providerStatus = "APPROVAL_PENDING",
    paid = false,
    signature = "SUCCESS";
  const records = new Map(),
    calls = [];
  const tx = {
    $queryRaw: async () => [],
    user: {
      findUnique: async () => user,
      update: async ({ data }) => {
        user = { ...user, ...data };
        return user;
      },
    },
    payPalCheckout: {
      findFirst: async () => [...records.values()].find((record) => !record.subscriptionId),
      findUnique: async ({ where }) =>
        where.id
          ? records.get(where.id)
          : [...records.values()].find((record) => record.subscriptionId === where.subscriptionId),
      create: async ({ data }) => {
        const record = { ...data, status: "CREATED" };
        records.set(data.id, record);
        return record;
      },
      update: async ({ where, data }) => {
        const record = { ...records.get(where.id), ...data };
        records.set(where.id, record);
        return record;
      },
    },
  };
  const db = { ...tx, $transaction: async (action) => action(tx) };
  const gateway = {
    call: async (path, method, body, requestId) => {
      calls.push({ path, method, body, requestId });
      if (path.startsWith("/v1/billing/plans/")) return plan();
      if (path === "/v1/billing/subscriptions")
        return { id: "I-OWNED", status: "APPROVAL_PENDING" };
      if (path.endsWith("/cancel")) {
        providerStatus = "CANCELLED";
        return {};
      }
      if (path === "/v1/notifications/verify-webhook-signature")
        return { verification_status: signature };
      return {
        id: "I-OWNED",
        status: providerStatus,
        custom_id: [...records.keys()][0],
        plan_id: "P-PLUS",
        start_time: new Date().toISOString(),
        billing_info: paid
          ? {
              last_payment: {
                time: new Date().toISOString(),
                amount: { currency_code: "USD", value: "24.00" },
              },
            }
          : {},
      };
    },
  };
  return {
    db,
    calls,
    records,
    controller: createPayPalController(
      db,
      null,
      () => config,
      () => gateway,
    ),
    get user() {
      return user;
    },
    approve() {
      providerStatus = "ACTIVE";
    },
    pay() {
      providerStatus = "ACTIVE";
      paid = true;
    },
    invalidSignature() {
      signature = "FAILURE";
    },
  };
}

test("public PayPal configuration preserves the supplied IDs but never exposes the server secret", async () => {
  const result = response();
  await fixture().controller.config({ query: { plan: "plus", billing: "monthly" } }, result);
  assert.equal(result.body.clientId, suppliedPayPalClientId);
  assert.equal(result.body.planId, "P-PLUS");
  assert.equal(result.body.available, true);
  assert.ok(!JSON.stringify(result.body).includes(config.secret));
  const missing = response();
  await fixture().controller.config({ query: { plan: "pro", billing: "annual" } }, missing);
  assert.equal(missing.body.available, false);
  assert.equal(missing.body.planId, suppliedPayPalPlanId);
});

test("a single PayPal plan cannot silently charge a different tier or billing period", () => {
  validatePayPalPlan(plan(), "plus", "monthly");
  assert.throws(() => validatePayPalPlan(plan(), "pro", "monthly"));
  assert.throws(() => validatePayPalPlan(plan(), "plus", "annual"));
  const extra = plan();
  extra.payment_preferences = { setup_fee: { value: "5.00" } };
  assert.throws(() => validatePayPalPlan(extra, "plus", "monthly"));
});

test("server creation binds subscriptions to a persisted account-owned idempotent checkout", async () => {
  const f = fixture(),
    result = response();
  await f.controller.create(
    { userId: 5, body: { plan: "plus", billing: "monthly", plan_id: "P-ATTACKER", amount: 1 } },
    result,
  );
  assert.equal(result.statusCode, 201);
  assert.equal(result.body.subscriptionId, "I-OWNED");
  assert.equal(f.user.plan, "free");
  const created = f.calls.find((call) => call.path === "/v1/billing/subscriptions");
  assert.equal(created.body.plan_id, "P-PLUS");
  assert.equal(created.requestId, created.body.custom_id);
  assert.equal(f.records.get(created.body.custom_id).userId, 5);
  assert.equal(paypalBlocksCheckout(f.user), true);
});

test("browser approval without a verified payment does not grant paid access", async () => {
  const f = fixture();
  await f.controller.create({ userId: 5, body: { plan: "plus", billing: "monthly" } }, response());
  f.approve();
  const result = response();
  await f.controller.verify({ userId: 5, body: { subscriptionId: "I-OWNED" } }, result);
  assert.equal(result.statusCode, 202);
  assert.equal(result.body.verified, false);
  assert.equal(result.body.user.plan, "free");
});

test("verified payment activates only the owned plan through its paid period", async () => {
  const f = fixture();
  await f.controller.create({ userId: 5, body: { plan: "plus", billing: "monthly" } }, response());
  f.pay();
  const result = response();
  await f.controller.verify(
    { userId: 5, body: { subscriptionId: "I-OWNED", plan: "enterprise" } },
    result,
  );
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.user.plan, "plus");
  assert.ok(result.body.user.paypalPeriodEnd > new Date());
  assert.equal(f.user.plan, "free");
  assert.equal(
    effectiveUser(f.user, new Date(result.body.user.paypalPeriodEnd.getTime() + 1)).plan,
    "free",
  );
});

test("another subscription reference cannot be claimed", async () => {
  const f = fixture();
  const result = response();
  await f.controller.verify({ userId: 5, body: { subscriptionId: "I-OTHER" } }, result);
  assert.equal(result.statusCode, 404);
});

test("failed renewals cannot extend access just by moving the next billing time forward", () => {
  const end = paypalPaidThrough(
    {
      billing_info: {
        last_payment: { time: "2026-01-31T10:00:00Z" },
        next_billing_time: "2026-12-31T10:00:00Z",
      },
    },
    "monthly",
  );
  assert.equal(end.toISOString(), "2026-02-28T10:00:00.000Z");
});

test("canceling PayPal stops renewals and retains only already verified paid access", async () => {
  const f = fixture();
  await f.controller.create({ userId: 5, body: { plan: "plus", billing: "monthly" } }, response());
  f.pay();
  await f.controller.verify({ userId: 5, body: { subscriptionId: "I-OWNED" } }, response());
  const result = response();
  await f.controller.cancel({ userId: 5 }, result);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.user.paypalStatus, "CANCELLED");
  assert.equal(result.body.user.plan, "plus");
  assert.equal(paypalBlocksCheckout(f.user), false);
});

test("unverified PayPal webhooks cannot mutate subscription access", async () => {
  const f = fixture();
  f.invalidSignature();
  const result = response();
  await f.controller.webhook(
    {
      headers: {},
      body: { event_type: "BILLING.SUBSCRIPTION.ACTIVATED", resource: { id: "I-FAKE" } },
    },
    result,
  );
  assert.equal(result.statusCode, 400);
  assert.equal(f.user.plan, "free");
});

test("Stripe cannot create a second subscription while PayPal is active or pending", async () => {
  const tx = {
    $queryRaw: async () => [],
    user: {
      findUnique: async () => ({
        id: 5,
        plan: "free",
        paypalSubscriptionId: "I-OWNED",
        paypalStatus: "APPROVAL_PENDING",
      }),
    },
  };
  const controller = createBillingController(
    { $transaction: async (action) => action(tx) },
    {},
    () => ({ prices: { plus: { monthly: "price_plus" } } }),
  );
  const result = response();
  await controller.createCheckout({ user: { id: 5 }, body: { plan: "plus" } }, result);
  assert.equal(result.statusCode, 409);
});
