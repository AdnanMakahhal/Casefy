import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createCheckout,
  createUpgrade,
  createPortal,
  checkoutStatus,
  catalog,
  billingStatus,
} from "../controllers/billingController.js";
import { paypalController } from "../controllers/paypalController.js";

const router = express.Router();
router.get("/plans", catalog);
router.get("/paypal/config", paypalController.config);
router.post("/paypal/subscriptions", protect, paypalController.create);
router.post("/paypal/verify", protect, paypalController.verify);
router.post("/paypal/cancel", protect, paypalController.cancel);
router.post("/paypal/webhook", paypalController.webhook);
router.get("/status", protect, billingStatus);
router.post("/checkout", protect, createCheckout);
router.post("/upgrade", protect, createUpgrade);
router.post("/portal", protect, createPortal);
router.get("/checkout/:sessionId", protect, checkoutStatus);
export default router;
