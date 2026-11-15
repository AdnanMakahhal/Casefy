import bcrypt from "bcryptjs";
import prisma from "../db.js";
import { normalizeWorkspaceName } from "../utils/workspaces.js";
import { effectiveUser, effectivePlanFilter } from "../utils/subscriptions.js";
import { paypalBlocksCheckout } from "../utils/paypal.js";

const roles = new Set(["admin", "manager", "qa_engineer", "student", "employee", "developer"]);
const plans = new Set(["free", "plus", "pro", "enterprise"]);
const select = {
  id: true,
  name: true,
  email: true,
  role: true,
  plan: true,
  paypalPlan: true,
  paypalStatus: true,
  paypalPeriodEnd: true,
  complimentaryPlan: true,
  complimentaryStartsAt: true,
  complimentaryEndsAt: true,
  blockedAt: true,
  blockedReason: true,
  workspaceName: true,
  seatLimit: true,
  projectLimit: true,
  monthlyCreditLimit: true,
  createdAt: true,
  _count: { select: { projects: true } },
};
const validId = (value) =>
  /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0;

function accountData(body, creating) {
  const data = {};
  for (const [field, max] of [
    ["name", 100],
    ["email", 254],
    ["workspaceName", 80],
  ]) {
    if (!creating && body[field] === undefined) continue;
    if (typeof body[field] !== "string" || !body[field].trim() || body[field].trim().length > max)
      throw new Error(
        `Please provide a valid ${field === "workspaceName" ? "workspace name" : field}.`,
      );
    data[field] = body[field].trim();
  }
  if (data.email) {
    data.email = data.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      throw new Error("Please provide a valid email address.");
  }
  for (const [field, values] of [
    ["role", roles],
    ["plan", plans],
  ]) {
    if (body[field] !== undefined) {
      if (!values.has(body[field])) throw new Error(`Please choose a valid ${field}.`);
      data[field] = body[field];
    }
  }
  for (const field of ["seatLimit", "projectLimit", "monthlyCreditLimit"]) {
    if (body[field] === undefined) continue;
    if (
      body[field] !== null &&
      (!Number.isInteger(body[field]) || body[field] < 1 || body[field] > 2147483647)
    )
      throw new Error("Limits must be positive whole numbers, or blank to use plan defaults.");
    data[field] = body[field];
  }
  if (
    creating &&
    (typeof body.password !== "string" ||
      body.password.length < 8 ||
      Buffer.byteLength(body.password, "utf8") > 72)
  )
    throw new Error("Password must be at least 8 characters and no more than 72 bytes.");
  return data;
}

function failure(res, error) {
  if (error.code === "P2002") return res.status(409).json({ message: "Email already registered." });
  if (error.code === "P2025") return res.status(404).json({ message: "User not found." });
  if (error.code === "P2003")
    return res.status(409).json({
      message: "This account has financial records and must be retained. Block access instead.",
    });
  console.error("Admin request failed:", error.code || error.name);
  return res
    .status(500)
    .json({ message: "Unable to complete the admin request. Please try again." });
}

