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

const router = express.Router();

router.get("/plans", catalog);
router.get("/status", protect, billingStatus);
router.post("/checkout", protect, createCheckout);
router.post("/upgrade", protect, createUpgrade);
router.post("/portal", protect, createPortal);
router.get("/checkout/:sessionId", protect, checkoutStatus);

export default router;
