import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import express from "express";
import { createAdminController } from "../controllers/adminController.js";
import { allowRoles } from "../middleware/authMiddleware.js";

const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const account = { name: " Ada ", email: " ADA@example.com ", workspaceName: " QA ", role: "admin", plan: "enterprise", seatLimit: 5, projectLimit: 300, monthlyCreditLimit: 50000, password: "test-password" };

test("admin creates an account with hashed credentials and custom limits, excluding sensitive fields", async () => {
  const controller = createAdminController({ user: { create: async ({ data, select }) => {
    assert.equal(data.name, "Ada"); assert.equal(data.email, "ada@example.com"); assert.equal(data.workspaceName, "QA");
    assert.equal(data.role, "admin"); assert.equal(data.plan, "enterprise");
    assert.equal(data.seatLimit, 5); assert.equal(data.projectLimit, 300); assert.equal(data.monthlyCreditLimit, 50000);
    assert.equal(await bcrypt.compare(account.password, data.passwordHash), true);
    assert.equal(data.password, undefined); assert.equal(select.passwordHash, undefined); assert.equal(select.stripeCustomerId, undefined);
    return { id: 1, email: data.email };
  } } });
  const res = response(); await controller.create({ body: account }, res);
  assert.equal(res.statusCode, 201); assert.equal(res.body.user.email, "ada@example.com");
});

test("invalid roles, plans, credentials and limits never reach the database", async () => {
  const controller = createAdminController({});
  for (const change of [{ role: "owner" }, { plan: "unknown" }, { seatLimit: 0 }, { projectLimit: 1.5 }, { monthlyCreditLimit: "50000" }, { seatLimit: 2147483648 }, { password: "short" }, { password: "é".repeat(40) }, { email: "bad" }, { workspaceName: "" }]) {
    const res = response(); await controller.create({ body: { ...account, ...change } }, res); assert.equal(res.statusCode, 400);
  }
});

test("users cannot remove their own admin access or delete themselves", async () => {
  const controller = createAdminController({});
  const res = response(); await controller.update({ params: { id: "7" }, userId: 7, body: { role: "student" } }, res); assert.equal(res.statusCode, 400);
  const deleted = response(); await controller.remove({ params: { id: "7" }, userId: 7 }, deleted); assert.equal(deleted.statusCode, 400);
});

test("updates allow null limit overrides and ignore password or billing injection", async () => {
  const controller = createAdminController({ user: { update: async ({ where, data }) => {
    assert.equal(where.id, 8); assert.deepEqual(data, { plan: "pro", seatLimit: null }); return { id: 8, ...data };
  } } });
  const res = response(); await controller.update({ params: { id: "8" }, userId: 7, body: { plan: "pro", seatLimit: null, passwordHash: "injected", stripeSubscriptionId: "injected" } }, res); assert.equal(res.statusCode, 200);
});

test("listing searches multiple fields, filters and paginates without exposing passwords", async () => {
  const controller = createAdminController({ user: {
    findMany: async ({ where, select, skip, take }) => {
      assert.equal(where.role, "admin"); assert.equal(where.AND[0].OR[0].plan, "enterprise"); assert.equal(where.OR.length, 3);
      assert.deepEqual(where.OR[1], { email: { contains: "ada", mode: "insensitive" } });
      assert.equal(skip, 20); assert.equal(take, 20); assert.equal(select.passwordHash, undefined); return [];
    }, count: async () => 21,
  } });
  const res = response(); await controller.list({ query: { search: "ada", role: "admin", plan: "enterprise", page: "2" } }, res); assert.equal(res.body.total, 21); assert.equal(res.body.pageSize, 20);
  for (const query of [{ page: "0" }, { page: "1.5" }, { role: "owner" }, { plan: "invalid" }]) {
    const bad = response(); await controller.list({ query }, bad); assert.equal(bad.statusCode, 400);
  }
});

test("duplicate emails and missing users return useful errors", async () => {
  for (const [code, expected] of [["P2002", 409], ["P2025", 404]]) {
    const controller = createAdminController({ user: { update: async () => { throw { code }; } } });
    const res = response(); await controller.update({ params: { id: "8" }, userId: 7, body: { name: "Ada" } }, res); assert.equal(res.statusCode, expected);
  }
});

test("renaming the primary workspace cannot duplicate an additional workspace", async () => {
  const controller = createAdminController({ user: { findUnique: async () => ({ workspaceNames: ["QA Team"] }) } });
  const res = response();
  await controller.update({ params: { id: "8" }, userId: 7, body: { workspaceName: " qa   team " } }, res);
  assert.equal(res.statusCode, 409);
});

test("pending billing checkouts must be closed before admin deletion", async () => {
  const controller = createAdminController({ user: { findUnique: async () => ({ stripeCheckoutSessionId: "cs_pending" }) } });
  const res = response(); await controller.remove({ params: { id: "8" }, userId: 7 }, res); assert.equal(res.statusCode, 409);
});

test("deletion guards live billing subscriptions and deletes canceled accounts", async () => {
  let deleted = false;
  const controller = createAdminController({ user: {
    findUnique: async () => ({ stripeSubscriptionId: "sub_live", subscriptionStatus: "active" }), delete: async () => { deleted = true; },
  } });
  const res = response(); await controller.remove({ params: { id: "8" }, userId: 7 }, res); assert.equal(res.statusCode, 409); assert.equal(deleted, false);
  const safe = createAdminController({ user: { findUnique: async () => ({ stripeSubscriptionId: null }), delete: async () => { deleted = true; } } });
  const done = response(); await safe.remove({ params: { id: "8" }, userId: 7 }, done); assert.equal(done.statusCode, 200); assert.equal(deleted, true);
});

test("overview returns live totals, plan distribution and recent accounts", async () => {
  const controller = createAdminController({ user: {
    count: async (query) => query ? 2 : 12,
    groupBy: async () => [{ plan: "enterprise", _count: { _all: 3 } }],
    findMany: async ({ take, select }) => { assert.equal(take, 5); assert.equal(select.passwordHash, undefined); return [{ id: 1 }]; },
  }, project: { count: async () => 9 }, generationRun: { aggregate: async () => ({ _sum: { testCount: 25 } }), count: async () => 3 } });
  const res = response(); await controller.overview({}, res); assert.equal(res.body.totalUsers, 12); assert.equal(res.body.newUsersToday, 2); assert.equal(res.body.totalProjects, 9); assert.equal(res.body.totalTestCases, 25); assert.equal(res.body.totalGenerations, 3);
});

test("HTTP role guards share customer management with managers and reserve integrations for admins", async () => {
  const app = express();
  app.use((req, _res, next) => { if (req.headers["x-test-role"]) req.user = { role: req.headers["x-test-role"] }; next(); });
  app.use(allowRoles("admin", "manager"));
  app.get("/users", (_req, res) => res.json({ ok: true }));
  app.post("/users", (_req, res) => res.json({ ok: true }));
  app.put("/integrations", allowRoles("admin"), (_req, res) => res.json({ ok: true }));
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve) => server.listening ? resolve() : server.once("listening", resolve));
    const url = `http://127.0.0.1:${server.address().port}/users`;
    for (const [role, get, post] of [["admin", 200, 200], ["manager", 200, 200], ["student", 403, 403], ["", 401, 401]]) {
      const headers = role ? { "x-test-role": role } : {};
      assert.equal((await fetch(url, { headers })).status, get);
      assert.equal((await fetch(url, { method: "POST", headers })).status, post);
      assert.equal((await fetch(url.replace("/users", "/integrations"), { method: "PUT", headers })).status, role === "admin" ? 200 : role ? 403 : 401);
    }
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
