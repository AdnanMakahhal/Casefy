import prisma from "../db.js";
import {
  extractDocuments,
  generateTestCases,
  readPublicPage,
} from "../services/generationService.js";
import { staffFailure } from "./staffController.js";
import { getIntegration } from "../utils/integrations.js";

const runningUsers = new Set();
export function createGenerationController(
  db = prisma,
  generate = generateTestCases,
  readPage = readPublicPage,
  extract = extractDocuments,
) {
  return {
    async providers(_req, res) {
      try {
        const providers = await Promise.all(
          ["openai", "deepseek", "gemini"].map(async (provider) => {
            const integration = await getIntegration(db, provider);
            return {
              provider,
              model: integration.model,
              available: Boolean(integration.secret) && integration.enabled,
            };
          }),
        );
        return res.json({ providers });
      } catch (error) {
        return staffFailure(res, error);
      }
    },
    async generate(req, res) {
      if (!["admin", "manager"].includes(req.user.role))
        return res
          .status(403)
          .json({
            message:
              "Staff generation is available to administrators and managers.",
          });
      const body = req.body || {};
      const count = body.filters?.count;
      if (
        !["story", "documents", "url"].includes(body.source) ||
        !["openai", "deepseek", "gemini"].includes(body.provider) ||
        !Number.isSafeInteger(count) ||
        count < 1 ||
        count > 100 ||
        typeof body.prompt !== "string" ||
        body.prompt.length > 100000 ||
        typeof body.subject !== "string" ||
        !body.subject.trim() ||
        body.subject.length > 160 ||
        !Array.isArray(body.filters?.testTypes) ||
        !body.filters.testTypes.length ||
        body.filters.testTypes.some(
          (type) =>
            ![
              "functional",
              "positive",
              "negative",
              "edge",
              "security",
              "accessibility",
            ].includes(type),
        ) ||
        !["all", "high", "medium", "low"].includes(body.filters?.priority)
      )
        return res.status(400).json({
          message:
            "Provide a subject, a supported source and provider, test types, and 1–100 test cases per request. Staff have unlimited runs.",
        });
      if (runningUsers.has(req.userId))
        return res
          .status(409)
          .json({
            message:
              "A generation request is already running for your account.",
          });
      runningUsers.add(req.userId);
      let run;
      try {
        const integration = await getIntegration(db, body.provider);
        if (!integration.enabled || !integration.secret)
          return res.status(503).json({
            message:
              "Configure this provider in API integrations before generating tests.",
          });
        const requirements =
          body.source === "story"
            ? body.prompt.trim()
            : body.source === "documents"
              ? await extract(body.documents)
              : await readPage(body.url);
        if (!requirements)
          return res
            .status(400)
            .json({ message: "Provide readable requirements." });
        run = await db.generationRun.create({
          data: {
            userId: req.userId,
            subject: body.subject.trim(),
            source: body.source,
            provider: body.provider,
            model: integration.model,
            requestedCount: count,
          },
        });
        const result = await generate(db, body.provider, {
          subject: body.subject,
          requirements,
          prompt: body.source === "story" ? "" : body.prompt,
          count,
          priority: body.filters.priority,
          testTypes: body.filters.testTypes,
          detail: ["concise", "standard", "detailed"].includes(
            body.configuration?.detail,
          )
            ? body.configuration.detail
            : "standard",
          reasoning: ["low", "medium", "high"].includes(
            body.configuration?.reasoning,
          )
            ? body.configuration.reasoning
            : "medium",
        });
        const saved = await db.generationRun.update({
          where: { id: run.id },
          data: {
            status: "completed",
            result: result.testCases,
            testCount: result.testCases.length,
          },
        });
        return res
          .status(201)
          .json({ run: saved, unlimited: true, creditsUsed: 0 });
      } catch (error) {
        if (run)
          await db.generationRun
            .update({
              where: { id: run.id },
              data: {
                status: "failed",
                error:
                  "Generation failed. Verify provider configuration or retry with fewer cases.",
              },
            })
            .catch(() => {});
        return staffFailure(res, error);
      } finally {
        runningUsers.delete(req.userId);
      }
    },
  };
}
export const generationController = createGenerationController();
