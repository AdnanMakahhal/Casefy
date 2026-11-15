import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { staffController } from "../controllers/staffController.js";

const router = Router();

router.use(protect);
router.get("/", staffController.reports);
router.get("/:id", staffController.report);

export default router;
