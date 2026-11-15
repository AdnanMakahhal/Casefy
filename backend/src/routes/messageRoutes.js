import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { messagesController } from "../controllers/messagesController.js";

const router = Router();

router.use(protect);
router.get("/", messagesController.list);
router.post("/:id/read", messagesController.read);

export default router;
