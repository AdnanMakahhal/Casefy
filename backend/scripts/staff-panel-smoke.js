import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import prisma from "../src/db.js";
import { createAdminController } from "../src/controllers/adminController.js";
import { createSupportController } from "../src/controllers/supportController.js";
import { createStaffController } from "../src/controllers/staffController.js";
import { createMessagesController } from "../src/controllers/messagesController.js";
import { createGenerationController } from "../src/controllers/generationController.js";
import { createProtect } from "../src/middleware/authMiddleware.js";
import { encryptSecret } from "../src/utils/integrations.js";
import { extractDocuments } from "../src/services/generationService.js";

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
    prisma.generationRun.count(),
    prisma.integrationSetting.count(),
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
        await tx.integrationSetting.upsert({
          where: { provider: "openai" },
          create: {
            provider: "openai",
            model: "smoke-model",
            secretCiphertext: encryptSecret("smoke-not-real"),
            enabled: true,
          },
          update: {
            model: "smoke-model",
            secretCiphertext: encryptSecret("smoke-not-real"),
            enabled: true,
          },
        });
        const generated = response();
        await createGenerationController(tx, async () => ({
          model: "smoke-model",
          testCases: [
            {
              id: 1,
              title: "Valid login",
              priority: "high",
              type: "functional",
              steps: ["Submit valid credentials"],
              expectedResult: "Dashboard appears",
            },
          ],
        })).generate(
          {
            ...staff,
            body: {
              source: "story",
              provider: "openai",
              subject: "Login smoke",
              prompt: "A user can sign in",
              filters: {
                count: 1,
                priority: "high",
                testTypes: ["functional"],
              },
            },
          },
          generated,
        );
        assert.equal(generated.statusCode, 201);
        assert.equal(generated.body.creditsUsed, 0);
        const report = response();
        await staffController.report(
          { ...staff, params: { id: String(generated.body.run.id) } },
          report,
        );
        assert.equal(report.body.run.result[0].title, "Valid login");
        throw rollback;
      },
      { timeout: 45000 },
    );
  } catch (error) {
    if (error !== rollback) throw error;
  }
  assert.deepEqual(await counts(), before);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  const content = "BT /F1 12 Tf 72 720 Td (Login requires a password.) Tj ET";
  objects.push(
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  );
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const extracted = await extractDocuments([
    { name: "smoke.pdf", content: Buffer.from(pdf).toString("base64") },
  ]);
  assert.match(extracted, /Login requires a password/);
  console.log(
    "Staff smoke passed: account management, support conversations, in-app messages, session blocking, mocked generation, saved reports, PDF extraction. All database fixtures rolled back; no emails, AI calls, or refunds sent.",
  );
} finally {
  await prisma.$disconnect();
}
