import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { submitSupportRequest } from "../controllers/supportController.js";
import { messagesController } from "../controllers/messagesController.js";
import { respondDeal, customCheckout } from "../controllers/customDealsController.js";

const router = Router();

router.post(
  "/",
  (req, res, next) =>
    req.headers.authorization ? protect(req, res, next) : next(),
  submitSupportRequest,
);

router.get("/mine", protect, messagesController.requests);
router.post("/deals/:id/respond", protect, respondDeal);
router.post("/deals/:id/checkout", protect, customCheckout);
router.post("/:id/reply", protect, messagesController.reply);

export default router;
