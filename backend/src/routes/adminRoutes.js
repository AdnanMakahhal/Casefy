import { Router } from "express";
import { protect, allowRoles } from "../middleware/authMiddleware.js";
import { adminController } from "../controllers/adminController.js";
import { staffController } from "../controllers/staffController.js";
import { offerDeal } from "../controllers/customDealsController.js";

const router = Router();

router.use(protect);
const supportAccess = (req, res, next) => {
  if (["admin", "manager"].includes(req.user.role) || (req.user.role === "employee" && req.user.isSupportAgent)) return next();
  return res.status(403).json({ message: "Support staff access is required." });
};
router.get("/inbox", supportAccess, staffController.inbox);
router.get("/inbox/:id", supportAccess, staffController.conversation);
router.patch("/inbox/:id", supportAccess, staffController.updateRequest);
router.post("/messages", supportAccess, staffController.sendMessage);
router.use(allowRoles("admin", "manager"));
router.get("/", adminController.overview);
router.get("/users", adminController.list);
router.post("/users", adminController.create);
router.patch("/users/:id", adminController.update);
router.delete("/users/:id", adminController.remove);
router.post("/users/:id/block", adminController.block);
router.post("/inbox/:id/offer", offerDeal);
router.get("/subscriptions", staffController.subscriptions);
router.put("/subscriptions/:id/access", staffController.access);
router.post("/subscriptions/:id", staffController.subscriptionAction);
router.get("/payments", staffController.payments);
router.get("/refunds", staffController.refunds);
router.post("/refunds", staffController.refund);

export default router;
