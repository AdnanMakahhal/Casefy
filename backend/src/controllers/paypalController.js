import { randomUUID } from "node:crypto";
import prisma from "../db.js";
import { stripe as stripeClient, billingConfig } from "../utils/stripe.js";
import {
  paypalConfig,
  createPayPalClient,
  paypalBlocksCheckout,
  suppliedPayPalPlanId,
} from "../utils/paypal.js";
import { createBillingService, blocksNewSubscription } from "../services/billingService.js";
import { effectiveUser, planRank } from "../utils/subscriptions.js";
import { publicUserSelect } from "../utils/roles.js";

const amounts = { plus: { monthly: 2400, annual: 23040 }, pro: { monthly: 7900, annual: 75840 } };
const terminal = new Set(["CANCELLED", "EXPIRED"]);
const failure = (res, error) => {
  console.error("PayPal request failed:", error.code || error.name);
  return res.status(error.status || 502).json({
    message: error.status
      ? error.message
      : "PayPal could not complete this request. Please retry or contact support.",
  });
};
const error = (message, status = 409) => Object.assign(new Error(message), { status });
export function validatePayPalPlan(plan, tier, billing) {
  const cycles = plan.billing_cycles || [];
  const regular = cycles.filter((cycle) => cycle.tenure_type === "REGULAR");
  const cycle = regular[0];
  const price = cycle?.pricing_scheme?.fixed_price;
  const frequency = cycle?.frequency;
  const correctInterval =
    billing === "monthly"
      ? frequency?.interval_unit === "MONTH" && frequency.interval_count === 1
      : (frequency?.interval_unit === "YEAR" && frequency.interval_count === 1) ||
        (frequency?.interval_unit === "MONTH" && frequency.interval_count === 12);
  if (
    plan.status !== "ACTIVE" ||
    regular.length !== 1 ||
    cycles.length !== 1 ||
    !correctInterval ||
    cycle.total_cycles !== 0 ||
    price?.currency_code !== "USD" ||
    Math.round(Number(price?.value) * 100) !== amounts[tier]?.[billing] ||
    Number(plan.payment_preferences?.setup_fee?.value || 0) !== 0
  )
    throw error(
      "The PayPal plan does not match this checkout's price and billing period. Please use Stripe or contact support.",
      409,
    );
}

export function paypalPaidThrough(subscription, billing) {
  const paidAt = new Date(subscription.billing_info?.last_payment?.time || "");
  if (!Number.isFinite(paidAt.getTime()) || paidAt.getTime() > Date.now() + 300000) return null;
  const end = new Date(paidAt),
    day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + (billing === "annual" ? 12 : 1));
  end.setUTCDate(
    Math.min(day, new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate()),
  );
  const next = new Date(subscription.billing_info?.next_billing_time || "");

  return Number.isFinite(next.getTime()) && next > paidAt && next < end ? next : end;
}

