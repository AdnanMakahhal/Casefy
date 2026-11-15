import { publicUserSelect } from "../utils/roles.js";
import { effectiveUser } from "../utils/subscriptions.js";

export const objectId = (value) =>
  typeof value === "string" ? value : value?.id;
const blockingStatuses = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
]);
export const blocksNewSubscription = (subscription) =>
  blockingStatuses.has(subscription.status);

export function subscriptionState(subscriptions, prices) {
  const mapping = Object.entries(prices).flatMap(([plan, intervals]) =>
    Object.values(intervals)
      .filter(Boolean)
      .map((id) => [id, plan]),
  );
  const plans = new Map(mapping);
  const candidates = subscriptions
    .map((subscription) => {
      const plan = subscription.items?.data
        ?.map((item) => plans.get(objectId(item.price)))
        .find(Boolean);
      const paid = subscription.latest_invoice?.status === "paid";
      const entitled =
        plan &&
        (subscription.status === "trialing" ||
          (subscription.status === "active" && paid)) &&
        !subscription.pause_collection;
      return {
        subscription,
        plan: entitled ? plan : "free",
        entitled: Boolean(entitled),
      };
    })
    .sort(
      (a, b) =>
        Number(b.entitled) - Number(a.entitled) ||
        (b.plan === "pro" ? 2 : b.plan === "plus" ? 1 : 0) -
          (a.plan === "pro" ? 2 : a.plan === "plus" ? 1 : 0) ||
        b.subscription.created - a.subscription.created,
    );
  const chosen = candidates[0];
  const subscription = chosen?.subscription;
  const end =
    subscription?.current_period_end ||
    Math.max(
      0,
      ...(subscription?.items?.data || []).map(
        (item) => item.current_period_end || 0,
      ),
    );
  const start =
    subscription?.start_date ||
    subscription?.current_period_start ||
    Math.min(
      ...(subscription?.items?.data || []).map(
        (item) => item.current_period_start || Infinity,
      ),
    );
  return {
    plan: chosen?.plan || "free",
    stripeSubscriptionId: subscription?.id || null,
    subscriptionStatus: subscription?.status || null,
    subscriptionStartedAt:
      Number.isFinite(start) && start > 0 ? new Date(start * 1000) : null,
    subscriptionPeriodEnd: end ? new Date(end * 1000) : null,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
  };
}

export function createBillingService(db, stripe, config) {
  async function withAccount(userId, action) {
    return db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user)
          throw Object.assign(new Error("Account not found"), { status: 401 });
        return action(tx, user);
      },
      { timeout: 45000 },
    );
  }

  async function subscriptionsFor(customerId) {
    const subscriptions = [];
    for await (const subscription of stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
      expand: ["data.latest_invoice"],
    }))
      subscriptions.push(subscription);
    return subscriptions;
  }

  async function reconcile(tx, user) {
    if (!user.stripeCustomerId) return effectiveUser(user);
    const subscriptions = await subscriptionsFor(user.stripeCustomerId);
    return effectiveUser(
      await tx.user.update({
        where: { id: user.id },
        data: subscriptionState(subscriptions, config.prices),
        select: publicUserSelect,
      }),
    );
  }

  async function syncCustomer(customerId, event) {
    const account = await db.user.findUnique({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    if (!account) return null;
    return withAccount(account.id, async (tx, user) => {
      if (
        event &&
        (await tx.stripeWebhookEvent.findUnique({ where: { id: event.id } }))
      )
        return user;
      const updated = await reconcile(tx, user);
      if (event)
        await tx.stripeWebhookEvent.create({
          data: { id: event.id, type: event.type },
        });
      return updated;
    });
  }
  async function deleteAccount(userId) {
    return withAccount(userId, async (tx, user) => {
      if (user.stripeCheckoutSessionId) {
        const session = await stripe.checkout.sessions.retrieve(
          user.stripeCheckoutSessionId,
        );
        if (session.status === "open") {
          try {
            await stripe.checkout.sessions.expire(session.id);
          } catch (error) {
            if (
              (await stripe.checkout.sessions.retrieve(session.id)).status ===
              "open"
            )
              throw error;
          }
        }
      }
      const subscriptions = user.stripeCustomerId
        ? await subscriptionsFor(user.stripeCustomerId)
        : [];
      for (const subscription of subscriptions.filter(blocksNewSubscription)) {
        await stripe.subscriptions.cancel(
          subscription.id,
          {},
          { idempotencyKey: `casefy-delete-${user.id}-${subscription.id}` },
        );
      }
      return tx.user.delete({ where: { id: user.id } });
    });
  }
  return {
    withAccount,
    subscriptionsFor,
    reconcile,
    syncCustomer,
    deleteAccount,
  };
}
