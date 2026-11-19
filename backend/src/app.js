import "./config.js";
import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import { webhook } from "./controllers/billingController.js";
import { protect } from "./middleware/authMiddleware.js";
import { getCredits } from "./controllers/creditsController.js";

if (!process.env.JWT_SECRET)
  throw new Error("JWT_SECRET must be set in the server environment");

const app = express();
app.use(cors());

app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
  webhook,
);

app.use(express.json({ limit: "400kb" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/auth", workspaceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reports", reportRoutes);
app.get("/api/credits", protect, getCredits);

const frontendDirectory = fileURLToPath(new URL("../../frontend/dist/", import.meta.url));
const frontendIndex = fileURLToPath(new URL("../../frontend/dist/index.html", import.meta.url));

if (process.env.NODE_ENV === "production" && existsSync(frontendIndex)) {
  app.use("/api", (_req, res) => res.status(404).json({ message: "API route not found." }));
  app.use(express.static(frontendDirectory));
  app.get("/{*path}", (req, res, next) => {
    if (!req.accepts("html")) return next();
    res.set("Cache-Control", "no-cache").sendFile(frontendIndex);
  });
} else {
  app.get("/", (_req, res) => res.json({ message: "Casefy API is running." }));
}

export default app;
