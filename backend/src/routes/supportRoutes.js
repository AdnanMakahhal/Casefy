import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { submitSupportRequest } from "../controllers/supportController.js";
import { messagesController } from "../controllers/messagesController.js";

const router = Router();

router.post(
  "/",
  (req, res, next) =>
    req.headers.authorization ? protect(req, res, next) : next(),
  submitSupportRequest,
);

router.get("/mine", protect, messagesController.requests);
router.post("/:id/reply", protect, messagesController.reply);

export default router;
