import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import prisma from "../src/db.js";
import { createWorkspaceController } from "../src/controllers/workspaceController.js";

const rollback = new Error("WORKSPACE_SMOKE_ROLLBACK");
const response = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});
const models = ["user", "workspace", "workspaceMember", "workspaceInvite", "project"];
const counts = () => Promise.all(models.map((model) => prisma[model].count()));
const before = await counts();
let checks = 0;
try {
  try {
    await prisma.$transaction(
      async (tx) => {
        const controller = createWorkspaceController({ ...tx, $transaction: (fn) => fn(tx) });
        const users = [];
        for (let i = 0; i < 3; i++)
          users.push(
            await tx.user.create({
              data: {
                name: `Workspace fixture ${i}`,
                email: `workspace-${randomUUID()}@example.com`,
                passwordHash: "fixture-not-a-valid-password",
                workspaceName: "Same private name",
                plan: "enterprise",
                seatLimit: 5,
                projectLimit: 300,
              },
            }),
          );
        const [owner, viewer, stranger] = users;
        async function call(action, user, params = {}, body = {}, status = 200) {
          const res = response();
          await controller[action]({ user, params, body }, res);
          assert.equal(res.statusCode, status, `${action}: ${JSON.stringify(res.body)}`);
          checks++;
          return res.body;
        }
        const owned = await call("getWorkspaces", owner);
        assert.equal(owned.length, 1);
        assert.equal(owned[0].role, "owner");
        const key = owned[0].id;
        const params = { workspaceKey: key };
        const ownViewer = await call("getWorkspaces", viewer);
        assert.notEqual(ownViewer[0].id, key);
        await call("getWorkspaceProjects", stranger, params, {}, 404);
        await call("createInvite", stranger, params, { role: "editor" }, 404);
        const invite = await call("createInvite", owner, params, { role: "viewer" }, 201);
        const stored = await tx.workspaceInvite.findUnique({ where: { id: invite.id } });
        assert.notEqual(stored.tokenHash, invite.token);
        assert.equal(stored.tokenHash.length, 64);
        await call("acceptInvite", viewer, {}, { token: invite.token });
        await call("acceptInvite", viewer, {}, { token: invite.token });
        await call("acceptInvite", stranger, {}, { token: invite.token }, 410);
        const joined = await call("getWorkspaces", viewer);
        assert.equal(joined.length, 2);
        assert.equal(joined.find((w) => w.id === key).role, "viewer");
        await call("getWorkspaceProjects", viewer, params);
        await call("createProject", viewer, params, { name: "Denied" }, 403);
        await call("createInvite", viewer, params, { role: "editor" }, 403);
        await call("getAccess", viewer, params, {}, 403);
        await call(
          "changeMember",
          viewer,
          { ...params, memberId: viewer.id },
          { role: "editor" },
          403,
        );
        const project = await call("createProject", owner, params, { name: "Shared project" }, 201);
        await call("updateProject", viewer, { projectId: project.id }, { name: "Denied" }, 403);
        await call("deleteProject", viewer, { projectId: project.id }, {}, 403);
        await call("changeMember", owner, { ...params, memberId: viewer.id }, { role: "editor" });
        await call("updateProject", viewer, { projectId: project.id }, { name: "Editor change" });
        await call("createProject", viewer, params, { name: "Editor project" }, 201);
        await call("deleteProject", stranger, { projectId: project.id }, {}, 404);
        await call("changeMember", owner, { ...params, memberId: viewer.id }, { role: "viewer" });
        await call("deleteProject", viewer, { projectId: project.id }, {}, 403);
        await call("changeMember", owner, { ...params, memberId: viewer.id }, { role: "remove" });
        await call("getWorkspaceProjects", viewer, params, {}, 404);
        await call("acceptInvite", viewer, {}, { token: invite.token }, 410);
        const revoked = await call("createInvite", owner, params, { role: "editor" }, 201);
        await call("revokeInvite", owner, { ...params, inviteId: revoked.id });
        await call("acceptInvite", stranger, {}, { token: revoked.token }, 410);
        const expired = await call("createInvite", owner, params, { role: "viewer" }, 201);
        await tx.workspaceInvite.update({
          where: { id: expired.id },
          data: { expiresAt: new Date(0) },
        });
        await call("acceptInvite", stranger, {}, { token: expired.token }, 410);
        const editInvite = await call("createInvite", owner, params, { role: "editor" }, 201);
        await tx.user.update({ where: { id: owner.id }, data: { seatLimit: 1 } });
        await call("acceptInvite", viewer, {}, { token: editInvite.token }, 409);
        await tx.user.update({ where: { id: owner.id }, data: { seatLimit: 2 } });
        await call("acceptInvite", viewer, {}, { token: editInvite.token });
        assert.equal(
          (await call("getWorkspaces", viewer)).find((w) => w.id === key).role,
          "editor",
        );
        await call("deleteProject", viewer, { projectId: project.id });
        const capacityInvite = await call("createInvite", owner, params, { role: "viewer" }, 201);
        await call("acceptInvite", stranger, {}, { token: capacityInvite.token }, 409);
        await call("getAccess", viewer, params, {}, 403);
        const access = await call("getAccess", owner, params);
        assert.equal(access.members.length, 1);
        assert.ok(access.invites.every((row) => !row.token && !row.tokenHash));
        await call("deleteWorkspace", owner, params, { name: owned[0].name }, 403);
        await tx.user.update({
          where: { id: owner.id },
          data: { workspaceName: "Renamed primary" },
        });
        assert.equal((await call("getWorkspaces", owner))[0].id, key);
        assert.equal((await call("getWorkspaces", owner))[0].name, "Renamed primary");
        await call("addWorkspace", owner, {}, { name: "Extra" }, 201);
        const extra = (await call("getWorkspaces", owner)).find((w) => !w.isPrimary);
        await call("deleteWorkspace", owner, { workspaceKey: extra.id }, { name: extra.name });
        assert.equal((await call("getWorkspaces", owner))[0].id, key);
        throw rollback;
      },
      { timeout: 60000 },
    );
  } catch (error) {
    if (error !== rollback) throw error;
  }
  assert.deepEqual(await counts(), before, "Smoke fixtures must all roll back");
  console.log(
    `Private workspace database smoke passed: ${checks} checks; all fixtures rolled back.`,
  );
} finally {
  await prisma.$disconnect();
}
