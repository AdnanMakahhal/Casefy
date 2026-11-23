import prisma from "../db.js";
import { ensureCredits } from "../services/creditService.js";
import { staffFailure } from "./staffController.js";

export async function getCredits(req, res) {
  try {
    const state = await prisma.$transaction((tx) => ensureCredits(tx, req.userId), { timeout: 20000 });
    const page = Number(req.query.page || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 1000000) return res.status(400).json({ message: "Invalid page." });
    const where = { userId: req.userId, periodStart: state.periodStart };
    const [entries, total, breakdown] = await Promise.all([
      prisma.creditEntry.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 20, take: 20 }),
      prisma.creditEntry.count({ where }),
      prisma.creditEntry.groupBy({ by: ["kind"], where, _sum: { amount: true }, _count: { _all: true } }),
    ]);
    res.json({ balance: state.balance, allowance: state.allowance, unlimited: state.unlimited, periodStart: state.periodStart, periodEnd: state.periodEnd, entries, total, page, pageSize: 20, breakdown });
  } catch (error) { return staffFailure(res, error); }
}
