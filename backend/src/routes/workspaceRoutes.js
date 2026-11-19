import { Router } from "express";
import { protect, allowRoles } from "../middleware/authMiddleware.js";
import { signupRoles } from "../utils/roles.js";
import {
  getWorkspaces,
  addWorkspace,
  getWorkspaceProjects,
  deleteWorkspace,
  createProject,
  getProject,
  moveProject,
  updateProject,
  deleteProject,
  getAccess,
  createInvite,
  acceptInvite,
  revokeInvite,
  changeMember,
} from "../controllers/workspaceController.js";

const router = Router();

router.use(protect, allowRoles(...signupRoles));
router.get("/workspaces", getWorkspaces);
router.post("/workspaces", addWorkspace);
router.post("/workspace-invites/accept", acceptInvite);
router.get("/workspaces/:workspaceKey/projects", getWorkspaceProjects);
router.post("/workspaces/:workspaceKey/projects", createProject);
router.get("/workspaces/:workspaceKey/access", getAccess);
router.post("/workspaces/:workspaceKey/invites", createInvite);
router.delete("/workspaces/:workspaceKey/invites/:inviteId", revokeInvite);
router.patch("/workspaces/:workspaceKey/members/:memberId", changeMember);
router.delete("/workspaces/:workspaceKey", deleteWorkspace);
router.patch("/projects/:projectId", updateProject);
router.get("/projects/:projectId", getProject);
router.post("/projects/:projectId/move", moveProject);
router.delete("/projects/:projectId", deleteProject);

export default router;
