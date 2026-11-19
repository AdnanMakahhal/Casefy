import express from "express";
import { protect, allowRoles } from "../middleware/authMiddleware.js";
import { signupRoles } from "../utils/roles.js";
import {
  createCheckout,
  createUpgrade,
  createPortal,
  checkoutStatus,
  catalog,
  billingStatus,
  history,
} from "../controllers/billingController.js";

const router = express.Router();

router.get("/plans", catalog);
router.use(protect, allowRoles(...signupRoles));
router.get("/status", billingStatus);
router.get("/history", history);
router.post("/checkout", createCheckout);
router.post("/upgrade", createUpgrade);
router.post("/portal", createPortal);
router.get("/checkout/:sessionId", checkoutStatus);

export default router;
