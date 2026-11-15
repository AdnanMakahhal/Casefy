import "./config.js";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import { webhook } from "./controllers/billingController.js";
import { submitSupportRequest } from "./controllers/supportController.js";
import { protect, allowRoles } from "./middleware/authMiddleware.js";
import { messagesController } from "./controllers/messagesController.js";
import { generationController } from "./controllers/generationController.js";
import { staffController } from "./controllers/staffController.js";

const app = express();
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in the server environment");
}

app.use(cors());
app.post("/api/billing/webhook", express.raw({ type: "application/json", limit: "1mb" }), webhook);
app.get("/api/generation/providers", protect, allowRoles("admin", "manager"), generationController.providers);
app.post("/api/generation", protect, allowRoles("admin", "manager"), express.json({ limit: "15mb" }), generationController.generate);
app.use(express.json({ limit: "400kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({ message: "Casefy API is running." });
});

app.get("/Home", (req, res) => {
  res.json({ message: "Casefy API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/billing", billingRoutes);
app.post("/api/support", (req, res, next) => req.headers.authorization ? protect(req, res, next) : next(), submitSupportRequest);
app.get("/api/support/mine", protect, messagesController.requests);
app.post("/api/support/:id/reply", protect, messagesController.reply);
app.get("/api/messages", protect, messagesController.list);
app.post("/api/messages/:id/read", protect, messagesController.read);
app.get("/api/reports", protect, staffController.reports);
app.get("/api/reports/:id", protect, staffController.report);
app.use("/api/admin", adminRoutes);

export default app;
