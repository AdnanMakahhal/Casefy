import assert from "node:assert/strict";
import { test } from "node:test";
import { fixture, workspaceId, owner, response } from "./workspace-fixture.js";
import { createAuthController } from "../controllers/authController.js";

test("listing returns private permanent IDs and current membership roles", async () => {
  for (const role of ["owner", "viewer", "editor"]) {
    const f = fixture({ role }); const res = await f.call("getWorkspaces");
    assert.equal(res.statusCode, 200); assert.equal(res.body[0].id, workspaceId);
    assert.equal(res.body[0].key, workspaceId); assert.equal(res.body[0].role, role);
    assert.equal(res.body[0].isPrivate, true);
  }
});
test("workspace creation normalizes names and ignores client owner and plan", async () => {
  const f=fixture(); const res=await f.call("addWorkspace",{body:{name:"  Team   QA ",ownerId:99,plan:"pro"}});
  assert.equal(res.statusCode,201);
  assert.deepEqual(f.calls.find(c=>c.created).created,{ownerId:owner.id,name:"Team QA",normalizedName:"team qa"});
  assert.equal(f.calls[0],"lock");
});
test("workspace creation rejects duplicate normalized names", async()=>{
  const f=fixture(); const res=await f.call("addWorkspace",{body:{name:" MOBILE "}});
  assert.equal(res.statusCode,409); assert.ok(!f.calls.some(c=>c.created));
});
test("workspace creation uses the locked current account plan",async()=>{
  for(const plan of ["free",undefined,"unknown"]){const f=fixture();f.db.user.findUnique=async()=>({...owner,plan});
    const res=await f.call("addWorkspace",{body:{name:"New"}});assert.equal(res.statusCode,403);assert.ok(!f.calls.some(c=>c.created));}
});
test("deleted accounts cannot create workspaces",async()=>{
  const f=fixture();f.db.user.findUnique=async()=>null;
  assert.equal((await f.call("addWorkspace",{body:{name:"New"}})).statusCode,401);
});
test("workspace names must be nonempty and at most 80 characters",async()=>{
  for(const name of ["",123,"x".repeat(81)]){const f=fixture();assert.equal((await f.call("addWorkspace",{body:{name}})).statusCode,400);assert.equal(f.calls.length,0);}
});
test("profile edits cannot duplicate a second workspace or change the plan",async()=>{
  const controller=createAuthController({});let res=response();await controller.updateMe({user:owner,body:{workspaceName:" mobile "}},res);assert.equal(res.statusCode,409);
  res=response();await controller.updateMe({user:owner,body:{plan:"pro"}},res);assert.equal(res.statusCode,400);
});
test("only owners can create invitations and roles cannot grant ownership",async()=>{
  for(const role of ["viewer","editor"]){const f=fixture({role});assert.equal((await f.call("createInvite",{body:{role:"editor"}})).statusCode,403);}
  const f=fixture();assert.equal((await f.call("createInvite",{body:{role:"owner"}})).statusCode,400);
});
test("invite secrets are returned once and only their hash is persisted",async()=>{
  const f=fixture();const res=await f.call("createInvite",{body:{role:"viewer"}});assert.equal(res.statusCode,201);
  const saved=f.calls.find(c=>c.invite).invite;assert.match(res.body.token,/^[a-f0-9]{64}$/);assert.notEqual(saved.tokenHash,res.body.token);
  assert.equal(saved.role,"viewer");assert.equal(saved.workspaceId,workspaceId);assert.ok(saved.expiresAt>Date.now());assert.equal(saved.token,undefined);
});
test("malformed invitation tokens fail before database access",async()=>{
  for(const token of ["",null,"x".repeat(64),"a".repeat(65)]){const f=fixture();assert.equal((await f.call("acceptInvite",{body:{token}})).statusCode,404);assert.equal(f.calls.length,0);}
});
test("only owners can change member permissions",async()=>{
  for(const role of ["viewer","editor"]){const f=fixture({role});assert.equal((await f.call("changeMember",{params:{memberId:8},body:{role:"editor"}})).statusCode,403);}
  const f=fixture();assert.equal((await f.call("changeMember",{params:{memberId:7},body:{role:"remove"}})).statusCode,403);
});
