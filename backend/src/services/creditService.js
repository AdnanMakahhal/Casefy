import { effectiveUser, planLimits } from "../utils/subscriptions.js";

export function creditPeriod(user, now = new Date()) {
  const anchor = new Date(user.subscriptionStartedAt || user.complimentaryStartsAt || user.createdAt || now);
  const day = anchor.getUTCDate();
  const boundary = (offset) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1, anchor.getUTCHours(), anchor.getUTCMinutes(), anchor.getUTCSeconds(), anchor.getUTCMilliseconds()));
    const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, last));
    return date;
  };
  const offset = boundary(0) > now ? -1 : 0;
  return { start: boundary(offset), end: boundary(offset + 1) };
}

export function creditAllowance(user) {
  const account = effectiveUser(user);
  if (account.plan === "ultra") return null;
  return account.monthlyCreditLimit ?? planLimits[account.plan]?.credits ?? 100;
}

// Every grant and debit locks the same account row. Concurrent requests cannot overspend.
export async function ensureCredits(tx, userId, now = new Date()) {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
  const { start, end } = creditPeriod(user, now);
  const allowance = creditAllowance(user);
  if (allowance === null) {
    return { user, allowance: null, balance: null, unlimited: true, periodStart: start, periodEnd: end };
  }
  const where = { userId, periodStart: start, NOT: { kind: { startsWith: "unlimited_" } } };
  const granted = await tx.creditEntry.aggregate({ where: { ...where, kind: "allowance" }, _sum: { amount: true } });
  const previous = granted._sum.amount || 0;
  if (previous < allowance) {
    await tx.creditEntry.create({ data: {
      userId, amount: allowance - previous, kind: "allowance",
      description: previous ? "Plan allowance increase" : "Monthly plan allowance",
      operationKey: `allowance:${userId}:${start.toISOString()}:${allowance}`,
      periodStart: start, periodEnd: end,
    } });
  }
  const total = await tx.creditEntry.aggregate({ where, _sum: { amount: true } });
  return { user, allowance, balance: total._sum.amount || 0, unlimited: false, periodStart: start, periodEnd: end };
}

export async function spendCredits(tx, { userId, amount, operationKey, description, kind = "generation_text", generationRunId }, now = new Date()) {
  if (!Number.isSafeInteger(amount) || amount < 1) throw new Error("Credit cost must be a positive whole number.");
  const state = await ensureCredits(tx, userId, now);
  const existing = await tx.creditEntry.findUnique({ where: { operationKey } });
  if (existing) {
    if (existing.userId !== userId || existing.amount !== -amount) throw Object.assign(new Error("Credit operation conflicts with an earlier request."), { status: 409 });
    return existing;
  }
  if (!state.unlimited && state.balance < amount) throw Object.assign(new Error("Not enough credits. Upgrade your plan or contact support."), { status: 402 });
  // Track usage without charging a later, limited plan for activity performed on Ultra.
  return tx.creditEntry.create({ data: { userId, amount: -amount, kind: state.unlimited ? `unlimited_${kind}` : kind, operationKey, description, generationRunId, periodStart: state.periodStart, periodEnd: state.periodEnd } });
}
