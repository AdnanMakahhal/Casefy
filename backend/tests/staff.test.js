import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createAdminController } from "../src/controllers/adminController.js";
import { createStaffController } from "../src/controllers/staffController.js";
import { createMessagesController } from "../src/controllers/messagesController.js";
import { createGenerationController } from "../src/controllers/generationController.js";
import { createSupportController } from "../src/controllers/supportController.js";
import { createAuthController } from "../src/controllers/authController.js";
import { createBillingController } from "../src/controllers/billingController.js";
import { createProtect } from "../src/middleware/authMiddleware.js";
import { encryptSecret, decryptSecret } from "../src/utils/integrations.js";
import {
  isPublicIPv4,
  parseTestCases,
  extractDocuments,
} from "../src/services/generationService.js";

process.env.JWT_SECRET = "staff-test-secret";
process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
const res = () => ({
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
const staff = { userId: 1, user: { id: 1, role: "admin", email: "admin@example.com" } };
const manager = { userId: 2, user: { id: 2, role: "manager", email: "manager@example.com" } };

test("blocking rejects self-blocking, requires a reason, and managers cannot block staff", async () => {
  const controller = createAdminController({
    user: { findUnique: async () => ({ role: "admin" }) },
  });
  for (const request of [
    { ...staff, params: { id: "1" }, body: { blocked: true, reason: "test" } },
    { ...staff, params: { id: "5" }, body: { blocked: true } },
    { ...manager, params: { id: "5" }, body: { blocked: true, reason: "test" } },
  ]) {
    const response = res();
    await controller.block(request, response);
    assert.ok([400, 403].includes(response.statusCode));
  }
});

test("blocking and unblocking persist the access state", async () => {
  let saved;
  const controller = createAdminController({
    user: {
      findUnique: async () => ({ role: "student" }),
      update: async ({ data }) => {
        saved = data;
        return { id: 3, ...data };
      },
    },
  });
  const response = res();
  await controller.block(
    { ...manager, params: { id: "3" }, body: { blocked: true, reason: "Policy violation" } },
    response,
  );
  assert.equal(response.statusCode, 200);
  assert.ok(saved.blockedAt instanceof Date);
  assert.equal(saved.blockedReason, "Policy violation");
  await controller.block({ ...manager, params: { id: "3" }, body: { blocked: false } }, res());
  assert.equal(saved.blockedAt, null);
  assert.equal(saved.blockedReason, null);
});

test("a blocked account cannot sign in or use an existing session", async () => {
  const account = {
    id: 3,
    email: "blocked@example.com",
    passwordHash: await bcrypt.hash("test-password", 4),
    blockedAt: new Date(),
  };
  const controller = createAuthController({ user: { findUnique: async () => account } });
  const response = res();
  await controller.signin({ body: { email: account.email, password: "test-password" } }, response);
  assert.equal(response.statusCode, 403);
  const token = jwt.sign({ userId: 3 }, process.env.JWT_SECRET);
  const protectedRes = res();
  await createProtect({ user: { findUnique: async () => account } })(
    { headers: { authorization: `Bearer ${token}` } },
    protectedRes,
    () => assert.fail("Blocked user reached handler"),
  );
  assert.equal(protectedRes.statusCode, 401);
});

test("managers cannot create or promote staff but can edit customer accounts", async () => {
  const controller = createAdminController({
    user: {
      findUnique: async () => ({ role: "student" }),
      update: async ({ data }) => ({ id: 3, ...data }),
    },
  });
  const created = res();
  await controller.create(
    {
      ...manager,
      body: {
        name: "Admin",
        email: "new@example.com",
        workspaceName: "QA",
        role: "admin",
        password: "test-password",
      },
    },
    created,
  );
  assert.equal(created.statusCode, 403);
  const promoted = res();
  await controller.update({ ...manager, params: { id: "3" }, body: { role: "manager" } }, promoted);
  assert.equal(promoted.statusCode, 403);
  const updated = res();
  await controller.update({ ...manager, params: { id: "3" }, body: { name: "Customer" } }, updated);
  assert.equal(updated.statusCode, 200);
});

test("provider secrets are authenticated encrypted values, and public settings omit them", async () => {
  const ciphertext = encryptSecret("provider-test-secret");
  assert.ok(!ciphertext.includes("provider-test-secret"));
  assert.equal(decryptSecret(ciphertext), "provider-test-secret");
  const parts = ciphertext.split(".");
  parts[2] = Buffer.from("tampered").toString("base64");
  assert.throws(() => decryptSecret(parts.join(".")));
  const controller = createStaffController(
    {
      integrationSetting: {
        findUnique: async () => ({
          secretCiphertext: ciphertext,
          enabled: true,
          model: "model-test",
        }),
      },
    },
    null,
  );
  const response = res();
  await controller.integrations({}, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.integrations[0].configured, true);
  assert.ok(!JSON.stringify(response.body).includes("provider-test-secret"));
  assert.ok(!JSON.stringify(response.body).includes(ciphertext));
});

test("only admins can write integration secrets", async () => {
  const response = res();
  await createStaffController({}).saveIntegration(
    { ...manager, params: { provider: "openai" }, body: {} },
    response,
  );
  assert.equal(response.statusCode, 403);
});

test("support ties signed-in contacts to the authenticated user and validates categories", async () => {
  let saved;
  const submit = createSupportController({
    supportRequest: {
      create: async ({ data }) => {
        saved = data;
        return { id: 1 };
      },
    },
  });
  const request = {
    user: { id: 5, name: "Real user", email: "real@example.com" },
    body: {
      name: "Spoof",
      email: "other@example.com",
      subject: "Refund",
      description: "Please review",
      category: "refund",
      userId: 100,
    },
  };
  const response = res();
  await submit(request, response);
  assert.equal(saved.userId, 5);
  assert.equal(saved.email, "real@example.com");
  assert.equal(saved.category, "refund");
  const bad = res();
  await submit({ body: { ...request.body, category: "bogus" } }, bad);
  assert.equal(bad.statusCode, 400);
});

test("message recipients are resolved on the server and content is stored as plain text", async () => {
  let saved;
  const controller = createStaffController({
    user: { findUnique: async () => ({ id: 5, email: "real@example.com" }) },
    userMessage: {
      create: async ({ data }) => {
        saved = data;
        return { id: 9, ...data };
      },
    },
  });
  const response = res();
  await controller.sendMessage(
    {
      ...manager,
      body: {
        recipientId: 5,
        toEmail: "spoof@example.com",
        subject: "Subscription",
        body: "Hello <script>test</script>",
        channel: "in_app",
      },
    },
    response,
  );
  assert.equal(response.statusCode, 201);
  assert.equal(saved.toEmail, "real@example.com");
  assert.equal(saved.senderId, 2);
  assert.equal(saved.deliveryStatus, "sent");
});

test("guests cannot receive in-app messages, and unconfigured email is not recorded as delivered", async () => {
  const controller = createStaffController({
    supportRequest: {
      findUnique: async () => ({ id: 7, email: "guest@example.com", userId: null }),
    },
    integrationSetting: { findUnique: async () => ({ enabled: false }) },
  });
  for (const [channel, expected] of [
    ["in_app", 400],
    ["email", 503],
  ]) {
    const response = res();
    await controller.sendMessage(
      { ...staff, body: { supportRequestId: 7, subject: "Reply", body: "Hello", channel } },
      response,
    );
    assert.equal(response.statusCode, expected);
  }
});

test("user inbox and read status are scoped to the authenticated recipient", async () => {
  const controller = createMessagesController({
    userMessage: {
      findMany: async ({ where }) => {
        assert.equal(where.recipientId, 5);
        assert.equal(where.deliveryStatus, "sent");
        return [];
      },
      updateMany: async ({ where }) => {
        assert.equal(where.recipientId, 5);
        assert.equal(where.id, 20);
        return { count: 0 };
      },
    },
  });
  await controller.list({ userId: 5 }, res());
  const response = res();
  await controller.read({ userId: 5, params: { id: "20" } }, response);
  assert.equal(response.body.updated, 0);
  const denied = res();
  await createMessagesController({ supportRequest: { findFirst: async () => null } }).reply(
    { userId: 5, params: { id: "99" }, body: { body: "Private ticket" } },
    denied,
  );
  assert.equal(denied.statusCode, 404);
});

const validRefund = {
  userId: 5,
  chargeId: "ch_owned",
  amount: 1000,
  operationId: "12345678-1234-4123-8123-123456789abc",
  reason: "Customer request",
};
test("refunds reject payments owned by another customer before any mutation", async () => {
  const controller = createStaffController(
    {
      user: { findUnique: async () => ({ id: 5, stripeCustomerId: "cus_owned" }) },
      refundRecord: { findUnique: async () => null },
    },
    { charges: { retrieve: async () => ({ customer: "cus_other" }) } },
  );
  const response = res();
  await controller.refund({ ...staff, body: validRefund }, response);
  assert.equal(response.statusCode, 403);
});

test("refunds check the remaining balance and use stable Stripe idempotency keys", async () => {
  let saved,
    calls = 0;
  const db = {
    user: { findUnique: async () => ({ id: 5, stripeCustomerId: "cus_owned" }) },
    refundRecord: {
      findUnique: async () => null,
      create: async ({ data }) => {
        saved = data;
      },
      update: async ({ data }) => ({ ...saved, ...data }),
    },
  };
  const stripe = {
    charges: {
      retrieve: async () => ({
        id: "ch_owned",
        customer: "cus_owned",
        paid: true,
        amount: 2000,
        amount_refunded: 500,
        currency: "usd",
      }),
    },
    refunds: {
      create: async (body, options) => {
        calls++;
        assert.equal(body.amount, 1000);
        assert.equal(options.idempotencyKey, `casefy-refund-${validRefund.operationId}`);
        return { id: "re_test", status: "succeeded" };
      },
    },
  };
  const controller = createStaffController(db, stripe);
  const excessive = res();
  await controller.refund({ ...staff, body: { ...validRefund, amount: 2000 } }, excessive);
  assert.equal(excessive.statusCode, 409);
  assert.equal(calls, 0);
  const response = res();
  await controller.refund({ ...staff, body: validRefund }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.refund.stripeRefundId, "re_test");
  assert.equal(saved.actorId, 1);
});

test("retrying a completed refund does not send another Stripe refund", async () => {
  const prior = {
    id: validRefund.operationId,
    userId: 5,
    chargeId: "ch_owned",
    amount: 1000,
    reason: "Customer request",
    stripeRefundId: "re_done",
  };
  const controller = createStaffController(
    {
      user: { findUnique: async () => ({ id: 5, stripeCustomerId: "cus_owned" }) },
      refundRecord: { findUnique: async () => prior },
    },
    {},
  );
  const response = res();
  await controller.refund({ ...staff, body: validRefund }, response);
  assert.equal(response.body.refund.stripeRefundId, "re_done");
  const mismatch = res();
  await controller.refund({ ...staff, body: { ...validRefund, amount: 900 } }, mismatch);
  assert.equal(mismatch.statusCode, 409);
});

test("pending refunds recover provider acceptance after a lost response without creating another refund", async () => {
  const prior = {
    id: validRefund.operationId,
    userId: 5,
    chargeId: "ch_owned",
    amount: 1000,
    reason: "Customer request",
    stripeRefundId: null,
    status: "pending",
  };
  const controller = createStaffController(
    {
      user: { findUnique: async () => ({ id: 5, stripeCustomerId: "cus_owned" }) },
      refundRecord: {
        findUnique: async () => prior,
        update: async ({ data }) => ({ ...prior, ...data }),
      },
    },
    {
      charges: { retrieve: async () => ({ id: "ch_owned", customer: "cus_owned" }) },
      refunds: {
        list: async () => ({
          has_more: false,
          data: [
            {
              id: "re_recovered",
              status: "succeeded",
              metadata: { casefy_operation_id: validRefund.operationId },
            },
          ],
        }),
        create: async () => assert.fail("Duplicate refund attempted"),
      },
    },
  );
  const response = res();
  await controller.refund({ ...staff, body: validRefund }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.refund.stripeRefundId, "re_recovered");
});

test("refund webhooks reconcile current Stripe state and match the original charge", async () => {
  let saved;
  const controller = createBillingController(
    {
      refundRecord: {
        updateMany: async (value) => {
          saved = value;
          return { count: 1 };
        },
      },
    },
    {
      webhooks: {
        constructEvent: () => ({
          livemode: false,
          type: "refund.failed",
          data: { object: { id: "re_test", status: "failed" } },
        }),
      },
      refunds: {
        retrieve: async () => ({
          id: "re_test",
          charge: "ch_owned",
          status: "succeeded",
          metadata: { casefy_operation_id: validRefund.operationId },
        }),
      },
    },
    () => ({ webhookSecret: "test-secret", liveMode: false }),
  );
  const response = res();
  await controller.webhook(
    { body: Buffer.from("test"), headers: { "stripe-signature": "test" } },
    response,
  );
  assert.equal(response.statusCode, 200);
  assert.equal(saved.where.chargeId, "ch_owned");
  assert.equal(saved.data.status, "succeeded");
  assert.equal(saved.data.stripeRefundId, "re_test");
});

test("staff generation bypasses plan quotas and persists results without credits", async () => {
  let saved;
  const db = {
    integrationSetting: {
      findUnique: async () => ({
        enabled: true,
        model: "test-model",
        secretCiphertext: encryptSecret("test"),
      }),
    },
    generationRun: {
      create: async ({ data }) => ({ id: 50, ...data }),
      update: async ({ data }) => {
        saved = data;
        return { id: 50, ...data };
      },
    },
  };
  const controller = createGenerationController(db, async (_db, provider, input) => {
    assert.equal(provider, "openai");
    assert.equal(input.count, 2);
    return { model: "test-model", testCases: [{ title: "Case one" }, { title: "Case two" }] };
  });
  const request = {
    ...manager,
    user: { ...manager.user, plan: "free", monthlyCreditLimit: 1 },
    body: {
      source: "story",
      subject: "Login",
      provider: "openai",
      prompt: "As a user I can sign in",
      filters: { count: 2, priority: "all", testTypes: ["functional"] },
    },
  };
  const response = res();
  await controller.generate(request, response);
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.creditsUsed, 0);
  assert.equal(response.body.unlimited, true);
  assert.equal(saved.testCount, 2);
  const denied = res();
  await controller.generate({ ...request, user: { role: "student" } }, denied);
  assert.equal(denied.statusCode, 403);
});

test("generation rejects invalid counts and private URL addresses", async () => {
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "192.168.1.1",
    "172.16.1.1",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "::1",
    "999.0.0.1",
  ])
    assert.equal(isPublicIPv4(address), false, address);
  assert.equal(isPublicIPv4("8.8.8.8"), true);
  const controller = createGenerationController({});
  const response = res();
  await controller.generate(
    {
      ...staff,
      body: {
        source: "story",
        provider: "openai",
        subject: "Test",
        prompt: "Story",
        filters: { count: 101, priority: "all", testTypes: ["functional"] },
      },
    },
    response,
  );
  assert.equal(response.statusCode, 400);
});

test("text attachments are decoded and generated test results are validated", async () => {
  assert.match(
    await extractDocuments([
      {
        name: "requirements.txt",
        content: Buffer.from("Login must require a password").toString("base64"),
      },
    ]),
    /Login must require a password/,
  );
  const cases = parseTestCases(
    '```json\n{"testCases":[{"title":"Login","steps":["Enter credentials"],"expectedResult":"Dashboard appears","priority":"high"}]}\n```',
    1,
  );
  assert.equal(cases.length, 1);
  assert.throws(() => parseTestCases('{"testCases":[{"title":"Missing results"}]}', 1));
  assert.throws(() => parseTestCases("not json", 1));
});

test("customer reports cannot read another user's results", async () => {
  const controller = createStaffController({
    generationRun: {
      findFirst: async ({ where }) => {
        assert.equal(where.userId, 5);
        assert.equal(where.id, 20);
        return null;
      },
    },
  });
  const response = res();
  await controller.report({ userId: 5, user: { role: "student" }, params: { id: "20" } }, response);
  assert.equal(response.statusCode, 404);
});
