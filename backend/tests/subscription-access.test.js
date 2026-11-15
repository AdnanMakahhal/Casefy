import assert from "node:assert/strict";
import { test } from "node:test";
import { accessSchedule, effectiveUser } from "../utils/subscriptions.js";
import { canAddWorkspace } from "../utils/plans.js";
import { createStaffController } from "../controllers/staffController.js";
import { createBillingService } from "../services/billingService.js";
import { createBillingController } from "../controllers/billingController.js";
import { planAction } from "../../frontend/src/features/authentication/plans.js";

const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const schedule = { complimentaryPlan: "pro", complimentaryStartsAt: new Date("2026-11-15T10:00:00Z"), complimentaryEndsAt: new Date("2026-11-29T10:00:00Z") };
const staff = { userId: 1, user: { id: 1, role: "admin" } };

test("complimentary presets produce exact weeks and clamp calendar months", () => {
  const startsAt = "2026-11-15T10:00:00Z";
  assert.equal(accessSchedule({ plan: "pro", startsAt, duration: "week" }).complimentaryEndsAt.toISOString(), "2026-11-22T10:00:00.000Z");
  assert.equal(accessSchedule({ plan: "pro", startsAt, duration: "14days" }).complimentaryEndsAt.toISOString(), "2026-11-29T10:00:00.000Z");
  assert.equal(accessSchedule({ plan: "plus", startsAt: "2026-01-31T10:00:00Z", duration: "month" }).complimentaryEndsAt.toISOString(), "2026-02-28T10:00:00.000Z");
  assert.equal(accessSchedule({ plan: "plus", startsAt: "2028-01-31T10:00:00Z", duration: "month" }).complimentaryEndsAt.toISOString(), "2028-02-29T10:00:00.000Z");
});

test("subscription dates reject impossible calendars, missing timezones, and reversed periods", () => {
  for (const values of [
    { startsAt: "2026-02-30T10:00:00Z", duration: "week" },
    { startsAt: "2026-11-15T24:00:00Z", duration: "week" },
    { startsAt: "2026-11-15T10:00", duration: "week" },
    { startsAt: "2026-11-15T10:00:00Z", duration: "custom", endsAt: "2026-11-15T10:00:00Z" },
    { startsAt: "2026-11-15T10:00:00Z", duration: "custom", endsAt: "2026-11-14T10:00:00Z" },
    { duration: "forever" },
  ]) assert.throws(() => accessSchedule({ plan: "pro", ...values }));
  assert.throws(() => accessSchedule({ plan: "free", duration: "week" }));
});

test("complimentary access begins at its start and expires exactly at its end", () => {
  const user = { plan: "free", projectLimit: 300, monthlyCreditLimit: 50000, ...schedule };
  const before = effectiveUser(user, new Date("2026-11-15T09:59:59Z"));
  assert.equal(before.plan, "free"); assert.equal(before.complimentaryStatus, "scheduled"); assert.equal(before.projectLimit, null);
  const active = effectiveUser(user, schedule.complimentaryStartsAt);
  assert.equal(active.plan, "pro"); assert.equal(active.basePlan, "free"); assert.equal(active.projectLimit, 300);
  const expired = effectiveUser(user, schedule.complimentaryEndsAt);
  assert.equal(expired.plan, "free"); assert.equal(expired.complimentaryStatus, "expired"); assert.equal(expired.monthlyCreditLimit, null);
  assert.equal(user.plan, "free");
});

test("a temporary grant cannot reduce paid access and serialization is idempotent", () => {
  const user = { plan: "enterprise", ...schedule };
  const now = new Date("2026-11-20T10:00:00Z");
  const active = effectiveUser(user, now); assert.equal(active.plan, "enterprise");
  assert.equal(effectiveUser(active, now).basePlan, "enterprise");
  assert.equal(effectiveUser(user, new Date("2026-12-01T10:00:00Z")).plan, "enterprise");
});

test("complimentary access grants paid workspace permissions only within its active period", () => {
  assert.equal(canAddWorkspace({ plan: "free", complimentaryPlan: "plus", complimentaryStartsAt: new Date(Date.now() - 1000), complimentaryEndsAt: new Date(Date.now() + 60000) }), true);
  assert.equal(canAddWorkspace({ plan: "free", complimentaryPlan: "plus", complimentaryStartsAt: new Date(Date.now() - 60000), complimentaryEndsAt: new Date(Date.now() - 1) }), false);
});

test("staff can grant dated manual subscriptions without charging or creating Stripe billing", async () => {
  let saved;
  const controller = createStaffController({ user: { findUnique: async () => ({ role: "student", stripeSubscriptionId: null }), update: async ({ data }) => { saved = data; return { id: 5, ...data }; } } }, null);
  const result = response();
  await controller.access({ ...staff, params: { id: "5" }, body: { plan: "enterprise", duration: "14days" } }, result);
  assert.equal(result.statusCode, 200); assert.equal(saved.plan, "free"); assert.equal(saved.complimentaryPlan, "enterprise"); assert.equal(result.body.user.plan, "enterprise");
});

test("grant dates do not mutate a paid Stripe plan, and managers cannot change staff access", async () => {
  let saved;
  const controller = createStaffController({ user: { findUnique: async () => ({ role: "admin", stripeSubscriptionId: "sub_existing", subscriptionStatus: "active" }), update: async ({ data }) => { saved = data; return { id: 5, plan: "plus", ...data }; } } }, null);
  const denied = response(); await controller.access({ user: { role: "manager" }, params: { id: "5" }, body: { plan: "pro", duration: "week" } }, denied); assert.equal(denied.statusCode, 403);
  const result = response(); await controller.access({ ...staff, params: { id: "5" }, body: { plan: "pro", duration: "week" } }, result); assert.equal(result.statusCode, 200); assert.equal(saved.plan, undefined); assert.equal(saved.stripeSubscriptionId, undefined);
});