export async function reconcilePayPal(
  tx,
  user,
  gateway,
  subscriptionId = user.paypalSubscriptionId,
) {
  if (!subscriptionId) return effectiveUser(user);
  const checkout = await tx.payPalCheckout.findUnique({ where: { subscriptionId } });
  if (!checkout || checkout.userId !== user.id)
    throw error("PayPal subscription not found for this account.", 404);
  const subscription = await gateway.call(
    `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
  );
  if (subscription.custom_id !== checkout.id || subscription.plan_id !== checkout.paypalPlanId)
    throw error("PayPal subscription verification failed.", 409);
  const payment = subscription.billing_info?.last_payment;
  const paid =
    payment?.amount?.currency_code === "USD" &&
    Math.round(Number(payment.amount.value) * 100) === amounts[checkout.plan]?.[checkout.billing] &&
    Number.isFinite(Date.parse(payment.time));
  let periodEnd = user.paypalPeriodEnd;
  if (paid) periodEnd = paypalPaidThrough(subscription, checkout.billing) || periodEnd;
  const started = new Date(subscription.start_time || "");
  await tx.payPalCheckout.update({
    where: { id: checkout.id },
    data: { status: subscription.status },
  });

  if (user.paypalSubscriptionId && user.paypalSubscriptionId !== subscriptionId)
    return effectiveUser(user);
  const updated = await tx.user.update({
    where: { id: user.id },
    data: {
      paypalSubscriptionId: subscription.id,
      paypalStatus: subscription.status,
      paypalPlan: checkout.plan,
      paypalBilling: checkout.billing,
      paypalStartedAt: Number.isFinite(started.getTime()) ? started : user.paypalStartedAt,
      paypalPeriodEnd: periodEnd || null,
    },
    select: publicUserSelect,
  });
  return effectiveUser(updated);
}

export function createPayPalController(
  db = prisma,
  stripe = stripeClient,
  getConfig = paypalConfig,
  makeGateway = createPayPalClient,
) {
  function configured(config, plan, billing) {
    if (!config.secret || !config.webhookId || !config.plans[plan]?.[billing])
      throw error(
        "PayPal checkout is not available for this plan yet. Please use Stripe or contact support.",
        503,
      );
  }
  return {
    async config(req, res) {
      const config = getConfig();
      if (
        !["plus", "pro"].includes(req.query.plan) ||
        !["monthly", "annual"].includes(req.query.billing)
      )
        return res.status(400).json({ message: "Invalid checkout plan." });
      const planId = config.plans[req.query.plan]?.[req.query.billing];
      return res.json({
        clientId: config.clientId,
        planId: planId || suppliedPayPalPlanId,
        available: Boolean(config.secret && config.webhookId && planId),
        environment: config.environment,
      });
    },
    async create(req, res) {
      const { plan, billing } = req.body || {};
      if (!["plus", "pro"].includes(plan) || !["monthly", "annual"].includes(billing))
        return res.status(400).json({ message: "Choose a paid plan and billing period." });
      const config = getConfig();
      try {
        configured(config, plan, billing);
        const gateway = makeGateway(config);
        const paypalPlanId = config.plans[plan][billing];
        validatePayPalPlan(
          await gateway.call(`/v1/billing/plans/${encodeURIComponent(paypalPlanId)}`),
          plan,
          billing,
        );
        const service = createBillingService(db, stripe, billingConfig());
        const subscriptionId = await service.withAccount(req.userId, async (tx, user) => {
          if (paypalBlocksCheckout(user)) {
            const current = await reconcilePayPal(tx, user, gateway);
            if (current.paypalStatus === "APPROVAL_PENDING") {
              const existing = await tx.payPalCheckout.findUnique({
                where: { subscriptionId: current.paypalSubscriptionId },
              });
              if (existing.plan === plan && existing.billing === billing)
                return current.paypalSubscriptionId;
            }
            if (paypalBlocksCheckout(current))
              throw error(
                "Manage or cancel your existing PayPal subscription before starting another.",
              );
          }
          if (user.paypalPeriodEnd && new Date(user.paypalPeriodEnd) > new Date())
            throw error(
              "Your previously paid PayPal access has not ended yet. Contact support before starting a different PayPal subscription.",
            );
          if (planRank[effectiveUser(user).plan] >= planRank[plan])
            throw error("This plan is already included in your current access.");
          if (user.stripeCustomerId) {
            if (!stripe)
              throw error("Billing verification is unavailable. Please try again later.", 503);
            if ((await service.subscriptionsFor(user.stripeCustomerId)).some(blocksNewSubscription))
              throw error("Use Manage billing to change your existing Stripe subscription.");
          }
          if (user.stripeCheckoutSessionId) {
            const previous = await stripe.checkout.sessions.retrieve(user.stripeCheckoutSessionId);
            if (previous.status === "open") await stripe.checkout.sessions.expire(previous.id);
            else if (previous.status === "complete")
              throw error(
                "Your Stripe payment is being processed. Refresh your billing status first.",
              );
          }
          let checkout = await tx.payPalCheckout.findFirst({
            where: {
              userId: user.id,
              plan,
              billing,
              paypalPlanId,
              subscriptionId: null,
              status: "CREATED",
            },
            orderBy: { createdAt: "desc" },
          });
          if (!checkout)
            checkout = await tx.payPalCheckout.create({
              data: { id: randomUUID(), userId: user.id, plan, billing, paypalPlanId },
            });
          const result = await gateway.call(
            "/v1/billing/subscriptions",
            "POST",
            {
              plan_id: paypalPlanId,
              custom_id: checkout.id,
              application_context: {
                brand_name: "Casefy",
                user_action: "SUBSCRIBE_NOW",
                return_url: `${config.origin}/profile`,
                cancel_url: `${config.origin}/checkout?plan=${plan}&billing=${billing}`,
              },
            },
            checkout.id,
          );
          if (!/^I-[A-Z0-9]+$/i.test(result.id || ""))
            throw error("PayPal returned an invalid subscription reference.", 502);
          await tx.payPalCheckout.update({
            where: { id: checkout.id },
            data: { subscriptionId: result.id, status: result.status || "APPROVAL_PENDING" },
          });
          await tx.user.update({
            where: { id: user.id },
            data: {
              paypalSubscriptionId: result.id,
              paypalStatus: result.status || "APPROVAL_PENDING",
              paypalPlan: plan,
              paypalBilling: billing,
              paypalPeriodEnd: null,
              paypalStartedAt: null,
            },
          });
          return result.id;
        });
        return res.status(201).json({ subscriptionId });
      } catch (err) {
        return failure(res, err);
      }
    },
    async verify(req, res) {
      const id = req.body?.subscriptionId;
      if (!/^I-[A-Z0-9]+$/i.test(id || ""))
        return res.status(400).json({ message: "Invalid PayPal subscription reference." });
      try {
        const config = getConfig();
        const service = createBillingService(db, stripe, billingConfig());
        const user = await service.withAccount(req.userId, async (tx, account) => {
          if (account.paypalSubscriptionId !== id)
            throw error("PayPal subscription not found for this account.", 404);
          return reconcilePayPal(tx, account, makeGateway(config));
        });
        const paid =
          ["ACTIVE", "CANCELLED"].includes(user.paypalStatus) &&
          user.paypalPeriodEnd &&
          new Date(user.paypalPeriodEnd) > new Date();
        return res.status(paid ? 200 : 202).json({
          verified: Boolean(paid),
          user,
          message: paid
            ? "PayPal subscription verified."
            : "PayPal approval received. Payment confirmation is pending; your access will update after verification.",
        });
      } catch (err) {
        return failure(res, err);
      }
    },
    async cancel(req, res) {
      try {
        const config = getConfig();
        const gateway = makeGateway(config);
        const user = await createBillingService(db, stripe, billingConfig()).withAccount(
          req.userId,
          async (tx, account) => {
            if (!account.paypalSubscriptionId) throw error("No PayPal subscription found.", 404);
            const current = await reconcilePayPal(tx, account, gateway);
            if (!terminal.has(current.paypalStatus))
              await gateway.call(
                `/v1/billing/subscriptions/${encodeURIComponent(account.paypalSubscriptionId)}/cancel`,
                "POST",
                { reason: "Cancellation requested by the account owner in Casefy" },
              );
            return reconcilePayPal(tx, account, gateway);
          },
        );
        return res.json({
          user,
          message:
            "PayPal renewal canceled. Previously verified access continues until its paid-through date.",
        });
      } catch (err) {
        return failure(res, err);
      }
    },
    async webhook(req, res) {
      const config = getConfig();
      if (!config.secret || !config.webhookId)
        return res.status(503).json({ message: "PayPal webhooks are not configured." });
      try {
        const gateway = makeGateway(config);
        const proof = await gateway.call("/v1/notifications/verify-webhook-signature", "POST", {
          auth_algo: req.headers["paypal-auth-algo"],
          cert_url: req.headers["paypal-cert-url"],
          transmission_id: req.headers["paypal-transmission-id"],
          transmission_sig: req.headers["paypal-transmission-sig"],
          transmission_time: req.headers["paypal-transmission-time"],
          webhook_id: config.webhookId,
          webhook_event: req.body,
        });
        if (proof.verification_status !== "SUCCESS")
          return res.status(400).json({ message: "Invalid PayPal webhook signature." });
        const event = req.body;
        const subscriptionId = event.event_type?.startsWith("BILLING.SUBSCRIPTION.")
          ? event.resource?.id
          : event.event_type === "PAYMENT.SALE.COMPLETED"
            ? event.resource?.billing_agreement_id
            : null;
        if (subscriptionId) {
          const checkout = await db.payPalCheckout.findUnique({ where: { subscriptionId } });
          if (checkout)
            await createBillingService(db, stripe, billingConfig()).withAccount(
              checkout.userId,
              (tx, user) => reconcilePayPal(tx, user, gateway, subscriptionId),
            );
        }
        return res.json({ received: true });
      } catch (err) {
        return failure(res, err);
      }
    },
  };
}
export const paypalController = createPayPalController();
