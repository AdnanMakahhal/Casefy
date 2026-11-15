import assert from "node:assert/strict";
import { test } from "node:test";
import { siteOrigin } from "../src/utils/siteOrigin.js";
import { createHmac } from "node:crypto";

test("the website origin uses explicit configuration or the local development default", () => {
  assert.equal(siteOrigin({ FRONTEND_URL: "https://app.example.com/" }), "https://app.example.com");
  assert.equal(siteOrigin({}), "http://localhost:5173");
});
test("production return URLs require a public HTTPS website", () => {
  for (const FRONTEND_URL of [
    "http://localhost:5173",
    "https://127.0.0.1",
    "http://example.com",
    "https://user:password@example.com",
    "javascript:alert(1)",
  ])
    assert.throws(() => siteOrigin({ NODE_ENV: "production", FRONTEND_URL }));
  assert.throws(() => siteOrigin({ NODE_ENV: "production" }));
  assert.equal(
    siteOrigin({ NODE_ENV: "production", FRONTEND_URL: "https://app.example.com" }),
    "https://app.example.com",
  );
});

test("the backend app exports Express, serves health, and preserves raw Stripe webhooks", async () => {
  process.env.JWT_SECRET ||= "deployment-test-only-secret";
  process.env.STRIPE_SECRET_KEY ||= "sk_test_deployment_fixture";
  process.env.STRIPE_WEBHOOK_SECRET ||= "whsec_deployment_fixture";
  const { default: app } = await import("../src/app.js");
  assert.equal(typeof app, "function");
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) =>
      server.listening ? resolve() : server.once("listening", resolve),
    );
    const origin = `http://127.0.0.1:${server.address().port}`;
    const health = await fetch(`${origin}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok" });
    assert.equal((await fetch(`${origin}/api/auth/workspaces`)).status, 401);
    const invalid = await fetch(`${origin}/api/billing/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "stripe-signature": "invalid" },
      body: '{ "id": "unsigned" }',
    });
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).message, "Invalid webhook signature");
    const payload =
      '{\n "id": "evt_deployment_fixture", "type": "fixture.ignored", "livemode": false, "data": {"object": {}}\n}';
    const timestamp = Math.floor(Date.now() / 1000);
    const digest = createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET)
      .update(`${timestamp}.${payload}`)
      .digest("hex");
    const signed = await fetch(`${origin}/api/billing/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": `t=${timestamp},v1=${digest}`,
      },
      body: payload,
    });
    assert.equal(signed.status, 200);
    assert.deepEqual(await signed.json(), { received: true });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