test("revoking a manual complimentary subscription clears its dates and temporary limits", async () => {
  let saved;
  const controller = createStaffController({ user: { findUnique: async () => ({ role: "student", complimentaryPlan: "pro" }), update: async ({ data }) => { saved = data; return data; } } }, null);
  const result = response(); await controller.access({ ...staff, params: { id: "5" }, body: { remove: true } }, result);
  assert.equal(result.statusCode, 200); assert.equal(saved.complimentaryPlan, null); assert.equal(saved.complimentaryEndsAt, null); assert.equal(saved.plan, "free"); assert.equal(saved.monthlyCreditLimit, null);
});

test("Stripe reconciliation preserves temporary grants and stores only the paid plan", async () => {
  const user = { id: 5, plan: "free", stripeCustomerId: "cus_owned", ...schedule };
  let data;
  const db = { user: { update: async (args) => { data = args.data; return { ...user, ...data, complimentaryStartsAt: new Date(Date.now() - 1000), complimentaryEndsAt: new Date(Date.now() + 60000) }; } } };
  const stripe = { subscriptions: { list: () => (async function* () { yield { id: "sub_owned", status: "active", created: 1, start_date: 1700000000, latest_invoice: { status: "paid" }, items: { data: [{ price: { id: "price_plus" }, current_period_end: 1900000000 }] } }; })() } };
  const result = await createBillingService(db, stripe, { prices: { plus: { monthly: "price_plus" } } }).reconcile(db, user);
  assert.equal(data.plan, "plus"); assert.equal(data.complimentaryPlan, undefined); assert.equal(result.plan, "pro"); assert.equal(result.basePlan, "plus"); assert.equal(result.subscriptionStartedAt.getTime(), 1700000000000);
});

function upgradeFixture(subscriptionOverrides = {}, userOverrides = {}) {
  const user = { id: 5, plan: "plus", stripeCustomerId: "cus_owned", ...userOverrides };
  const subscription = { id: "sub_owned", customer: "cus_owned", status: "active", created: 1, latest_invoice: { status: "paid" }, items: { data: [{ id: "si_owned", price: { id: "price_plus" }, quantity: 1 }] }, ...subscriptionOverrides };
  let session;
  const tx = { $queryRaw: async () => [], user: { findUnique: async () => user } };
  const db = { $transaction: async (action) => action(tx) };
  const stripe = { subscriptions: { list: () => (async function* () { yield subscription; })() }, billingPortal: { sessions: { create: async (data) => { session = data; return { url: "https://billing.stripe.com/confirm-test" }; } } } };
  const config = { origin: "http://localhost:5173", portalConfiguration: "bpc_owned", prices: { plus: { monthly: "price_plus" }, pro: { monthly: "price_pro", annual: "price_pro_year" } } };
  return { controller: createBillingController(db, stripe, () => config), get session() { return session; } };
}

test("upgrades create a customer-owned Stripe confirmation flow with trusted prices", async () => {
  const fixture = upgradeFixture(); const result = response();
  await fixture.controller.createUpgrade({ user: { id: 5 }, body: { plan: "pro", billing: "annual", customer: "cus_attacker", price: "price_attacker" } }, result);
  assert.equal(result.statusCode, 200); assert.equal(fixture.session.customer, "cus_owned"); assert.equal(fixture.session.flow_data.type, "subscription_update_confirm");
  assert.deepEqual(fixture.session.flow_data.subscription_update_confirm, { subscription: "sub_owned", items: [{ id: "si_owned", price: "price_pro_year", quantity: 1 }] });
  assert.equal(fixture.session.flow_data.after_completion.redirect.return_url, "http://localhost:5173/profile?upgraded=1");
});

test("same-plan, unhealthy, canceled, or foreign subscriptions cannot be upgraded", async () => {
  for (const [overrides, plan, expected] of [[{}, "plus", 409], [{ status: "past_due" }, "pro", 409], [{ cancel_at_period_end: true }, "pro", 409], [{ customer: "cus_other" }, "pro", 409], [{ items: { data: [] } }, "pro", 409]]) {
    const fixture = upgradeFixture(overrides), result = response(); await fixture.controller.createUpgrade({ user: { id: 5 }, body: { plan } }, result); assert.equal(result.statusCode, expected); assert.equal(fixture.session, undefined);
  }
  const result = response(); await upgradeFixture().controller.createUpgrade({ user: { id: 5 }, body: { plan: "attacker" } }, result); assert.equal(result.statusCode, 400);
});

test("pricing distinguishes disabled current/included plans from upgrades", () => {
  assert.equal(planAction({ plan: "plus" }, "plus"), "current");
  assert.equal(planAction({ plan: "pro" }, "plus"), "included");
  assert.equal(planAction({ plan: "plus" }, "pro"), "upgrade");
  assert.equal(planAction({ plan: "free" }, "plus"), "start");
  assert.equal(planAction({ plan: "pro" }, "enterprise"), "contact");
});

test("Checkout also prevents purchasing a plan already covered by an active grant", async () => {
  const user = { id: 5, plan: "free", complimentaryPlan: "pro", complimentaryStartsAt: new Date(Date.now() - 1000), complimentaryEndsAt: new Date(Date.now() + 60000) };
  const tx = { $queryRaw: async () => [], user: { findUnique: async () => user } };
  const controller = createBillingController({ $transaction: async (action) => action(tx) }, {}, () => ({ prices: { plus: { monthly: "price_plus" } } }));
  const result = response(); await controller.createCheckout({ user: { id: 5 }, body: { plan: "plus" } }, result); assert.equal(result.statusCode, 409);
});
