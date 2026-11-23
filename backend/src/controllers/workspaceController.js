import { createHash, randomBytes } from "node:crypto";
import prisma from "../db.js";
import { publicUserSelect } from "../utils/roles.js";
import { normalizeWorkspaceName } from "../utils/workspaces.js";
import { canAddWorkspace } from "../utils/plans.js";
import { effectiveUser } from "../utils/subscriptions.js";
import { GENERATION_MODE, currentGenerationRequest } from "../utils/generation.js";
import { deliverEmail } from "../utils/integrations.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const hash = (value) => createHash("sha256").update(value).digest("hex");
const visible = (userId) => ({
  OR: [{ ownerId: userId }, { members: { some: { userId } } }],
});
const shape = (w, userId) => ({
  id: w.id,
  key: w.id,
  name: w.name,
  isPrimary: w.isPrimary,
  ownerId: w.ownerId,
  role:
    w.ownerId === userId
      ? "owner"
      : w.members?.find((m) => m.userId === userId)?.role,
  isPrivate: true,
});
const include = { members: true };
const person = { id: true, name: true, email: true };
const inviteSelect = {
  id: true,
  role: true,
  email: true,
  expiresAt: true,
  revokedAt: true,
  acceptedAt: true,
  createdAt: true,
};

export function createWorkspaceController(db = prisma, emailSender = deliverEmail) {
  const handle = (fn) => async (req, res) => {
    try {
      return await fn(req, res);
    } catch (error) {
      if (error.status)
        return res.status(error.status).json({ message: error.message });
      console.error("Workspace request failed:", error.code || error.name);
      return res
        .status(500)
        .json({
          message: "Unable to update or load this workspace. Please try again.",
        });
    }
  };
  async function workspaceFor(
    tx,
    userId,
    key,
    access = "viewer",
    lock = false,
  ) {
    const where = uuid.test(key || "")
      ? { id: key }
      : { ownerId: userId, legacyKey: key || "invalid" };
    let w = await tx.workspace.findFirst({
      where: { ...where, ...visible(userId) },
      include,
    });
    if (!w) fail(404, "Workspace not found");
    if (lock) {
      await tx.$queryRaw`SELECT id FROM workspaces WHERE id = ${w.id}::uuid FOR UPDATE`;
      w = await tx.workspace.findFirst({
        where: { id: w.id, ...visible(userId) },
        include,
      });
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
  const getWorkspaces = handle(async (req, res) =>
    res.json(await listing(db, req.user.id)),
  );
  const addWorkspace = handle(async (req, res) => {
    const name =
      typeof req.body?.name === "string"
        ? req.body.name.trim().replace(/\s+/g, " ")
        : "";
    if (!name || name.length > 80)
      fail(400, "Workspace name must be between 1 and 80 characters");
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
          where: {
            ownerId: account.id,
            normalizedName: normalizeWorkspaceName(name),
          },
        })
      )
        fail(409, "You already have a workspace with this name");
      await tx.workspace.create({
        data: {
          ownerId: account.id,
          name,
          normalizedName: normalizeWorkspaceName(name),
        },
      });
      await tx.user.update({
        where: { id: account.id },
        data: { workspaceNames: { push: name } },
      });
    });
    return res.status(201).json({ workspaces: await listing(db, req.user.id) });
  });
  const getWorkspaceProjects = handle(async (req, res) =>
    res.json(
      await db.$transaction(async (tx) => {
        const w = await workspaceFor(
          tx,
          req.user.id,
          req.params.workspaceKey,
          "viewer",
          true,
        );
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
      const w = await workspaceFor(
        tx,
        req.user.id,
        req.params.workspaceKey,
        "owner",
        true,
      );
      if (w.isPrimary) fail(403, "Your primary workspace cannot be deleted");
      if (w.name !== req.body.name)
        fail(409, "Your workspace changed. Refresh before deleting");
      await tx.workspace.delete({ where: { id: w.id } });
      const account = await tx.user.findUnique({
        where: { id: req.user.id },
        select: { workspaceNames: true },
      });
      await tx.user.update({
        where: { id: req.user.id },
        data: {
          workspaceNames: account.workspaceNames.filter(
            (name) => name !== w.name,
          ),
        },
      });
    });
    return res.json({ message: "Workspace deleted" });
  });
  const projectInput = (body) => {
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description.trim() : "";
    if (!name || name.length > 100 || description.length > 5000)
      fail(
        400,
        "Enter a project name up to 100 characters and description up to 5,000 characters",
      );
    const data = { name, description };
    const request = body?.generationRequest;
    if (request !== undefined) {
      if (!request || typeof request !== "object" || Array.isArray(request) ||
          !["story", "documents", "url"].includes(request.source) ||
          typeof request.prompt !== "string" || request.prompt.length > 20000 ||
          request.generationMode?.value !== GENERATION_MODE.value ||
          !["concise", "standard", "detailed"].includes(request.configuration?.detail) ||
          !["low", "medium", "high"].includes(request.configuration?.reasoning) ||
          !Number.isSafeInteger(request.filters?.count) || request.filters.count < 1 ||
          !["all", "low", "medium", "high"].includes(request.filters?.priority) ||
          !Array.isArray(request.filters?.testTypes) || !request.filters.testTypes.length ||
          request.filters.testTypes.length > 6 || request.filters.testTypes.some((type) =>
            !["functional", "positive", "negative", "edge", "security", "accessibility"].includes(type)) ||
          (request.source === "story" && !request.prompt.trim()) ||
          (request.source === "url" && (typeof request.url !== "string" || request.url.length > 2048 || !/^https?:\/\//i.test(request.url))) ||
          (request.source === "url" && request.compareWithDocuments !== undefined && typeof request.compareWithDocuments !== "boolean") ||
          ((request.source === "documents" || (request.source === "url" && request.compareWithDocuments === true)) && (!Array.isArray(request.documents) ||
            !request.documents.length || request.documents.length > 5 || request.documents.some((file) =>
              typeof file?.name !== "string" || file.name.length > 255 ||
              !Number.isSafeInteger(file.size) || file.size <= 0 || file.size > 10 * 1024 * 1024))) ||
          Buffer.byteLength(JSON.stringify(request)) > 100000)
        fail(400, "Invalid generation request");
      // Store only request inputs, without trusting client workspace or status metadata.
      data.generationRequest = {
        preview: true,
        source: request.source,
        prompt: request.prompt,
        subject: data.name,
        generationMode: { ...GENERATION_MODE },
        configuration: { detail: request.configuration.detail, reasoning: request.configuration.reasoning },
        filters: { count: request.filters.count, priority: request.filters.priority, testTypes: request.filters.testTypes },
        ...(request.source === "url" ? { url: request.url } : {}),
        ...(request.source === "url" ? { compareWithDocuments: request.compareWithDocuments === true } : {}),
        ...(request.source === "documents" || (request.source === "url" && request.compareWithDocuments === true) ? {
          documents: request.documents.map(({ name, size }) => ({ name, size })),
          documentContentsIncluded: false,
        } : {}),
      };
    }
    return data;
  };
  async function checkProjectLimit(tx, workspace) {
    const owner = effectiveUser(await tx.user.findUnique({
      where: { id: workspace.ownerId },
      select: publicUserSelect,
    }));
    const limit = owner.projectLimit || { free: 2, plus: 10 }[owner.plan];
    if (limit && await tx.project.count({ where: { workspaceId: workspace.id } }) >= limit)
      fail(403, "This workspace has reached its project limit");
  }
  const getProject = handle(async (req, res) => {
    const id = Number(req.params.projectId);
    if (!Number.isSafeInteger(id) || id <= 0) fail(400, "Invalid project");
    return res.json(await db.$transaction(async (tx) => {
      const project = await tx.project.findUnique({ where: { id } });
      if (!project) fail(404, "Project not found");
      await workspaceFor(tx, req.user.id, project.workspaceId, "viewer", true);
      const current = await tx.project.findUnique({ where: { id } });
      if (!current || current.workspaceId !== project.workspaceId)
        fail(409, "Project changed. Refresh before opening it");
      return { ...current, generationRequest: currentGenerationRequest(current.generationRequest) };
    }));
  });
  const createProject = handle(async (req, res) => {
    const data = projectInput(req.body);
    const project = await db.$transaction(async (tx) => {
      const w = await workspaceFor(
        tx,
        req.user.id,
        req.params.workspaceKey,
        "editor",
        true,
      );
      await checkProjectLimit(tx, w);
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
        await workspaceFor(
          tx,
          req.user.id,
          project.workspaceId,
          "editor",
          true,
        );
        const current = await tx.project.findUnique({ where: { id } });
        if (!current || current.workspaceId !== project.workspaceId)
          fail(409, "Project changed. Refresh before editing it");
        return remove
          ? tx.project.delete({ where: { id } })
          : tx.project.update({ where: { id }, data });
      });
      return res.json(remove ? { message: "Project deleted" } : result);
    });
  const moveProject = handle(async (req, res) => {
    const id = Number(req.params.projectId);
    const destinationKey = req.body?.workspaceKey;
    if (!Number.isSafeInteger(id) || id <= 0 || typeof destinationKey !== "string")
      fail(400, "Choose a project and destination workspace");
    const project = await db.$transaction(async (tx) => {
      const existing = await tx.project.findUnique({ where: { id } });
      if (!existing) fail(404, "Project not found");
      const destination = await workspaceFor(tx, req.user.id, destinationKey, "editor");
      // Consistent workspace lock order prevents opposite-direction moves from deadlocking.
      for (const key of [...new Set([existing.workspaceId, destination.id])].sort())
        await workspaceFor(tx, req.user.id, key, "editor", true);
      const current = await tx.project.findUnique({ where: { id } });
      if (!current || current.workspaceId !== existing.workspaceId)
        fail(409, "Project changed. Refresh before moving it");
      if (existing.workspaceId === destination.id) return current;
      await checkProjectLimit(tx, destination);
      return tx.project.update({
        where: { id },
        data: {
          workspaceId: destination.id,
          workspaceKey: destination.legacyKey || "workspace",
          ownerId: destination.ownerId,
        },
      });
    });
    return res.json(project);
  });
  const getAccess = handle(async (req, res) =>
    res.json(
      await db.$transaction(async (tx) => {
        const w = await workspaceFor(
          tx,
          req.user.id,
          req.params.workspaceKey,
          "owner",
          true,
        );
        return {
          owner: await tx.user.findUnique({
            where: { id: w.ownerId },
            select: person,
          }),
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
    if (!["viewer", "editor"].includes(role))
      fail(400, "Choose viewer or editor access");
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      fail(400, "Enter a valid invitation email address");
    const token = randomBytes(32).toString("hex");
    let workspaceName;
    const invite = await db.$transaction(async (tx) => {
      const w = await workspaceFor(
        tx,
        req.user.id,
        req.params.workspaceKey,
        "owner",
        true,
      );
      const active = await tx.workspaceInvite.count({
        where: {
          workspaceId: w.id,
          revokedAt: null,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      if (active >= 20)
        fail(409, "Revoke an unused invitation before creating another");
      if (email) {
        const account = await tx.user.findUnique({ where: { email }, select: { id: true } });
        if (account && (account.id === w.ownerId || w.members.some((member) => member.userId === account.id)))
          fail(409, "This person already belongs to the workspace");
        const pending = await tx.workspaceInvite.findFirst({
          where: { workspaceId: w.id, email, revokedAt: null, acceptedAt: null, expiresAt: { gt: new Date() } },
        });
        if (pending) fail(409, "This email already has a pending invitation. Revoke it before inviting again");
      }
      workspaceName = w.name;
      return tx.workspaceInvite.create({
        data: {
          workspaceId: w.id,
          tokenHash: hash(token),
          role,
          email,
          expiresAt: new Date(Date.now() + 7 * 86400000),
        },
        select: inviteSelect,
      });
    });
    let emailSent = false;
    if (email) {
      try {
        const origin = new URL(process.env.FRONTEND_URL);
        if (!["https:", "http:"].includes(origin.protocol)) throw new Error("Invalid frontend URL");
        await emailSender(db, {
          id: `workspace-invite-${invite.id}`,
          toEmail: email,
          subject: "You're invited to a Casefy workspace",
          body: `You have been invited to join ${workspaceName} with ${role} access.\n\nSign in or create an account using ${email}, then accept your invitation:\n${origin.origin}/workspace-invite#${token}\n\nThis invitation expires in 7 days.`,
        });
        emailSent = true;
      } catch {
        await db.workspaceInvite.update({ where: { id: invite.id }, data: { revokedAt: new Date() } });
        fail(502, "Invitation email could not be sent. Please try again or contact support");
      }
    }
    return res.status(201).json({ ...invite, emailSent, message: `Invitation sent to ${email}.` });
  });
  const acceptInvite = handle(async (req, res) => {
    const token = req.body?.token;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
      fail(404, "Invitation is invalid or expired");
    const result = await db.$transaction(async (tx) => {
      const initial = await tx.workspaceInvite.findUnique({
        where: { tokenHash: hash(token) },
      });
      if (!initial) fail(404, "Invitation is invalid or expired");
      await tx.$queryRaw`SELECT id FROM workspaces WHERE id = ${initial.workspaceId}::uuid FOR UPDATE`;
      const invite = await tx.workspaceInvite.findUnique({
        where: { id: initial.id },
      });
      if (!invite || invite.revokedAt || invite.expiresAt <= new Date())
        fail(410, "Invitation is invalid or expired");
      if (!invite.email)
        fail(410, "This link invitation is disabled. Ask the owner to invite you by email");
      if (invite.email && invite.email !== req.user.email?.trim().toLowerCase())
        fail(403, "Sign in with the email address this invitation was sent to");
      const w = await tx.workspace.findUnique({
        where: { id: invite.workspaceId },
        include,
      });
      if (!w) fail(404, "Workspace not found");
      if (invite.acceptedAt && invite.acceptedBy !== req.user.id)
        fail(410, "This invitation has already been used");
      const existing =
        w.ownerId === req.user.id ||
        w.members.some((m) => m.userId === req.user.id);
      if (invite.acceptedAt && !existing)
        fail(410, "This invitation has already been used");
      if (existing) return { id: w.id, name: w.name };
      if (!existing) {
        const owner = effectiveUser(
          await tx.user.findUnique({
            where: { id: w.ownerId },
            select: publicUserSelect,
          }),
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
        data: {
          acceptedAt: invite.acceptedAt || new Date(),
          acceptedBy: req.user.id,
        },
      });
      return { id: w.id, name: w.name };
    });
    return res.json({ workspace: result });
  });
  const revokeInvite = handle(async (req, res) => {
    if (!uuid.test(req.params.inviteId || "")) fail(400, "Invalid invitation");
    await db.$transaction(async (tx) => {
      const w = await workspaceFor(
        tx,
        req.user.id,
        req.params.workspaceKey,
        "owner",
        true,
      );
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
      const w = await workspaceFor(
        tx,
        req.user.id,
        req.params.workspaceKey,
        "owner",
        true,
      );
      if (userId === w.ownerId)
        fail(403, "The workspace owner cannot be changed here");
      const where = { workspaceId: w.id, userId };
      const result =
        req.body.role === "remove"
          ? await tx.workspaceMember.deleteMany({ where })
          : await tx.workspaceMember.updateMany({
              where,
              data: { role: req.body.role },
            });
      if (!result.count) fail(404, "Member not found");
    });
    return res.json({ message: req.body.role === "remove" ? "Member removed from workspace" : "Member access updated" });
  });
  return {
    getWorkspaces,
    addWorkspace,
    getWorkspaceProjects,
    deleteWorkspace,
    createProject,
    getProject,
    moveProject,
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
  getProject,
  moveProject,
  deleteProject,
  updateProject,
  getAccess,
  createInvite,
  acceptInvite,
  revokeInvite,
  changeMember,
} = createWorkspaceController();
