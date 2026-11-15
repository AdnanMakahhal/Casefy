import assert from "node:assert/strict";
import { test } from "node:test";
import { fixture, workspaceId } from "./workspace-fixture.js";

test("project reads use workspace ID for owners, editors and viewers", async () => {
  for (const role of ["owner", "editor", "viewer"]) {
    const f = fixture({ role });
    const res = await f.call("getWorkspaceProjects");
    assert.equal(res.statusCode, 200);
    assert.deepEqual(f.calls.find((c) => c.projects).projects, { workspaceId });
  }
});
test("uninvited users cannot read workspace projects", async () => {
  const f = fixture({ role: "stranger" });
  assert.equal((await f.call("getWorkspaceProjects")).statusCode, 404);
  assert.ok(!f.calls.some((c) => c.projects));
});
test("permission is rechecked after the workspace lock", async () => {
  const f = fixture({ role: "editor" });
  const original = f.db.workspace.findFirst;
  let reads = 0;
  f.db.workspace.findFirst = async (args) => (++reads === 1 ? original(args) : null);
  assert.equal((await f.call("createProject", { body: { name: "Blocked" } })).statusCode, 404);
  assert.ok(!f.calls.some((c) => c.projectCreate));
});
test("viewers cannot create or edit workspace projects", async () => {
  const f = fixture({ role: "viewer" });
  for (const action of ["createProject", "updateProject"]) {
    assert.equal(
      (await f.call(action, { params: { projectId: 3 }, body: { name: "Denied" } })).statusCode,
      403,
    );
  }
  assert.ok(!f.calls.some((c) => c.projectCreate || c.projectUpdate));
});
test("editor creates projects attributed to workspace owner", async () => {
  const f = fixture({ role: "editor" });
  const res = await f.call("createProject", {
    body: { name: "Shared", ownerId: 8, workspaceId: "forged" },
  });
  assert.equal(res.statusCode, 201);
  const data = f.calls.find((c) => c.projectCreate).projectCreate;
  assert.equal(data.ownerId, 7);
  assert.equal(data.workspaceId, workspaceId);
});
test("editors can update project content but cannot move it to another workspace", async () => {
  const f = fixture({ role: "editor" });
  const res = await f.call("updateProject", {
    params: { projectId: 3 },
    body: { name: "Updated", description: "Details", workspaceId: "forged", ownerId: 8 },
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(f.calls.find((c) => c.projectUpdate).projectUpdate, {
    where: { id: 3 },
    data: { name: "Updated", description: "Details" },
  });
});
test("project creation enforces the workspace owner's configured limit", async () => {
  const f = fixture();
  f.db.project.count = async () => 300;
  assert.equal((await f.call("createProject", { body: { name: "Excess" } })).statusCode, 403);
  assert.ok(!f.calls.some((c) => c.projectCreate));
});
