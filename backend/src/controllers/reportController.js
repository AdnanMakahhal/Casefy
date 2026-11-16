import prisma from "../db.js";

export const isId = (value) =>
  /^\d+$/.test(String(value)) &&
  Number.isSafeInteger(Number(value)) &&
  Number(value) > 0;
function pageOptions(query) {
  const page = Number(query.page || 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000)
    throw Object.assign(new Error("Invalid page."), { status: 400 });
  return { page, skip: (page - 1) * 20, take: 20 };
}

function reportFailure(res, error) {
  if (error.status)
    return res.status(error.status).json({ message: error.message });
  console.error("Report request failed:", error.code || error.name);
  return res
    .status(500)
    .json({ message: "Unable to load reports. Please try again." });
}

export function createReportController(db = prisma) {
  return {
    async reports(req, res) {
      try {
        const { page, skip, take } = pageOptions(req.query);
        const where = { userId: req.userId };
        const [runs, total, summary] = await Promise.all([
          db.generationRun.findMany({
            where,
            skip,
            take,
            orderBy: { id: "desc" },
            select: {
              id: true,
              subject: true,
              source: true,
              provider: true,
              model: true,
              requestedCount: true,
              testCount: true,
              status: true,
              error: true,
              createdAt: true,
              user: { select: { name: true, email: true } },
            },
          }),
          db.generationRun.count({ where }),
          db.generationRun.groupBy({
            by: ["status"],
            where,
            _count: { _all: true },
            _sum: { testCount: true },
          }),
        ]);
        return res.json({ runs, total, page, pageSize: take, summary });
      } catch (error) {
        return reportFailure(res, error);
      }
    },
    async report(req, res) {
      if (!isId(req.params.id))
        return res.status(400).json({ message: "Invalid report." });
      try {
        const where = {
          id: Number(req.params.id),
          userId: req.userId,
        };
        const run = await db.generationRun.findFirst({ where });
        if (!run) return res.status(404).json({ message: "Report not found." });
        return res.json({ run });
      } catch (error) {
        return reportFailure(res, error);
      }
    },
  };
}

export const reportController = createReportController();
