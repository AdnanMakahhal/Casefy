import prisma from "../db.js";
import { stripe as stripeClient, billingConfig } from "../utils/stripe.js";
import { blocksNewSubscription, createBillingService, objectId, subscriptionState } from "../services/billingService.js";
import { effectiveUser, planRank } from "../utils/subscriptions.js";
import { paypalBlocksCheckout, paypalConfig, createPayPalClient } from "../utils/paypal.js";
import { reconcilePayPal } from "./paypalController.js";

const events = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "customer.subscription.paused", "customer.subscription.resumed", "invoice.paid", "invoice.payment_failed", "invoice.payment_action_required"]);

export function createBillingController(db = prisma, stripe = stripeClient, getConfig = billingConfig) {
  function ready(res) {
    if (stripe) return true;
    res.status(503).json({ message: "Billing is not configured yet" });
    return false;
  }
  function failure(res, error) {
    if (!error.status || error.status >= 500) console.error("Billing request failed:", error.code || error.name);
    if (error.type === "StripeInvalidRequestError" && /terms of service/i.test(error.message) && /URL/i.test(error.message)) {
      return res.status(503).json({ message: "Checkout is temporarily unavailable. A Terms of service URL must be configured in Stripe's public business details. Please contact support." });
    }
    return res.status(error.status || 502).json({ message: error.status ? error.message : "Unable to reach billing. Please try again" });
  }

  const createCheckout = async (req, res) => {
    if (!ready(res)) return;
    const { plan, billing = "monthly" } = req.body || {};
    const config = getConfig();
    const price = ["plus", "pro"].includes(plan) && ["monthly", "annual"].includes(billing) ? config.prices[plan]?.[billing] : null;
    if (!price) return res.status(400).json({ message: "This plan or billing interval is not available" });
    const service = createBillingService(db, stripe, config);
    try {
      const session = await service.withAccount(req.user.id, async (tx, user) => {
        if (paypalBlocksCheckout(user)) throw Object.assign(new Error("Manage or cancel your existing PayPal subscription before starting Stripe billing."), { status: 409 });
        if (planRank[effectiveUser(user).plan] >= planRank[plan]) throw Object.assign(new Error("This plan is already included in your current access. Choose a higher plan to upgrade."), { status: 409 });
        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({ email: user.email, name: user.name, metadata: { casefyUserId: String(user.id) } }, { idempotencyKey: `casefy-customer-${user.id}-${new Date(user.createdAt).getTime()}` });
          customerId = customer.id;
          await tx.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
        }
        const subscriptions = await service.subscriptionsFor(customerId);
        if (subscriptions.some(blocksNewSubscription)) throw Object.assign(new Error("You already have a subscription. Contact support to change it"), { status: 409 });
        const previousId = user.stripeCheckoutSessionId;
        if (previousId) {
          const previous = await stripe.checkout.sessions.retrieve(previousId);
          if (previous.status === "open") {
            if (objectId(previous.customer) === customerId && previous.client_reference_id === String(user.id) && previous.metadata?.casefyPlan === plan && previous.metadata?.casefyBilling === billing) return previous;
            await stripe.checkout.sessions.expire(previousId);
          }
        }
        const session = await stripe.checkout.sessions.create({
          ui_mode: "hosted_page",
          mode: "subscription",
          customer: customerId,
          client_reference_id: String(user.id),
          metadata: { casefyUserId: String(user.id), casefyPlan: plan, casefyBilling: billing },
          subscription_data: { billing_mode: { type: "flexible" }, metadata: { casefyUserId: String(user.id) } },
          line_items: [{ price, quantity: 1 }],
          billing_address_collection: "auto",
          phone_number_collection: { enabled: true },
          automatic_tax: { enabled: false },
          allow_promotion_codes: false,
          payment_method_collection: "always",
          submit_type: "auto",
          ...(config.liveMode || config.requireTermsOfService ? { consent_collection: { terms_of_service: "required" } } : {}),
          name_collection: { individual: { enabled: true } },
          integration_identifier: config.integrationIdentifier,
          origin_context: "web",
          success_url: `${config.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${config.origin}/checkout?plan=${plan}&billing=${billing}&canceled=1`,
        }, { idempotencyKey: `casefy-checkout-v2-${user.id}-${previousId || "initial"}-${plan}-${billing}` });
        await tx.user.update({ where: { id: user.id }, data: { stripeCheckoutSessionId: session.id } });
        return session;
      });
      return res.json({ url: session.url });
    } catch (error) { return failure(res, error); }
  };

  const createUpgrade = async (req, res) => {
    if (!ready(res)) return;
    const { plan, billing = "monthly" } = req.body || {};
    const config = getConfig();
    const price = ["plus", "pro"].includes(plan) && ["monthly", "annual"].includes(billing) ? config.prices[plan]?.[billing] : null;
    if (!price) return res.status(400).json({ message: "This upgrade plan or billing interval is not available." });
    try {
      const service = createBillingService(db, stripe, config);
      const session = await service.withAccount(req.user.id, async (_tx, user) => {
        if (paypalBlocksCheckout(user)) throw Object.assign(new Error("Manage your existing PayPal subscription before changing payment providers."), { status: 409 });
        if (!user.stripeCustomerId) throw Object.assign(new Error("Choose a plan through Checkout to start your subscription."), { status: 409 });
        const subscriptions = await service.subscriptionsFor(user.stripeCustomerId);
        const state = subscriptionState(subscriptions, config.prices);
        const subscription = subscriptions.find((item) => item.id === state.stripeSubscriptionId);
        if (!subscription || !["active", "trialing"].includes(subscription.status) || state.plan === "free") throw Object.assign(new Error("Your subscription needs attention. Open Manage billing before upgrading."), { status: 409 });
        if (objectId(subscription.customer) !== user.stripeCustomerId || subscription.items?.data?.length !== 1) throw Object.assign(new Error("This subscription cannot be upgraded through self-service. Please contact support."), { status: 409 });
        const currentRank = Math.max(planRank[state.plan], planRank[effectiveUser(user).plan] || 0);
        if (planRank[plan] <= currentRank) throw Object.assign(new Error("Select a higher plan. Your current plan cannot be purchased again."), { status: 409 });
        if (subscription.cancel_at_period_end) throw Object.assign(new Error("Keep your subscription active in Manage billing before upgrading."), { status: 409 });
        const item = subscription.items.data[0];
        return stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: `${config.origin}/pricing`,
          ...(config.portalConfiguration ? { configuration: config.portalConfiguration } : {}),
          flow_data: {
            type: "subscription_update_confirm",
            subscription_update_confirm: { subscription: subscription.id, items: [{ id: item.id, price, quantity: item.quantity || 1 }] },
            after_completion: { type: "redirect", redirect: { return_url: `${config.origin}/profile?upgraded=1` } },
          },
        });
      });
      return res.json({ url: session.url });
    } catch (error) { return failure(res, error); }
  };

  const catalog = async (_req, res) => {
    if (!ready(res)) return;
    const config = getConfig();
    try {
      const plans = {};
      for (const [plan, intervals] of Object.entries(config.prices)) {
        plans[plan] = {};
        for (const [billing, id] of Object.entries(intervals)) {
          if (!id) continue;
          const price = await stripe.prices.retrieve(id);
          if (price.active && price.recurring) plans[plan][billing] = { amount: price.unit_amount, currency: price.currency, interval: price.recurring.interval };
        }
      }
      return res.json({ plans });
    } catch (error) { return failure(res, error); }
  };

  const createPortal = async (req, res) => {
    if (!ready(res)) return;
    if (!req.user.stripeCustomerId) return res.status(400).json({ message: "No billing account yet. Choose a paid plan first" });
    const config = getConfig();
    try {
      const session = await stripe.billingPortal.sessions.create({ customer: req.user.stripeCustomerId, return_url: `${config.origin}/profile`, ...(config.portalConfiguration ? { configuration: config.portalConfiguration } : {}) });
      return res.json({ url: session.url });
    } catch (error) { return failure(res, error); }
  };

  const billingStatus = async (req, res) => {
    if (req.user.paypalSubscriptionId) {
      try {
        const config = paypalConfig();
        if (!config.secret) return res.json({ user: req.user });
        const user = await createBillingService(db, stripe, getConfig()).withAccount(req.user.id, (tx, account) => reconcilePayPal(tx, account, createPayPalClient(config)));
        return res.json({ user });
      } catch (error) { return failure(res, error); }
    }
    if (!req.user.stripeCustomerId) return res.json({ user: req.user });
    if (!ready(res)) return;
    try {
      const user = await createBillingService(db, stripe, getConfig()).syncCustomer(req.user.stripeCustomerId);
      if (!user) return res.status(401).json({ message: "Account no longer exists" });
      return res.json({ user });
    } catch (error) { return failure(res, error); }
  };

  const checkoutStatus = async (req, res) => {
    if (!ready(res)) return;
    if (!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(req.params.sessionId)) return res.status(400).json({ message: "Invalid Checkout session" });
    try {
      const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
      if (!req.user.stripeCustomerId || objectId(session.customer) !== req.user.stripeCustomerId || session.client_reference_id !== String(req.user.id)) return res.status(404).json({ message: "Checkout session not found" });
      const service = createBillingService(db, stripe, getConfig());
      const user = await service.syncCustomer(req.user.stripeCustomerId);
      if (!user) return res.status(401).json({ message: "Account no longer exists" });
      return res.json({ status: session.status, paymentStatus: session.payment_status, user });
    } catch (error) { return failure(res, error); }
  };

  const webhook = async (req, res) => {
    if (!ready(res)) return;
    const config = getConfig();
    if (!config.webhookSecret) return res.status(503).json({ message: "Webhook signing secret is not configured" });
    let event;
    try { event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], config.webhookSecret); }
    catch { return res.status(400).json({ message: "Invalid webhook signature" }); }
    if (event.livemode !== config.liveMode) return res.status(400).json({ message: "Unexpected webhook mode" });
    if (["refund.created", "refund.updated", "refund.failed"].includes(event.type)) {
      try {
        const refund = await stripe.refunds.retrieve(event.data.object.id);
        const chargeId = objectId(refund.charge);
        if (chargeId) await db.refundRecord.updateMany({ where: { chargeId, OR: [{ stripeRefundId: refund.id }, ...(refund.metadata?.casefy_operation_id ? [{ id: refund.metadata.casefy_operation_id }] : [])] }, data: { stripeRefundId: refund.id, status: ["pending", "requires_action"].includes(refund.status) ? "processing" : refund.status } });
        return res.json({ received: true });
      } catch (error) { return res.status(500).json({ message: "Unable to reconcile refund status" }); }
    }
    if (!events.has(event.type)) return res.json({ received: true });
    const customerId = objectId(event.data.object.customer);
    if (!customerId) return res.json({ received: true });
    try {
      await createBillingService(db, stripe, config).syncCustomer(customerId, event);
      return res.json({ received: true });
    } catch (error) {
      console.error("Webhook reconciliation failed:", error.code || error.name);
      return res.status(500).json({ message: "Unable to process billing event" });
    }
  };
  return { createCheckout, createUpgrade, createPortal, checkoutStatus, webhook, catalog, billingStatus };
}

export const { createCheckout, createUpgrade, createPortal, checkoutStatus, webhook, catalog, billingStatus } = createBillingController();
