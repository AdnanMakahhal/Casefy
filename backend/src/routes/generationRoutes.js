import { Router, json } from "express";
import { protect, allowRoles } from "../middleware/authMiddleware.js";
import { generationController } from "../controllers/generationController.js";

const router = Router();
router.use(protect, allowRoles("admin", "manager"));
router.get("/providers", generationController.providers);
router.post("/", json({ limit: "15mb" }), generationController.generate);
export default router;
