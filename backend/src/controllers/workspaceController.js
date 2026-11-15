import { createHash, randomBytes } from "node:crypto";
import prisma from "../db.js";
import { publicUserSelect } from "../utils/roles.js";
import { normalizeWorkspaceName } from "../utils/workspaces.js";
import { canAddWorkspace } from "../utils/plans.js";
import { effectiveUser } from "../utils/subscriptions.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const hash = (value) => createHash("sha256").update(value).digest("hex");
const visible = (userId) => ({ OR: [{ ownerId: userId }, { members: { some: { userId } } }] });
const shape = (w, userId) => ({
  id: w.id,
  key: w.id,
  name: w.name,
  isPrimary: w.isPrimary,
  ownerId: w.ownerId,
  role: w.ownerId === userId ? "owner" : w.members?.find((m) => m.userId === userId)?.role,
  isPrivate: true,
});
const include = { members: true };
const person = { id: true, name: true, email: true };
const inviteSelect = {
  id: true,
  role: true,
  expiresAt: true,
  revokedAt: true,
  acceptedAt: true,
  createdAt: true,
};

export function createWorkspaceController(db = prisma) {
  const handle = (fn) => async (req, res) => {
    try {
      return await fn(req, res);
    } catch (error) {
      if (error.status) return res.status(error.status).json({ message: error.message });
      console.error("Workspace request failed:", error.code || error.name);
      return res
        .status(500)
        .json({ message: "Unable to update or load this workspace. Please try again." });
    }
  };
  async function workspaceFor(tx, userId, key, access = "viewer", lock = false) {
    const where = uuid.test(key || "")
      ? { id: key }
      : { ownerId: userId, legacyKey: key || "invalid" };
    let w = await tx.workspace.findFirst({ where: { ...where, ...visible(userId) }, include });
    if (!w) fail(404, "Workspace not found");
    if (lock) {
      await tx.$queryRaw`SELECT id FROM workspaces WHERE id = ${w.id}::uuid FOR UPDATE`;
      w = await tx.workspace.findFirst({ where: { id: w.id, ...visible(userId) }, include });
      if (!w) fail(404, "Workspace not found");
    }
    const role = shape(w, userId).role;
    if (access === "owner" && role !== "owner")
      fail(403, "Only the workspace owner can manage access");
    if (access === "editor" && !["owner", "editor"].includes(role))
      fail(403, "You have view-only access to this workspace");
    return w;
  }
  const listing = async (tx, id) =>
    (
      await tx.workspace.findMany({
        where: visible(id),
        include,
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      })
    ).map((w) => shape(w, id));
  const getWorkspaces = handle(async (req, res) => res.json(await listing(db, req.user.id)));
  const addWorkspace = handle(async (req, res) => {
    const name =
      typeof req.body?.name === "string" ? req.body.name.trim().replace(/\s+/g, " ") : "";
    if (!name || name.length > 80) fail(400, "Workspace name must be between 1 and 80 characters");
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${req.user.id} FOR UPDATE`;
      const account = await tx.user.findUnique({
        where: { id: req.user.id },
        select: publicUserSelect,
      });
      if (!account) fail(401, "Account no longer exists");
      if (!canAddWorkspace(account))
        fail(
          403,
          "The Free plan does not allow adding workspaces. Your private workspace and invitations remain available",
        );
      if (
        await tx.workspace.findFirst({
          where: { ownerId: account.id, normalizedName: normalizeWorkspaceName(name) },
        })
      )
        fail(409, "You already have a workspace with this name");
      await tx.workspace.create({
        data: { ownerId: account.id, name, normalizedName: normalizeWorkspaceName(name) },
      });
      await tx.user.update({ where: { id: account.id }, data: { workspaceNames: { push: name } } });
    });
    return res.status(201).json({ workspaces: await listing(db, req.user.id) });
  });
  const getWorkspaceProjects = handle(async (req, res) =>
    res.json(
      await db.$transaction(async (tx) => {
        const w = await workspaceFor(tx, req.user.id, req.params.workspaceKey, "viewer", true);
        const projects = await tx.project.findMany({
          where: { workspaceId: w.id },
          select: { id: true, name: true, description: true, createdAt: true },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        });
        return { workspace: shape(w, req.user.id), projects };
      }),
    ),
  );
  const deleteWorkspace = handle(async (req, res) => {
    if (typeof req.body?.name !== "string")
      fail(400, "Workspace name is required to confirm deletion");
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${req.user.id} FOR UPDATE`;
      const w = await workspaceFor(tx, req.user.id, req.params.workspaceKey, "owner", true);
      if (w.isPrimary) fail(403, "Your primary workspace cannot be deleted");
      if (w.name !== req.body.name) fail(409, "Your workspace changed. Refresh before deleting");
      await tx.workspace.delete({ where: { id: w.id } });
      const account = await tx.user.findUnique({
        where: { id: req.user.id },
        select: { workspaceNames: true },
      });
      await tx.user.update({
        where: { id: req.user.id },
        data: { workspaceNames: account.workspaceNames.filter((name) => name !== w.name) },
      });
    });
    return res.json({ message: "Workspace deleted" });
  });
  const projectInput = (body) => {
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    if (!name || name.length > 100 || description.length > 5000)
      fail(400, "Enter a project name up to 100 characters and description up to 5,000 characters");
    return { name, description };
  };
  const createProject = handle(async (req, res) => {
    const data = projectInput(req.body);
    const project = await db.$transaction(async (tx) => {
      const w = await workspaceFor(tx, req.user.id, req.params.workspaceKey, "editor", true);
      const owner = effectiveUser(
        await tx.user.findUnique({ where: { id: w.ownerId }, select: publicUserSelect }),
      );
      const limit = owner.projectLimit || { free: 2, plus: 10 }[owner.plan];
      if (limit && (await tx.project.count({ where: { workspaceId: w.id } })) >= limit)
        fail(403, "This workspace has reached its project limit");
      return tx.project.create({
        data: {
          ...data,
          ownerId: w.ownerId,
          workspaceId: w.id,
          workspaceKey: w.legacyKey || "workspace",
        },
      });
    });
    return res.status(201).json(project);
  });
  const projectMutation = (remove) =>
    handle(async (req, res) => {
      const id = Number(req.params.projectId);
      if (!Number.isSafeInteger(id) || id <= 0) fail(400, "Invalid project");
      const data = remove ? null : projectInput(req.body);
      const result = await db.$transaction(async (tx) => {
        const project = await tx.project.findUnique({ where: { id } });
        if (!project) fail(404, "Project not found");
        await workspaceFor(tx, req.user.id, project.workspaceId, "editor", true);
        return remove
          ? tx.project.delete({ where: { id } })
          : tx.project.update({ where: { id }, data });
      });
      return res.json(remove ? { message: "Project deleted" } : result);
    });
  const getAccess = handle(async (req, res) =>
    res.json(
      await db.$transaction(async (tx) => {
        const w = await workspaceFor(tx, req.user.id, req.params.workspaceKey, "owner", true);
        return {
          owner: await tx.user.findUnique({ where: { id: w.ownerId }, select: person }),
          members: await tx.workspaceMember.findMany({
            where: { workspaceId: w.id },
            include: { user: { select: person } },
            orderBy: { createdAt: "asc" },
          }),
          invites: await tx.workspaceInvite.findMany({
            where: {
              workspaceId: w.id,
              revokedAt: null,
              acceptedAt: null,
              expiresAt: { gt: new Date() },
            },
            select: inviteSelect,
            orderBy: { createdAt: "desc" },
          }),
        };
      }),
    ),
  );
  const createInvite = handle(async (req, res) => {
    const role = req.body?.role;
    if (!["viewer", "editor"].includes(role)) fail(400, "Choose viewer or editor access");
    const token = randomBytes(32).toString("hex");
    const invite = await db.$transaction(async (tx) => {
      const w = await workspaceFor(tx, req.user.id, req.params.workspaceKey, "owner", true);
      const active = await tx.workspaceInvite.count({
        where: {
          workspaceId: w.id,
          revokedAt: null,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      if (active >= 20) fail(409, "Revoke an unused invitation before creating another");
      return tx.workspaceInvite.create({
        data: {
          workspaceId: w.id,
          tokenHash: hash(token),
          role,
          expiresAt: new Date(Date.now() + 7 * 86400000),
        },
        select: inviteSelect,
      });
    });
    return res.status(201).json({ ...invite, token });
  });
  const acceptInvite = handle(async (req, res) => {
    const token = req.body?.token;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
      fail(404, "Invitation is invalid or expired");
    const result = await db.$transaction(async (tx) => {
      const initial = await tx.workspaceInvite.findUnique({ where: { tokenHash: hash(token) } });
      if (!initial) fail(404, "Invitation is invalid or expired");
      await tx.$queryRaw`SELECT id FROM workspaces WHERE id = ${initial.workspaceId}::uuid FOR UPDATE`;
      const invite = await tx.workspaceInvite.findUnique({ where: { id: initial.id } });
      if (!invite || invite.revokedAt || invite.expiresAt <= new Date())
        fail(410, "Invitation is invalid or expired");
      const w = await tx.workspace.findUnique({ where: { id: invite.workspaceId }, include });
      if (!w) fail(404, "Workspace not found");
      if (invite.acceptedAt && invite.acceptedBy !== req.user.id)
        fail(410, "This invitation has already been used");
      const existing = w.ownerId === req.user.id || w.members.some((m) => m.userId === req.user.id);
      if (invite.acceptedAt && !existing) fail(410, "This invitation has already been used");
      if (existing) return { id: w.id, name: w.name };
      if (!existing) {
        const owner = effectiveUser(
          await tx.user.findUnique({ where: { id: w.ownerId }, select: publicUserSelect }),
        );
        if (owner.blockedAt) fail(403, "The workspace owner is unavailable");
        if (owner.seatLimit && w.members.length + 1 >= owner.seatLimit)
          fail(409, "This workspace has no available seats. Contact the owner");
        await tx.workspaceMember.create({
          data: { workspaceId: w.id, userId: req.user.id, role: invite.role },
        });
      }
      await tx.workspaceInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: invite.acceptedAt || new Date(), acceptedBy: req.user.id },
      });
      return { id: w.id, name: w.name };
    });
    return res.json({ workspace: result });
  });
  const revokeInvite = handle(async (req, res) => {
    if (!uuid.test(req.params.inviteId || "")) fail(400, "Invalid invitation");
    await db.$transaction(async (tx) => {
      const w = await workspaceFor(tx, req.user.id, req.params.workspaceKey, "owner", true);
      const result = await tx.workspaceInvite.updateMany({
        where: { id: req.params.inviteId, workspaceId: w.id },
        data: { revokedAt: new Date() },
      });
      if (!result.count) fail(404, "Invitation not found");
    });
    return res.json({ message: "Invitation revoked" });
  });
  const changeMember = handle(async (req, res) => {
    const userId = Number(req.params.memberId);
    if (
      !Number.isSafeInteger(userId) ||
      userId <= 0 ||
      !["viewer", "editor", "remove"].includes(req.body?.role)
    )
      fail(400, "Choose a member and valid access");
    await db.$transaction(async (tx) => {
      const w = await workspaceFor(tx, req.user.id, req.params.workspaceKey, "owner", true);
      if (userId === w.ownerId) fail(403, "The workspace owner cannot be changed here");
      const where = { workspaceId: w.id, userId };
      const result =
        req.body.role === "remove"
          ? await tx.workspaceMember.deleteMany({ where })
          : await tx.workspaceMember.updateMany({ where, data: { role: req.body.role } });
      if (!result.count) fail(404, "Member not found");
    });
    return res.json({ message: "Member access updated" });
  });
  return {
    getWorkspaces,
    addWorkspace,
    getWorkspaceProjects,
    deleteWorkspace,
    createProject,
    deleteProject: projectMutation(true),
    updateProject: projectMutation(false),
    getAccess,
    createInvite,
    acceptInvite,
    revokeInvite,
    changeMember,
  };
}
export const {
  getWorkspaces,
  addWorkspace,
  getWorkspaceProjects,
  deleteWorkspace,
  createProject,
  deleteProject,
  updateProject,
  getAccess,
  createInvite,
  acceptInvite,
  revokeInvite,
  changeMember,
} = createWorkspaceController();
