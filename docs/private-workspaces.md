# Private workspaces

Every account owns a primary workspace with a permanent UUID, even when several accounts choose the same name. Workspace IDs are identifiers; they grant no access. A database trigger creates the primary workspace on account creation and preserves its ID when the profile workspace name changes. Paid accounts can add more workspaces. Primary workspaces cannot be deleted.

Open **Workspaces**, select a workspace you own, then use **People and invitations**. Viewer is the default permission. Create a link, copy it, and share it with the intended person. Each link expires after seven days and works for one signed-in account. The recipient explicitly accepts the invitation. The invitation survives the sign-in flow and new-account onboarding. A recipient keeps their own private primary workspace as well as access to the shared workspace.

Only the owner can manage people, change viewer/editor access, revoke pending invitations, or delete additional workspaces. Editors can create, edit and delete projects; viewers can only read them. Removing a member prevents further access and a consumed invite cannot restore their access. A new invitation is required. Reaccepting an invite never silently upgrades an existing member's role. Configured owner seat limits include the owner. Configured project limits apply per workspace; otherwise Free allows 2 projects, Plus 10, and Pro/Enterprise have no default cap.

Invites use 256-bit random tokens. Only SHA-256 hashes are stored; the raw token is returned once and appears in a URL fragment so it is not included in server access logs or referrer headers. The interface copies a link; it does not send email. Anyone holding an unused link can accept it, so share it privately or revoke it. Pending links cannot be recovered from storage; create another if lost.

All endpoints below require authentication:

| Method | `/api/auth` path | Access |
| --- | --- | --- |
| GET / POST | `/workspaces` | List own/joined; create additional on paid plan |
| GET / POST | `/workspaces/:id/projects` | Read: member; create: owner/editor |
| PATCH / DELETE | `/projects/:projectId` | Owner/editor of the project's workspace |
| DELETE | `/workspaces/:id` | Owner; name confirmation; primary prohibited |
| GET | `/workspaces/:id/access` | Owner; members and active invite metadata |
| POST | `/workspaces/:id/invites` | Owner; `{ role: "viewer" or "editor" }` |
| DELETE | `/workspaces/:id/invites/:inviteId` | Owner |
| PATCH | `/workspaces/:id/members/:userId` | Owner; `{ role: "viewer", "editor", or "remove" }` |
| POST | `/workspace-invites/accept` | Recipient; `{ token }` |

Access-changing operations, invitation acceptance and project operations lock the workspace and recheck permissions to prevent concurrent revocations from being bypassed. Staff roles do not bypass workspace membership. Legacy owner-only `primary`/`additional-N` URLs resolve only against that owner's migrated records; new UI links always use UUIDs. Deleting an additional workspace never renumbers another workspace.

Apply `npm run db:migrate` and regenerate the Prisma client. `npm test` verifies authorization and query scoping. `npm run workspace:smoke` runs the real database workflow with isolated fixtures inside a transaction and rolls it all back: private auto-creation, same-name isolation, one-use/expired/revoked links, viewer/editor/owner permissions, demotion, removal, stable IDs, profile rename and deletion. No emails are sent.