export function createAdminController(db = prisma) {
  return {
    async overview(_req, res) {
      try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const [
          totalUsers,
          newUsersToday,
          totalProjects,
          planCounts,
          recentUsers,
          testSummary,
          totalGenerations,
        ] = await Promise.all([
          db.user.count(),
          db.user.count({ where: { createdAt: { gte: today } } }),
          db.project.count(),
          db.user.groupBy({ by: ["plan"], _count: { _all: true } }),
          db.user.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 5, select }),
          db.generationRun.aggregate({ where: { status: "completed" }, _sum: { testCount: true } }),
          db.generationRun.count(),
        ]);
        return res.json({
          totalUsers,
          newUsersToday,
          totalProjects,
          planCounts,
          recentUsers,
          totalTestCases: testSummary._sum.testCount || 0,
          totalGenerations,
        });
      } catch (error) {
        return failure(res, error);
      }
    },
    async list(req, res) {
      const page = Number(req.query.page || 1);
      if (!Number.isSafeInteger(page) || page < 1 || page > 1000000)
        return res.status(400).json({ message: "Invalid page." });
      const search =
        typeof req.query.search === "string" ? req.query.search.trim().slice(0, 254) : "";
      if (
        (req.query.role && !roles.has(req.query.role)) ||
        (req.query.plan && !plans.has(req.query.plan))
      )
        return res.status(400).json({ message: "Invalid filter." });
      if (req.query.access && !["active", "blocked"].includes(req.query.access))
        return res.status(400).json({ message: "Invalid access filter." });
      const sorts = { newest: { id: "desc" }, oldest: { id: "asc" }, name: { name: "asc" } };
      if (req.query.sort && !sorts[req.query.sort])
        return res.status(400).json({ message: "Invalid sort." });
      const where = {
        ...(search
          ? {
              OR: ["name", "email", "workspaceName"].map((field) => ({
                [field]: { contains: search, mode: "insensitive" },
              })),
            }
          : {}),
        ...(req.query.role ? { role: req.query.role } : {}),
        ...(req.query.plan ? { AND: [effectivePlanFilter(req.query.plan)] } : {}),
        ...(req.query.access
          ? { blockedAt: req.query.access === "blocked" ? { not: null } : null }
          : {}),
      };
      try {
        const [users, total] = await Promise.all([
          db.user.findMany({
            where,
            select,
            orderBy: sorts[req.query.sort || "newest"],
            skip: (page - 1) * 20,
            take: 20,
          }),
          db.user.count({ where }),
        ]);
        return res.json({
          users: users.map((user) => effectiveUser(user)),
          total,
          page,
          pageSize: 20,
        });
      } catch (error) {
        return failure(res, error);
      }
    },
    async create(req, res) {
      let data;
      try {
        data = accountData(req.body || {}, true);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
      if (req.user?.role === "manager" && ["admin", "manager"].includes(data.role))
        return res.status(403).json({ message: "Only administrators can create staff accounts." });
      try {
        data.passwordHash = await bcrypt.hash(req.body.password, 10);
        return res.status(201).json({ user: await db.user.create({ data, select }) });
      } catch (error) {
        return failure(res, error);
      }
    },
    async update(req, res) {
      if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid user ID." });
      let data;
      try {
        data = accountData(req.body || {}, false);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
      if (Number(req.params.id) === req.userId && data.role && data.role !== "admin")
        return res.status(400).json({ message: "You cannot remove your own admin access." });
      if (!Object.keys(data).length)
        return res.status(400).json({ message: "No account changes provided." });
      try {
        if (req.user?.role === "manager") {
          const target = await db.user.findUnique({
            where: { id: Number(req.params.id) },
            select: { role: true },
          });
          if (!target) return res.status(404).json({ message: "User not found." });
          if (
            ["admin", "manager"].includes(target.role) ||
            ["admin", "manager"].includes(data.role)
          )
            return res.status(403).json({
              message: "Only administrators can change staff accounts or grant staff roles.",
            });
        }
        if (data.workspaceName) {
          const account = await db.user.findUnique({
            where: { id: Number(req.params.id) },
            select: { workspaceNames: true },
          });
          if (!account) return res.status(404).json({ message: "User not found." });
          if (
            account.workspaceNames.some(
              (name) => normalizeWorkspaceName(name) === normalizeWorkspaceName(data.workspaceName),
            )
          )
            return res
              .status(409)
              .json({ message: "That user already has another workspace with this name." });
        }
        return res.json({
          user: await db.user.update({ where: { id: Number(req.params.id) }, data, select }),
        });
      } catch (error) {
        return failure(res, error);
      }
    },
    async remove(req, res) {
      if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid user ID." });
      if (Number(req.params.id) === req.userId)
        return res.status(400).json({ message: "You cannot delete your own admin account." });
      try {
        const account = await db.user.findUnique({
          where: { id: Number(req.params.id) },
          select: {
            role: true,
            stripeSubscriptionId: true,
            subscriptionStatus: true,
            stripeCheckoutSessionId: true,
            paypalSubscriptionId: true,
            paypalStatus: true,
          },
        });
        if (!account) return res.status(404).json({ message: "User not found." });
        if (paypalBlocksCheckout(account))
          return res.status(409).json({
            message: "Cancel this user's PayPal subscription before deleting their account.",
          });
        if (req.user?.role === "manager" && ["admin", "manager"].includes(account.role))
          return res
            .status(403)
            .json({ message: "Only administrators can delete staff accounts." });
        if (
          account.stripeSubscriptionId &&
          !["canceled", "incomplete_expired"].includes(account.subscriptionStatus)
        )
          return res.status(409).json({
            message: "Cancel this user's billing subscription before deleting their account.",
          });
        if (account.stripeCheckoutSessionId)
          return res.status(409).json({
            message:
              "This account has a billing checkout. Delete it through the account profile to close billing safely.",
          });
        await db.user.delete({ where: { id: Number(req.params.id) } });
        return res.json({ message: "User deleted." });
      } catch (error) {
        return failure(res, error);
      }
    },
    async block(req, res) {
      if (!validId(req.params.id) || typeof req.body?.blocked !== "boolean")
        return res.status(400).json({ message: "Choose a valid account and access status." });
      if (Number(req.params.id) === req.userId)
        return res.status(400).json({ message: "You cannot block your own account." });
      const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";
      if (reason.length > 500 || (req.body.blocked && !reason))
        return res
          .status(400)
          .json({ message: "Provide a blocking reason between 1 and 500 characters." });
      try {
        const target = await db.user.findUnique({
          where: { id: Number(req.params.id) },
          select: { role: true },
        });
        if (!target) return res.status(404).json({ message: "User not found." });
        if (req.user?.role === "manager" && ["admin", "manager"].includes(target.role))
          return res.status(403).json({ message: "Only administrators can block staff accounts." });
        const user = await db.user.update({
          where: { id: Number(req.params.id) },
          data: {
            blockedAt: req.body.blocked ? new Date() : null,
            blockedReason: req.body.blocked ? reason : null,
          },
          select,
        });
        return res.json({ user });
      } catch (error) {
        return failure(res, error);
      }
    },
  };
}

export const adminController = createAdminController();
