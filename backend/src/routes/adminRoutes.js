import { Router } from "express";
import { protect, allowRoles } from "../middleware/authMiddleware.js";
import { adminController } from "../controllers/adminController.js";
import { staffController } from "../controllers/staffController.js";

const router = Router();

router.use(protect, allowRoles("admin", "manager"));
router.get("/", adminController.overview);
router.get("/users", adminController.list);
router.post("/users", adminController.create);
router.patch("/users/:id", adminController.update);
router.delete("/users/:id", adminController.remove);
router.post("/users/:id/block", adminController.block);
router.get("/inbox", staffController.inbox);
router.get("/inbox/:id", staffController.conversation);
router.patch("/inbox/:id", staffController.updateRequest);
router.post("/messages", staffController.sendMessage);
router.get("/subscriptions", staffController.subscriptions);
router.put("/subscriptions/:id/access", staffController.access);
router.post("/subscriptions/:id", staffController.subscriptionAction);
router.get("/payments", staffController.payments);
router.get("/refunds", staffController.refunds);
router.post("/refunds", staffController.refund);

export default router;
