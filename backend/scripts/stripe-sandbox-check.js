import "../src/config.js";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../src/db.js";
import { stripe } from "../src/utils/stripe.js";
import billingRoutes from "../src/routes/billingRoutes.js";
import authRoutes from "../src/routes/authRoutes.js";
import { webhook } from "../src/controllers/billingController.js";

if (!/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || ""))
  throw new Error("This check only runs in a Stripe sandbox");
if (!process.env.STRIPE_WEBHOOK_SECRET)
  throw new Error(
    "Run npm run stripe:listen first to configure the signing secret",
  );
const app = express();
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  webhook,
);
app.use(express.json());
app.use("/api/billing", billingRoutes);
app.use("/api/auth", authRoutes);
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const origin = `http://127.0.0.1:${server.address().port}`;
const password = randomUUID();
let user;
let other;
let customerId;
const eventIds = [];

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${origin}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, data: await res.json() };
}
async function sendEvent(type) {
  const id = `evt_casefy_smoke_${randomUUID().replaceAll("-", "")}`;
  eventIds.push(id);
  const payload = JSON.stringify({
    id,
    type,
    livemode: false,
    data: { object: { customer: customerId } },
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });
  const send = () =>
    fetch(`${origin}/api/billing/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature,
      },
      body: payload,
    });
  assert.equal((await send()).status, 200);
  assert.equal((await send()).status, 200);
}

try {
  const create = (name) =>
    prisma.user.create({
      data: {
        name,
        email: `stripe-smoke-${randomUUID()}@example.com`,
        passwordHash: bcrypt.hashSync(password, 4),
        role: "student",
        workspaceName: "Temporary billing test",
      },
    });
  user = await create("Temporary Billing Test");
  other = await create("Other Temporary Billing Test");
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  const otherToken = jwt.sign({ userId: other.id }, process.env.JWT_SECRET);
  assert.equal(
    (
      await request("/api/billing/checkout", {
        method: "POST",
        body: { plan: "plus" },
      })
    ).status,
    401,
  );
  const catalog = await request("/api/billing/plans");
  assert.equal(catalog.data.plans.plus.monthly.amount, 2400);
  assert.equal(catalog.data.plans.pro.monthly.amount, 7900);
  const first = await request("/api/billing/checkout", {
    method: "POST",
    token,
    body: { plan: "plus", billing: "monthly" },
  });
  assert.equal(first.status, 200, first.data.message);
  assert.ok(first.data.url.startsWith("https://checkout.stripe.com/"));
  user = await prisma.user.findUnique({ where: { id: user.id } });
  customerId = user.stripeCustomerId;
  const second = await request("/api/billing/checkout", {
    method: "POST",
    token,
    body: { plan: "plus" },
  });
  assert.equal(second.data.url, first.data.url);
  const status = await request(
    `/api/billing/checkout/${user.stripeCheckoutSessionId}`,
    { token },
  );
  assert.equal(status.data.user.plan, "free");
  assert.equal(
    (
      await request(`/api/billing/checkout/${user.stripeCheckoutSessionId}`, {
        token: otherToken,
      })
    ).status,
    404,
  );
  await stripe.checkout.sessions.expire(user.stripeCheckoutSessionId);
  const paymentMethod = await stripe.paymentMethods.attach("pm_card_visa", {
    customer: customerId,
  });
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: process.env.STRIPE_PRICE_PLUS_MONTHLY }],
    default_payment_method: paymentMethod.id,
    billing_mode: { type: "flexible" },
    payment_behavior: "error_if_incomplete",
    metadata: { casefyUserId: String(user.id), app: "casefy-smoke-test" },
  });
  assert.equal(subscription.status, "active");
  await sendEvent("invoice.paid");
  assert.equal(
    (await prisma.user.findUnique({ where: { id: user.id } })).plan,
    "plus",
  );
  const duplicateSubscription = await request("/api/billing/checkout", {
    method: "POST",
    token,
    body: { plan: "pro" },
  });
  assert.equal(duplicateSubscription.status, 409);
  const portal = await request("/api/billing/portal", {
    method: "POST",
    token,
  });
  assert.equal(portal.status, 200);
  assert.ok(portal.data.url.startsWith("https://billing.stripe.com/"));
  await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true,
  });
  await sendEvent("customer.subscription.updated");
  const scheduled = await prisma.user.findUnique({ where: { id: user.id } });
  assert.equal(scheduled.plan, "plus");
  assert.equal(scheduled.cancelAtPeriodEnd, true);
  await stripe.subscriptions.cancel(subscription.id);
  await sendEvent("customer.subscription.deleted");
  assert.equal(
    (await prisma.user.findUnique({ where: { id: user.id } })).plan,
    "free",
  );
  const another = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: process.env.STRIPE_PRICE_PRO_MONTHLY }],
    default_payment_method: paymentMethod.id,
    billing_mode: { type: "flexible" },
    payment_behavior: "error_if_incomplete",
  });
  const deleted = await request("/api/auth/me", {
    method: "DELETE",
    token,
    body: { currentPassword: password },
  });
  assert.equal(deleted.status, 200, deleted.data.message);
  assert.equal(
    (await stripe.subscriptions.retrieve(another.id)).status,
    "canceled",
  );
  assert.equal(await prisma.user.findUnique({ where: { id: user.id } }), null);
  console.log(
    "Stripe sandbox check passed: hosted Checkout, session reuse, account isolation, paid plan sync, signed duplicate webhooks, customer portal, scheduled cancellation, downgrade, and subscription cancellation on account deletion.",
  );
} finally {
  if (user?.id && !customerId)
    customerId = (await prisma.user.findUnique({ where: { id: user.id } }))
      ?.stripeCustomerId;
  if (customerId) await stripe.customers.del(customerId);
  await prisma.stripeWebhookEvent.deleteMany({
    where: { id: { in: eventIds } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [user?.id, other?.id].filter(Boolean) } },
  });
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
  console.log("Temporary sandbox customer and test accounts cleaned up.");
}
