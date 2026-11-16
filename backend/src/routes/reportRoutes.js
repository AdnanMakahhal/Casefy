import { Router } from "express";
import { protect, allowRoles } from "../middleware/authMiddleware.js";
import { reportController } from "../controllers/reportController.js";

const router = Router();

router.use(protect, allowRoles("qa_engineer", "student", "employee", "developer"));
router.get("/", reportController.reports);
router.get("/:id", reportController.report);

export default router;
