import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createAuthController } from "../controllers/authController.js";
import { createProtect, allowRoles } from "../middleware/authMiddleware.js";

// All database access in these tests is injected. No connection is made.
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-only-secret";

function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}
const baseUser = { id: 7, name: "Ada", email: "ada@example.com", workspaceName: "QA team", createdAt: new Date() };
const passwordHash = await bcrypt.hash("correct-password", 4);

for (const role of ["admin", "manager", "student", "qa_engineer", "employee", "developer"]) {
  test(`login routes ${role} using the database role and omits the password hash`, async () => {
    const { signin } = createAuthController({ user: { findUnique: async ({ where }) => {
      assert.equal(where.email, baseUser.email);
      return { ...baseUser, role, passwordHash };
    } } });
    const res = response();
    await signin({ body: { email: " ADA@example.com ", password: "correct-password", role: "admin" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.redirectTo, ["admin", "manager"].includes(role) ? "/admin" : "/dashboard");
    assert.equal(res.body.user.role, role);
    assert.equal(res.body.user.passwordHash, undefined);
    assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).userId, baseUser.id);
  });
}

test("incorrect passwords and unknown emails do not create sessions", async () => {
  for (const row of [null, { ...baseUser, role: "student", passwordHash }]) {
    const { signin } = createAuthController({ user: { findUnique: async () => row } });
    const res = response();
    await signin({ body: { email: baseUser.email, password: "wrong-password" } }, res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.token, undefined);
  }
});

for (const role of ["admin", "manager"]) {
  test(`public signup cannot assign ${role}`, async () => {
    const { signup } = createAuthController({});
    const res = response();
    await signup({ body: { ...baseUser, password: "correct-password", role } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.token, undefined);
  });
}

test("signup normalizes details, hashes passwords, and saves only the users model", async () => {
  const { signup } = createAuthController({ user: { create: async ({ data, select }) => {
    assert.equal(data.name, "Ada");
    assert.equal(data.email, baseUser.email);
    assert.equal(data.workspaceName, "QA team");
    assert.equal(await bcrypt.compare("correct-password", data.passwordHash), true);
    assert.equal(data.password, undefined);
    assert.equal(select.passwordHash, undefined);
    return { ...baseUser, role: "qa_engineer" };
  } } });
  const res = response();
  await signup({ body: { name: " Ada ", email: " ADA@example.com ", workspaceName: " QA team ", role: "qa_engineer", password: "correct-password" } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.redirectTo, "/dashboard");
});

test("duplicate email returns a conflict", async () => {
  const { signup } = createAuthController({ user: { create: async () => { throw { code: "P2002" }; } } });
  const res = response();
  await signup({ body: { ...baseUser, role: "student", password: "correct-password" } }, res);
  assert.equal(res.statusCode, 409);
});

test("workspace is required before creating an account", async () => {
  const { signup } = createAuthController({});
  const res = response();
  await signup({ body: { ...baseUser, workspaceName: "  ", role: "student", password: "correct-password" } }, res);
  assert.equal(res.statusCode, 400);
});

test("admin authorization uses the current database role even when a token claims admin", async () => {
  const token = jwt.sign({ userId: baseUser.id, role: "admin" }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = response();
  const protect = createProtect({ user: { findUnique: async () => ({ ...baseUser, role: "student" }) } });
  let allowed = false;
  await protect(req, res, () => allowRoles("admin", "manager")(req, res, () => { allowed = true; }));
  assert.equal(allowed, false);
  assert.equal(res.statusCode, 403);
});

test("only Admin and Manager accounts can access the admin API", () => {
  for (const role of ["admin", "manager", "student", "qa_engineer", "employee", "developer"]) {
    let allowed = false;
    const res = response();
    allowRoles("admin", "manager")({ user: { role } }, res, () => { allowed = true; });
    assert.equal(allowed, ["admin", "manager"].includes(role));
    assert.equal(res.statusCode, allowed ? 200 : 403);
  }
});

test("missing, invalid and expired tokens cannot access protected endpoints", async () => {
  const protect = createProtect({});
  const expired = jwt.sign({ userId: 7 }, process.env.JWT_SECRET, { expiresIn: -1 });
  for (const authorization of [undefined, "Bearer invalid", `Bearer ${expired}`]) {
    const res = response();
    await protect({ headers: { authorization } }, res, () => assert.fail("Unauthorized request passed"));
    assert.equal(res.statusCode, 401);
  }
});

test("deleted accounts lose access even with a valid token", async () => {
  const protect = createProtect({ user: { findUnique: async () => null } });
  const res = response();
  await protect({ headers: { authorization: `Bearer ${jwt.sign({ userId: 7 }, process.env.JWT_SECRET)}` } }, res, () => assert.fail("Deleted user passed"));
  assert.equal(res.statusCode, 401);
});

test("profile updates cannot promote users or downgrade privileged users", async () => {
  const { updateMe } = createAuthController({});
  for (const currentRole of ["student", "admin", "manager"]) {
    for (const requestedRole of ["admin", "manager"]) {
      const res = response();
      await updateMe({ user: { ...baseUser, role: currentRole }, body: { role: requestedRole, workspaceName: "QA" } }, res);
      assert.equal(res.statusCode, currentRole === "student" ? 400 : 403);
    }
  }
});

test("profile reads and updates return database data without changing another account", async () => {
  const { getMe, updateMe } = createAuthController({ user: { update: async ({ where, data, select }) => {
    assert.deepEqual(where, { id: baseUser.id });
    assert.deepEqual(data, { role: "developer", workspaceName: "New team" });
    assert.equal(select.passwordHash, undefined);
    return { ...baseUser, ...data };
  } } });
  const req = { user: { ...baseUser, role: "student" }, body: { id: 99, role: "developer", workspaceName: " New team " } };
  const updateResponse = response();
  await updateMe(req, updateResponse);
  assert.equal(updateResponse.body.workspaceName, "New team");
  const meResponse = response();
  getMe(req, meResponse);
  assert.equal(meResponse.body.id, baseUser.id);
});
