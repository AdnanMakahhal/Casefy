import "./config.js";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import { webhook } from "./controllers/billingController.js";

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
app.get("/", (_req, res) => res.json({ message: "Casefy API is running." }));

app.use("/api/auth", authRoutes);
app.use("/api/auth", workspaceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reports", reportRoutes);

export default app;
