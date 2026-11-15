import assert from "node:assert/strict";
import { test } from "node:test";
import { siteOrigin } from "../utils/siteOrigin.js";
import { createHmac } from "node:crypto";

test("Vercel checkout uses its stable project domain", () => {
  assert.equal(siteOrigin({ VERCEL: "1", VERCEL_PROJECT_PRODUCTION_URL: "casefy.vercel.app", VERCEL_URL: "casefy-preview.vercel.app" }), "https://casefy.vercel.app");
  assert.equal(siteOrigin({ VERCEL: "1", VERCEL_URL: "casefy-preview.vercel.app" }), "https://casefy-preview.vercel.app");
});
test("a configured custom domain overrides automatic Vercel domains", () => {
  assert.equal(siteOrigin({ VERCEL: "1", FRONTEND_URL: "https://app.example.com/", VERCEL_PROJECT_PRODUCTION_URL: "casefy.vercel.app" }), "https://app.example.com");
});
test("Vercel cannot silently send customers back to localhost or insecure URLs", () => {
  for (const FRONTEND_URL of ["http://localhost:5173", "https://127.0.0.1", "http://example.com", "https://user:password@example.com", "javascript:alert(1)"]) {
    assert.throws(() => siteOrigin({ VERCEL: "1", FRONTEND_URL }));
  }
  assert.throws(() => siteOrigin({ VERCEL: "1" }));
  assert.equal(siteOrigin({}), "http://localhost:5173");
});

test("the serverless entry exports Express, serves health, and preserves raw Stripe webhooks", async () => {
  process.env.JWT_SECRET ||= "deployment-test-only-secret";
  process.env.STRIPE_SECRET_KEY ||= "sk_test_deployment_fixture";
  process.env.STRIPE_WEBHOOK_SECRET ||= "whsec_deployment_fixture";
  const { default: app } = await import("../../api/index.js");
  assert.equal(typeof app, "function");
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.listening ? resolve() : server.once("listening", resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const health = await fetch(`${origin}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok" });
    assert.equal((await fetch(`${origin}/api/auth/workspaces`)).status, 401);
    const invalid = await fetch(`${origin}/api/billing/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": "invalid" }, body: '{ "id": "unsigned" }' });
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).message, "Invalid webhook signature");
    const payload = '{\n "id": "evt_deployment_fixture", "type": "fixture.ignored", "livemode": false, "data": {"object": {}}\n}';
    const timestamp = Math.floor(Date.now() / 1000);
    const digest = createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.${payload}`).digest("hex");
    const signed = await fetch(`${origin}/api/billing/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": `t=${timestamp},v1=${digest}` }, body: payload });
    assert.equal(signed.status, 200);
    assert.deepEqual(await signed.json(), { received: true });
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
