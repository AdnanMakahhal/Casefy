import assert from "node:assert/strict";
import { createWorkspaceController } from "../src/controllers/workspaceController.js";

export const workspaceId = "ab79165e-82a2-45aa-a9ef-52828901f52b";
export const owner = {
  id: 7,
  plan: "enterprise",
  workspaceName: "Main",
  workspaceNames: ["Mobile"],
  projectLimit: 300,
};
export const response = () => ({
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
export function fixture({ role = "owner", primary = false } = {}) {
  const calls = [];
  const workspace = {
    id: workspaceId,
    name: "Mobile",
    normalizedName: "mobile",
    ownerId: 7,
    legacyKey: "additional-0",
    isPrimary: primary,
    members: role === "owner" ? [] : [{ userId: 8, role }],
  };
  const user = role === "owner" ? owner : { ...owner, id: 8 };
  const db = {
    $queryRaw: async () => {
      calls.push("lock");
    },
    workspace: {
      findFirst: async ({ where }) => {
        calls.push({ find: where });
        if (where.normalizedName) return where.normalizedName === "mobile" ? workspace : null;
        assert.ok(where.OR?.some((clause) => clause.ownerId === user.id));
        assert.ok(where.OR?.some((clause) => clause.members?.some?.userId === user.id));
        if (where.id && where.id !== workspaceId) return null;
        if (role === "stranger") return null;
        return workspace;
      },
      findMany: async ({ where }) => {
        assert.equal(where.OR[0].ownerId, user.id);
        return [workspace];
      },
      create: async ({ data }) => {
        calls.push({ created: data });
        return data;
      },
      delete: async ({ where }) => {
        calls.push({ deletedWorkspace: where });
      },
    },
    user: {
      findUnique: async () => owner,
      update: async ({ data }) => {
        calls.push({ userUpdate: data });
        return owner;
      },
    },
    project: {
      findMany: async ({ where }) => {
        calls.push({ projects: where });
        return [{ id: 3, name: "Shared" }];
      },
      findUnique: async () => ({ id: 3, ownerId: 7, workspaceId }),
      count: async () => 0,
      create: async ({ data }) => {
        calls.push({ projectCreate: data });
        return { id: 3, ...data };
      },
      update: async (args) => {
        calls.push({ projectUpdate: args });
        return args.data;
      },
      delete: async (args) => {
        calls.push({ projectDelete: args });
      },
    },
    workspaceMember: {
      updateMany: async () => ({ count: 1 }),
      deleteMany: async () => ({ count: 1 }),
    },
    workspaceInvite: {
      count: async () => 0,
      create: async ({ data }) => {
        calls.push({ invite: data });
        return { id: workspaceId, role: data.role };
      },
    },
  };
  db.$transaction = async (fn) => fn(db);
  const controller = createWorkspaceController(db);
  async function call(action, { body = {}, params = {} } = {}) {
    const res = response();
    await controller[action]({ user, body, params: { workspaceKey: workspaceId, ...params } }, res);
    return res;
  }
  return { db, call, calls, workspace, user };
}
