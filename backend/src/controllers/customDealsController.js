import prisma from "../db.js";
import { stripe, billingConfig } from "../utils/stripe.js";
import { createBillingService, blocksNewSubscription } from "../services/billingService.js";
import { isId, staffFailure } from "./staffController.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };

export async function offerDeal(req, res) {
  try {
    if (!isId(req.params.id)) fail(400, "Invalid request.");
    const body = req.body || {};
    for (const field of ["amount", "seats", "projects", "monthlyCredits"]) {
      if (!Number.isSafeInteger(body[field]) || body[field] < 1 || body[field] > 100000000) fail(400, `Enter a valid ${field}.`);
    }
    if (!["usd", "eur", "gbp", "jod"].includes(body.currency) || !["month", "year"].includes(body.interval)) fail(400, "Choose a currency and billing interval.");
    if (typeof body.notes !== "string" || !body.notes.trim() || body.notes.length > 2000) fail(400, "Include the agreement terms, up to 2,000 characters.");
    const request = await prisma.supportRequest.findUnique({ where: { id: Number(req.params.id) }, include: { user: true } });
    if (!request?.user || request.category !== "custom") fail(409, "A custom-plan request must belong to a registered customer before making an offer.");
    if (["admin", "manager"].includes(request.user.role) || request.user.isSupportAgent) fail(409, "Staff accounts cannot receive customer deals.");
    const deal = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${request.userId} FOR UPDATE`;
      const pending = await tx.customDeal.findFirst({ where: { userId: request.userId, status: "accepted" } });
      if (pending) fail(409, "This customer already has an accepted offer awaiting payment.");
      await tx.customDeal.updateMany({ where: { userId: request.userId, status: "offered" }, data: { status: "superseded" } });
      const created = await tx.customDeal.create({ data: {
        userId: request.userId, supportRequestId: request.id, approvedById: req.userId,
        amount: body.amount, currency: body.currency, interval: body.interval,
        seats: body.seats, projects: body.projects, monthlyCredits: body.monthlyCredits,
        notes: body.notes.trim(), expiresAt: new Date(Date.now() + 14 * 86400000),
      } });
      await tx.userMessage.create({ data: {
        recipientId: request.userId, senderId: req.userId, supportRequestId: request.id,
        toEmail: request.email, subject: "Your custom plan offer",
        body: `Your custom plan offer is ready: ${body.seats} seats, ${body.projects} projects, and ${body.monthlyCredits.toLocaleString("en-US")} credits per month. Review the price and agreement in this conversation. Access begins after payment is confirmed.`,
      } });
      await tx.supportRequest.update({ where: { id: request.id }, data: { status: "pending", assignedToId: req.userId } });
      return created;
    });
    res.status(201).json({ deal });
  } catch (error) { return staffFailure(res, error); }
}

export async function respondDeal(req, res) {
  try {
    if (!uuid.test(req.params.id) || !["accept", "decline"].includes(req.body?.action)) fail(400, "Choose accept or decline.");
    const deal = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${req.userId} FOR UPDATE`;
      const existing = await tx.customDeal.findFirst({ where: { id: req.params.id, userId: req.userId } });
      if (!existing) fail(404, "Offer not found.");
      if (existing.status !== "offered" || existing.expiresAt <= new Date()) fail(409, "This offer is no longer available.");
      const result = await tx.customDeal.update({ where: { id: existing.id }, data: { status: req.body.action === "accept" ? "accepted" : "declined", ...(req.body.action === "accept" ? { acceptedAt: new Date() } : {}) } });
      await tx.userMessage.create({ data: { senderId: req.userId, supportRequestId: existing.supportRequestId, toEmail: req.user.email, subject: "Custom offer response", body: req.body.action === "accept" ? "I accept the custom plan offer and will complete checkout." : "I have declined this offer. Please discuss the requirements with me.", channel: "support_reply" } });
      await tx.supportRequest.update({ where: { id: existing.supportRequestId }, data: { status: "open" } });
      return result;
    });
    res.json({ deal });
  } catch (error) { return staffFailure(res, error); }
}

export async function customCheckout(req, res) {
  try {
    if (!uuid.test(req.params.id)) fail(400, "Invalid offer.");
    if (!stripe) fail(503, "Billing is not configured.");
    const config = billingConfig();
    const service = createBillingService(prisma, stripe, config);
    const session = await service.withAccount(req.userId, async (tx, user) => {
      const deal = await tx.customDeal.findFirst({ where: { id: req.params.id, userId: user.id } });
      if (!deal || deal.status !== "accepted") fail(409, "Accept the offer before checkout.");
      if (deal.expiresAt <= new Date()) fail(409, "This offer has expired. Request a new offer from support.");
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({ email: user.email, name: user.name }, { idempotencyKey: `casefy-custom-customer-${user.id}-${new Date(user.createdAt).getTime()}` });
        customerId = customer.id;
        await tx.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
      }
      if (deal.stripeCheckoutSessionId) {
        const previous = await stripe.checkout.sessions.retrieve(deal.stripeCheckoutSessionId);
        if (previous.status === "open") return previous;
        if (previous.status === "complete") fail(409, "Payment is being confirmed. Refresh your account shortly.");
      }
      if ((await service.subscriptionsFor(customerId)).some(blocksNewSubscription)) fail(409, "Your existing subscription must end before a new custom subscription can start. Contact support to arrange the transition.");
      const created = await stripe.checkout.sessions.create({
        mode: "subscription", customer: customerId, client_reference_id: String(user.id),
        integration_identifier: config.integrationIdentifier,
        line_items: [{ quantity: 1, price_data: { currency: deal.currency, unit_amount: deal.amount, recurring: { interval: deal.interval }, product_data: { name: "Casefy Custom", description: `${deal.seats} seats · ${deal.projects} projects · ${deal.monthlyCredits} monthly credits` } } }],
        subscription_data: { metadata: { casefy_deal_id: deal.id } },
        success_url: `${config.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.origin}/support?category=custom`,
        ...(config.requireTermsOfService ? { consent_collection: { terms_of_service: "required" } } : {}),
      }, { idempotencyKey: `custom-checkout-${deal.id}-${deal.stripeCheckoutSessionId || "first"}` });
      await tx.customDeal.update({ where: { id: deal.id }, data: { stripeCheckoutSessionId: created.id } });
      return created;
    });
    res.json({ url: session.url });
  } catch (error) { return staffFailure(res, error); }
}
