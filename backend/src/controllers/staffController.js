import prisma from "../db.js";
import { paymentView } from "../services/paymentService.js";
import { requestCategories } from "../utils/supportDetails.js";
import { supportRefundOperationId } from "../utils/supportBilling.js";
import { canChangeTicketStatus } from "../utils/supportStatus.js";
import { stripe as defaultStripe, billingConfig } from "../utils/stripe.js";
import { createBillingService, objectId } from "../services/billingService.js";
import {
  getIntegration,
  deliverEmail,
} from "../utils/integrations.js";
import {
  accessSchedule,
  effectiveUser,
  effectivePlanFilter,
} from "../utils/subscriptions.js";

export const isId = (value) =>
  /^\d+$/.test(String(value)) &&
  Number.isSafeInteger(Number(value)) &&
  Number(value) > 0;
export const staffFailure = (res, error) => {
  if (error.code === "P2002")
    return res.status(409).json({
      message:
        "This operation is already being processed. Retry the original operation.",
    });
  if (error.code === "P2025")
    return res.status(404).json({ message: "Record not found." });
  console.error("Staff request failed:", error.code || error.name);
  return res.status(error.status || 500).json({
    message: error.status
      ? error.message
      : "Unable to complete the request. Please try again.",
  });
};
function pageOptions(query) {
  const page = Number(query.page || 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000)
    throw Object.assign(new Error("Invalid page."), { status: 400 });
  return { page, skip: (page - 1) * 10, take: 10 };
}
const accountSelect = {
  id: true,
  name: true,
  email: true,
  plan: true,
  role: true,
  subscriptionStatus: true,
  subscriptionStartedAt: true,
  subscriptionPeriodEnd: true,
  complimentaryPlan: true,
  complimentaryStartsAt: true,
  complimentaryEndsAt: true,
  cancelAtPeriodEnd: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
};
const messageSelect = {
  id: true,
  subject: true,
  body: true,
  channel: true,
  toEmail: true,
  deliveryStatus: true,
  createdAt: true,
  readAt: true,
  supportRequestId: true,
  recipientId: true,
  sender: { select: { name: true } },
  senderId: true,
};

