import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import prisma from "../src/db.js";
import { createAdminController } from "../src/controllers/adminController.js";
import { createSupportController } from "../src/controllers/supportController.js";
import { createStaffController } from "../src/controllers/staffController.js";
import { createMessagesController } from "../src/controllers/messagesController.js";
import { createProtect } from "../src/middleware/authMiddleware.js";

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
const rollback = new Error("Rollback smoke fixtures");
const counts = async () =>
  Promise.all([
    prisma.user.count(),
    prisma.supportRequest.count(),
    prisma.userMessage.count(),
  ]);
try {
  const actor = await prisma.user.findFirstOrThrow({
    where: { role: "admin", blockedAt: null },
    select: { id: true, name: true, email: true, role: true },
  });
  const before = await counts();
  try {
    await prisma.$transaction(
      async (tx) => {
        const staff = { userId: actor.id, user: actor };
        const controller = createAdminController(tx);
        const created = response();
        await controller.create(
          {
            ...staff,
            body: {
              name: "Staff smoke fixture",
              email: `staff-smoke-${randomUUID()}@example.com`,
              workspaceName: "Smoke",
              password: randomUUID(),
              role: "student",
              plan: "enterprise",
              seatLimit: 5,
              projectLimit: 300,
              monthlyCreditLimit: 50000,
            },
          },
          created,
        );
        assert.equal(created.statusCode, 201);
        const customer = created.body.user;
        const ticket = response();
        await createSupportController(tx)(
          {
            user: customer,
            body: {
              name: customer.name,
              email: customer.email,
              subject: "Smoke refund request",
              description: "Test only",
              category: "refund",
            },
          },
          ticket,
        );
        assert.equal(ticket.statusCode, 201);
        const sent = response();
        const staffController = createStaffController(tx, null);
        const dated = response();
        await staffController.access(
          {
            ...staff,
            params: { id: String(customer.id) },
            body: { plan: "pro", duration: "14days" },
          },
          dated,
        );
        assert.equal(dated.statusCode, 200);
        assert.equal(dated.body.user.plan, "pro");
        assert.equal(dated.body.user.basePlan, "free");
        const schedule = await tx.user.findUniqueOrThrow({
          where: { id: customer.id },
        });
        assert.equal(
          schedule.complimentaryEndsAt.getTime() -
            schedule.complimentaryStartsAt.getTime(),
          14 * 86400000,
        );
        const proAccounts = response();
        await staffController.subscriptions(
          { ...staff, query: { plan: "pro" } },
          proAccounts,
        );
        assert.equal(proAccounts.statusCode, 200);
        assert.ok(
          proAccounts.body.users.some(
            (user) => user.id === customer.id && user.plan === "pro",
          ),
        );
        await staffController.sendMessage(
          {
            ...staff,
            body: {
              supportRequestId: ticket.body.id,
              subject: "Reply",
              body: "In-app smoke reply",
              channel: "in_app",
            },
          },
          sent,
        );
        assert.equal(sent.statusCode, 201);
        const inbox = response();
        await createMessagesController(tx).list({ userId: customer.id }, inbox);
        assert.equal(inbox.body.messages.length, 1);
        const conversation = response();
        await staffController.conversation(
          { ...staff, params: { id: String(ticket.body.id) } },
          conversation,
        );
        assert.equal(conversation.body.request.messages.length, 1);
        const blocked = response();
        await controller.block(
          {
            ...staff,
            params: { id: String(customer.id) },
            body: { blocked: true, reason: "Smoke only" },
          },
          blocked,
        );
        assert.equal(blocked.statusCode, 200);
        const token = jwt.sign({ userId: customer.id }, process.env.JWT_SECRET);
        const denied = response();
        await createProtect(tx)(
          { headers: { authorization: `Bearer ${token}` } },
          denied,
          () => assert.fail("Blocked session was accepted"),
        );
        assert.equal(denied.statusCode, 401);
        await controller.block(
          {
            ...staff,
            params: { id: String(customer.id) },
            body: { blocked: false },
          },
          response(),
        );
        throw rollback;
      },
      { timeout: 45000 },
    );
  } catch (error) {
    if (error !== rollback) throw error;
  }
  assert.deepEqual(await counts(), before);
  console.log(
    "Staff smoke passed: account management, support conversations, in-app messages, session blocking. All database fixtures rolled back; no emails or refunds sent.",
  );
} finally {
  await prisma.$disconnect();
}
