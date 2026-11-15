import assert from "node:assert/strict";
import { test } from "node:test";
import { fixture, workspaceId } from "./workspace-fixture.js";

test("a primary workspace cannot be deleted by its owner",async()=>{
  const f=fixture({primary:true});assert.equal((await f.call("deleteWorkspace",{body:{name:"Mobile"}})).statusCode,403);assert.ok(!f.calls.some(c=>c.deletedWorkspace));
});
test("only workspace owners can delete a workspace",async()=>{
  for(const role of ["viewer","editor","stranger"]){const f=fixture({role});const res=await f.call("deleteWorkspace",{body:{name:"Mobile"}});assert.equal(res.statusCode,role==="stranger"?404:403);assert.ok(!f.calls.some(c=>c.deletedWorkspace));}
});
test("deleting by permanent ID never shifts remaining workspace or project IDs",async()=>{
  const f=fixture();const res=await f.call("deleteWorkspace",{body:{name:"Mobile"}});assert.equal(res.statusCode,200);assert.deepEqual(f.calls.find(c=>c.deletedWorkspace).deletedWorkspace,{id:workspaceId});assert.deepEqual(f.calls.find(c=>c.userUpdate).userUpdate,{workspaceNames:[]});assert.ok(!f.calls.some(c=>c.projectUpdate));
});
test("workspace deletion rejects stale names and requires confirmation",async()=>{
  const f=fixture();assert.equal((await f.call("deleteWorkspace",{body:{name:"Wrong"}})).statusCode,409);assert.equal((await f.call("deleteWorkspace")).statusCode,400);assert.ok(!f.calls.some(c=>c.deletedWorkspace));
});
test("project deletion requires editor or owner membership",async()=>{
  for(const role of ["owner","editor","viewer","stranger"]){const f=fixture({role});assert.equal((await f.call("deleteProject",{params:{projectId:3}})).statusCode,["owner","editor"].includes(role)?200:role==="viewer"?403:404);assert.equal(f.calls.some(c=>c.projectDelete),["owner","editor"].includes(role));}
});
test("invalid project IDs never touch the database",async()=>{
  for(const projectId of ["0","-1","NaN","1.5","9007199254740992"]){const f=fixture();assert.equal((await f.call("deleteProject",{params:{projectId}})).statusCode,400);assert.equal(f.calls.length,0);}
});
