import express from "express";
import { signin, signup, getMe, updateMe, deleteMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { getWorkspaces, addWorkspace, getWorkspaceProjects, deleteWorkspace, deleteProject, createProject, updateProject, getAccess, createInvite, acceptInvite, revokeInvite, changeMember } from "../controllers/privateWorkspaceController.js";

const router = express.Router();

router.post("/signin", signin);
router.post("/signup", signup);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.delete("/me", protect, deleteMe);
router.get("/workspaces", protect, getWorkspaces);
router.post("/workspaces", protect, addWorkspace);
router.post("/workspace-invites/accept", protect, acceptInvite);
router.get("/workspaces/:workspaceKey/projects", protect, getWorkspaceProjects);
router.post("/workspaces/:workspaceKey/projects", protect, createProject);
router.get("/workspaces/:workspaceKey/access", protect, getAccess);
router.post("/workspaces/:workspaceKey/invites", protect, createInvite);
router.delete("/workspaces/:workspaceKey/invites/:inviteId", protect, revokeInvite);
router.patch("/workspaces/:workspaceKey/members/:memberId", protect, changeMember);
router.delete("/workspaces/:workspaceKey", protect, deleteWorkspace);
router.delete("/projects/:projectId", protect, deleteProject);
router.patch("/projects/:projectId", protect, updateProject);

export default router;