export function createStaffController(
  db = prisma,
  stripe = defaultStripe,
  emailSender = deliverEmail,
) {
  const ready = () => {
    if (!stripe)
      throw Object.assign(
        new Error(
          "Stripe is not configured. Add the server Stripe credentials to enable billing.",
        ),
        { status: 503 },
      );
  };
  return {
    async inbox(req, res) {
      try {
        const { page, skip, take } = pageOptions(req.query);
        const { category, status } = req.query;
        if (
          (category && category !== "messages" &&
            !requestCategories.includes(category)) ||
          (status && !["open", "pending", "resolved"].includes(status))
        )
          return res.status(400).json({ message: "Invalid inbox filter." });
        const search =
          typeof req.query.search === "string"
            ? req.query.search.trim().slice(0, 160)
            : "";
        const where = {
          ...(category === "messages" ? { category: { notIn: ["payment", "refund"] } } : category ? { category } : {}),
          ...(status ? { status } : {}),
          ...(search
            ? {
                OR: ["email", "name", "subject"].map((key) => ({
                  [key]: { contains: search, mode: "insensitive" },
                })),
              }
            : {}),
        };
        const [requests, total] = await Promise.all([
          db.supportRequest.findMany({
            where,
            skip,
            take,
            orderBy: { id: "desc" },
            include: {
              assignedTo: { select: { id: true, name: true } },
              user: { select: { id: true, name: true, plan: true } },
              _count: { select: { messages: true } },
            },
          }),
          db.supportRequest.count({ where }),
        ]);
        return res.json({ requests, total, page, pageSize: take });
      } catch (error) {
        return staffFailure(res, error);
      }
    },
    async conversation(req, res) {
      if (!isId(req.params.id))
        return res.status(400).json({ message: "Invalid request." });
      try {
        const request = await db.supportRequest.findUnique({
          where: { id: Number(req.params.id) },
          include: {
            assignedTo: { select: { id: true, name: true } },
            user: { select: { id: true, name: true, email: true, plan: true } },
            messages: { orderBy: { createdAt: "asc" }, select: messageSelect },
          },
        });
        if (!request)
          return res.status(404).json({ message: "Request not found." });
        if (request.status === "resolved") return res.status(409).json({ message: "Ticket is closed and cannot be opened." });
        return res.json({ request });
      } catch (error) {
        return staffFailure(res, error);
      }
    },
    async updateRequest(req, res) {
      if (req.body?.assignToMe && !["admin", "manager"].includes(req.user?.role)) return res.status(403).json({ message: "Only administrators and managers can claim conversations." });
      if (
        !isId(req.params.id) ||
        (!req.body?.assignToMe && !["open", "pending", "resolved"].includes(req.body?.status))
      )
        return res
          .status(400)
          .json({ message: "Choose a valid request status." });
      try {
        const existing = await db.supportRequest.findUnique({ where: { id: Number(req.params.id) } });
        if (!existing) return res.status(404).json({ message: "Request not found." });
        if (existing.status === "resolved") return res.status(409).json({ message: "Closed tickets cannot be changed or reopened." });
        if (!req.body.assignToMe && (!["admin", "manager"].includes(req.user?.role) || existing.assignedToId !== req.userId)) return res.status(403).json({ message: "Only the assigned administrator or manager can change ticket status." });
        if (!req.body.assignToMe && !canChangeTicketStatus(existing.status, req.body.status)) return res.status(409).json({ message: existing.status === "pending" ? "Open the pending ticket before closing it." : "An open ticket can only be closed; it cannot return to pending." });
        return res.json({
          request: await db.supportRequest.update({
            where: { id: Number(req.params.id), status: existing.status, ...(!req.body.assignToMe ? { assignedToId: req.userId } : {}) },
            data: req.body.assignToMe ? { assignedToId: req.userId } : { status: req.body.status },
          }),
        });
      } catch (error) {
        return staffFailure(res, error);
      }
    },
    async sendMessage(req, res) {
      if (!["admin", "manager"].includes(req.user?.role)) return res.status(403).json({ message: "Only an assigned administrator or manager can reply." });
      const body = req.body || {};
      if (
        typeof body.subject !== "string" ||
        !body.subject.trim() ||
        body.subject.trim().length > 160 ||
        typeof body.body !== "string" ||
        !body.body.trim() ||
        body.body.trim().length > 10000 ||
        !["in_app", "email"].includes(body.channel)
      )
        return res
          .status(400)
          .json({ message: "Enter a subject, message, and delivery channel." });
      try {
        let recipient, support;
        if (body.supportRequestId) {
          if (!isId(body.supportRequestId))
            return res.status(400).json({ message: "Invalid conversation." });
          support = await db.supportRequest.findUnique({
            where: { id: Number(body.supportRequestId) },
          });
          if (!support)
            return res.status(404).json({ message: "Conversation not found." });
          if (support.assignedToId !== req.userId) return res.status(403).json({ message: "Assign this conversation to yourself before replying." });
          if (support.status === "resolved") return res.status(409).json({ message: "Ticket is closed. Replies are disabled." });
          if (support.status !== "open") return res.status(409).json({ message: "Open this pending ticket before replying." });
          if (support.userId)
            recipient = await db.user.findUnique({
              where: { id: support.userId },
              select: { id: true, email: true },
            });
        } else {
          if (!isId(body.recipientId))
            return res.status(400).json({ message: "Choose a user." });
          recipient = await db.user.findUnique({
            where: { id: Number(body.recipientId) },
            select: { id: true, email: true },
          });
          if (!recipient)
            return res.status(404).json({ message: "User not found." });
        }
        if (body.channel === "in_app" && !recipient)
          return res
            .status(400)
            .json({ message: "This guest contact needs an email reply." });
        if (body.channel === "email") {
          const integration = await getIntegration(db, "resend");
          if (
            !integration.enabled ||
            !integration.secret ||
            !integration.senderEmail
          )
            return res.status(503).json({
              message:
                "Resend email and a verified sender must be configured first.",
            });
        }
        let message = await db.$transaction(async (tx) => {
          if (support) {
            await tx.$queryRaw`SELECT id FROM support_requests WHERE id = ${support.id} FOR UPDATE`;
            const current = await tx.supportRequest.findUnique({ where: { id: support.id }, select: { assignedToId: true, status: true } });
            if (current?.assignedToId !== req.userId) throw Object.assign(new Error("This conversation is no longer assigned to you."), { status: 403 });
            if (current.status === "resolved") throw Object.assign(new Error("Ticket is closed. Replies are disabled."), { status: 409 });
            if (current.status !== "open") throw Object.assign(new Error("Open this pending ticket before replying."), { status: 409 });
          }
          return tx.userMessage.create({
          data: {
            recipientId: recipient?.id || null,
            senderId: req.userId,
            supportRequestId: support?.id || null,
            toEmail: recipient?.email || support.email,
            subject: body.subject.trim(),
            body: body.body.trim(),
            channel: body.channel,
            deliveryStatus: body.channel === "email" ? "pending" : "sent",
          },
          });
        });
        if (body.channel === "email") {
          try {
            const providerMessageId = await emailSender(db, message);
            message = await db.userMessage.update({
              where: { id: message.id },
              data: { providerMessageId, deliveryStatus: "sent" },
            });
          } catch (error) {
            await db.userMessage.update({
              where: { id: message.id },
              data: { deliveryStatus: "failed" },
            });
            throw error;
          }
        }
        return res.status(201).json({
          message: { id: message.id, deliveryStatus: message.deliveryStatus },
          notice:
            body.channel === "email"
              ? "Email accepted by the delivery provider."
              : "Message delivered to the user's inbox.",
        });
      } catch (error) {
        return staffFailure(res, error);
      }
    },
    async subscriptions(req, res) {
      try {
        const { page, skip, take } = pageOptions(req.query);
        const search =
          typeof req.query.search === "string"
            ? req.query.search.trim().slice(0, 160)
            : "";
        const where = {
          role: { notIn: ["admin", "manager"] },
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
          ...(req.query.plan &&
          ["free", "plus", "pro", "ultra"].includes(req.query.plan)
            ? { AND: [effectivePlanFilter(req.query.plan)] }
            : {}),
        };
        const [users, total] = await Promise.all([
          db.user.findMany({
            where,
            select: accountSelect,
            orderBy: { id: "desc" },
            skip,
            take,
          }),
          db.user.count({ where }),
        ]);
        return res.json({
          users: users.map((user) => effectiveUser(user)),
          total,
          page,
          pageSize: take,
          configured: Boolean(stripe),
          liveMode: billingConfig().liveMode,
        });
      } catch (error) {
        return staffFailure(res, error);
      }
    },
    async access(req, res) {
      if (!isId(req.params.id))
        return res.status(400).json({ message: "Invalid account." });
      let data;
      try {
        data = accessSchedule(req.body || {});
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
      try {
        const account = await db.user.findUnique({
          where: { id: Number(req.params.id) },
          select: {
            role: true,
            stripeSubscriptionId: true,
            subscriptionStatus: true,
            complimentaryPlan: true,
          },
        });
        if (!account)
          return res.status(404).json({ message: "User not found." });
        if (["admin", "manager"].includes(account.role) && !req.body.remove)
          return res.status(403).json({ message: "Staff accounts cannot receive subscription plans." });
        if (
          req.user.role === "manager" &&
          ["admin", "manager"].includes(account.role)
        )
          return res
            .status(403)
            .json({ message: "Only administrators can change staff access." });
        if (req.body.remove && !account.complimentaryPlan)
          return res
            .status(409)
            .json({
              message:
                "This account has no complimentary subscription to remove.",
            });
        const stripeActive =
          account.stripeSubscriptionId &&
          !["canceled", "incomplete_expired"].includes(
            account.subscriptionStatus,
          );
        const user = await db.user.update({
          where: { id: Number(req.params.id) },
          data: {
            ...data,
            ...(!stripeActive
              ? {
                  plan: "free",
                  ...(req.body.remove
                    ? {
                        seatLimit: null,
                        projectLimit: null,
                        monthlyCreditLimit: null,
                      }
                    : {}),
                }
              : {}),
          },
          select: accountSelect,
        });
        return res.json({
          user: effectiveUser(user),
          message: req.body.remove
            ? "Complimentary access removed."
            : "Subscription access dates saved. No payment was charged.",
        });
      } catch (error) {
        return staffFailure(res, error);
      }
    },
    async subscriptionAction(req, res) {
      if (
        !isId(req.params.id) ||
        typeof req.body?.cancelAtPeriodEnd !== "boolean"
      )
        return res
          .status(400)
          .json({ message: "Invalid subscription change." });
      try {
        ready();
        const service = createBillingService(db, stripe, billingConfig());
        const user = await service.withAccount(
          Number(req.params.id),
          async (tx, account) => {
            if (!account.stripeSubscriptionId || !account.stripeCustomerId)
              throw Object.assign(
                new Error("This account has no Stripe subscription."),
                {
                  status: 409,
                },
              );
            const subscription = await stripe.subscriptions.retrieve(
              account.stripeSubscriptionId,
            );
            if (objectId(subscription.customer) !== account.stripeCustomerId)
              throw Object.assign(
                new Error("The subscription does not belong to this account."),
                {
                  status: 409,
                },
              );
            if (
              ["canceled", "incomplete_expired"].includes(subscription.status)
            )
              throw Object.assign(
                new Error("This subscription has already ended."),
                { status: 409 },
              );
            await stripe.subscriptions.update(subscription.id, {
              cancel_at_period_end: req.body.cancelAtPeriodEnd,
            });
            return service.reconcile(tx, account);
          },
        );
        return res.json({ user });
      } catch (error) {
        return staffFailure(res, error);
      }
    },
    async supportBilling(req, res) {
      if (!["admin", "manager"].includes(req.user?.role)) return res.status(403).json({ message: "Billing access requires an administrator or manager." });
      if (!isId(req.params.id)) return res.status(400).json({ message: "Invalid request." });
      if (req.query.after && !/^[0-9a-f-]{36}$/i.test(req.query.after)) return res.status(400).json({ message: "Invalid payment cursor." });
      try {
        const request = await db.supportRequest.findUnique({ where: { id: Number(req.params.id) }, select: { id: true, category: true, userId: true } });
        if (!request) return res.status(404).json({ message: "Request not found." });
        if (!["payment", "refund"].includes(request.category)) return res.status(400).json({ message: "This is not a billing request." });
        // Guest email addresses are unverified: never use them to match an account.
        if (!request.userId) return res.json({ linked: false, payments: [], refunds: [], hasMore: false, operation: null });
        const operationId = supportRefundOperationId(request.id);
        const [rows, refunds, operation] = await Promise.all([
          db.paymentRecord.findMany({ where: { userId: request.userId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 21,
            ...(req.query.after ? { cursor: { id: req.query.after }, skip: 1 } : {}), include: { user: { select: { id: true, name: true, email: true } } } }),
          db.refundRecord.findMany({ where: { userId: request.userId }, orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { id: true, name: true, email: true } } } }),
          db.refundRecord.findUnique({ where: { id: operationId }, include: { user: { select: { id: true, name: true, email: true } } } }),
        ]);
        return res.json({ linked: true, payments: rows.slice(0, 20).map(paymentView), refunds, operation,
          hasMore: rows.length > 20, nextCursor: rows.slice(0, 20).at(-1)?.id });
      } catch (error) { return staffFailure(res, error); }
    },
    async payments(req, res) {
      try {
        if (req.query.userId && !isId(req.query.userId)) return res.status(400).json({ message: "Invalid customer." });
        if (req.query.after && !/^[0-9a-f-]{36}$/i.test(req.query.after)) return res.status(400).json({ message: "Invalid payment cursor." });
        const rows = await db.paymentRecord.findMany({
          where: req.query.userId ? { userId: Number(req.query.userId) } : {},
          orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 21,
          ...(req.query.after ? { cursor: { id: req.query.after }, skip: 1 } : {}),
          include: { user: { select: accountSelect } },
        });
        return res.json({ payments: rows.slice(0, 20).map(paymentView), hasMore: rows.length > 20, nextCursor: rows.slice(0, 20).at(-1)?.id, liveMode: billingConfig().liveMode });
      } catch (error) { return staffFailure(res, error); }
    },
    async refunds(req, res) {
      try {
        const { page, skip, take } = pageOptions(req.query);
        const [refunds, total] = await Promise.all([
          db.refundRecord.findMany({
            skip,
            take,
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { id: true, name: true, email: true } },
              actor: { select: { name: true } },
            },
          }),
          db.refundRecord.count(),
        ]);
        return res.json({ refunds, total, page, pageSize: take });
      } catch (error) {
        return staffFailure(res, error);
      }
    },
    async refund(req, res) {
      const body = { ...req.body };
      if (body.supportRequestId !== undefined) {
        if (!["admin", "manager"].includes(req.user?.role)) return res.status(403).json({ message: "Only administrators and managers can approve refunds." });
        if (!isId(body.supportRequestId)) return res.status(400).json({ message: "Invalid support request." });
        try {
          const request = await db.supportRequest.findUnique({ where: { id: Number(body.supportRequestId) }, select: { userId: true, category: true } });
          if (!request || request.category !== "refund" || !request.userId || request.userId !== Number(body.userId))
            return res.status(403).json({ message: "Refund requests must be linked to this payment's account." });
          body.operationId = supportRefundOperationId(Number(body.supportRequestId));
        } catch (error) { return staffFailure(res, error); }
      }
      if (
        !isId(body.userId) ||
        !/^ch_[a-zA-Z0-9]+$/.test(body.chargeId || "") ||
        !Number.isSafeInteger(body.amount) ||
        body.amount < 1 ||
        !/^[0-9a-f-]{36}$/i.test(body.operationId || "") ||
        typeof body.reason !== "string" ||
        !body.reason.trim() ||
        body.reason.length > 500
      )
        return res.status(400).json({
          message:
            "Provide a valid payment, amount in minor currency units, reason, and operation ID.",
        });
      try {
        ready();
        const account = await db.user.findUnique({
          where: { id: Number(body.userId) },
          select: accountSelect,
        });
        if (!account?.stripeCustomerId)
          return res
            .status(404)
            .json({ message: "Billing account not found." });
        const prior = await db.refundRecord.findUnique({
          where: { id: body.operationId },
        });
        if (
          prior &&
          (prior.userId !== account.id ||
            prior.chargeId !== body.chargeId ||
            prior.amount !== body.amount ||
            prior.reason !== body.reason.trim())
        )
          return res
            .status(409)
            .json({
              message:
                "The operation ID is already attached to another refund.",
            });
        if (prior?.stripeRefundId) return res.json({ refund: prior });
        const charge = await stripe.charges.retrieve(body.chargeId);
        if (objectId(charge.customer) !== account.stripeCustomerId)
          return res
            .status(403)
            .json({ message: "This payment does not belong to this user." });
        if (prior) {
          let after;
          do {
            const existing = await stripe.refunds.list({
              charge: body.chargeId,
              limit: 100,
              ...(after ? { starting_after: after } : {}),
            });
            const recovered = existing.data.find(
              (refund) =>
                refund.metadata?.casefy_operation_id === body.operationId,
            );
            if (recovered) {
              const record = await db.refundRecord.update({
                where: { id: body.operationId },
                data: {
                  stripeRefundId: recovered.id,
                  status: ["pending", "requires_action"].includes(
                    recovered.status,
                  )
                    ? "processing"
                    : recovered.status,
                },
              });
              return res.json({ refund: record });
            }
            after = existing.has_more ? existing.data.at(-1)?.id : undefined;
          } while (after);
        }
        if (
          !prior &&
          (!charge.paid ||
            charge.disputed ||
            body.amount > charge.amount - charge.amount_refunded)
        )
          return res.status(409).json({
            message:
              "This amount cannot be refunded. Check the remaining balance and dispute status.",
          });
        if (!prior)
          await db.refundRecord.create({
            data: {
              id: body.operationId,
              userId: account.id,
              actorId: req.userId,
              chargeId: charge.id,
              amount: body.amount,
              currency: charge.currency,
              reason: body.reason.trim(),
            },
          });
        let refund;
        try {
          refund = await stripe.refunds.create(
            {
              charge: body.chargeId,
              amount: body.amount,
              reason: "requested_by_customer",
              metadata: {
                casefy_user_id: String(account.id),
                casefy_operation_id: body.operationId,
              },
            },
            { idempotencyKey: `casefy-refund-${body.operationId}` },
          );
        } catch (error) {
          if (
            [
              "StripeInvalidRequestError",
              "StripeCardError",
              "StripePermissionError",
              "StripeAuthenticationError",
            ].includes(error.type)
          )
            await db.refundRecord.update({
              where: { id: body.operationId },
              data: { status: "failed" },
            });
          throw Object.assign(
            new Error(
              "Stripe could not complete the refund. Retry this same operation; do not submit a second refund.",
            ),
            { status: 502 },
          );
        }
        const record = await db.refundRecord.update({
          where: { id: body.operationId },
          data: {
            stripeRefundId: refund.id,
            status:
              refund.status === "pending" || refund.status === "requires_action"
                ? "processing"
                : refund.status,
          },
        });
        const updatedCharge = await stripe.charges.retrieve(body.chargeId);
        await db.paymentRecord.updateMany({ where: { externalId: body.chargeId }, data: { amountRefunded: updatedCharge.amount_refunded } });
        return res.json({ refund: record });
      } catch (error) {
        return staffFailure(res, error);
      }
    },

  };
}

export const staffController = createStaffController();
