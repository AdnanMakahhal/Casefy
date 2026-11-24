# Casefy backend

The backend is an Express API using PostgreSQL and Prisma. It handles authentication, private workspaces, billing, support, staff management, and customer reports. See the [root README](../README.md) for shared installation and the [frontend README](../frontend/README.md) for the browser application.

## Setup

Use Node.js 24 or 26. Install dependencies from backend with `npm ci`, or from the repository root with `npm ci --prefix backend`. The postinstall script generates the Prisma client in node_modules; the API imports it from @prisma/client.

### Environment

Create backend/.env if it does not already exist. The server loads this file directly through src/config.js. Supply your own values:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:5173
PORT=8000
```

Use DIRECT_URL when migrations need a separate direct database connection. Keep environment files private. Configure matching Stripe keys, price IDs, billing portal settings, and the webhook signing secret before using billing. Additional integration settings are described below.

### AI configuration

OpenRouter is the intended AI gateway. Keep `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` in `backend/.env` only. Set `OPENROUTER_MODEL` to your chosen OpenRouter model ID; there is no hard-coded model or fallback. The frontend uses one AI-assisted workflow, not a provider model selector. Live AI generation is not connected in the current request preview.

Test Generator currently prepares request previews. Saving OpenRouter settings does not enable generation or browser execution; the generation endpoint still needs to be connected.

### Database and server

Run these commands from backend:

```sh
npm run prisma:generate
npm run prisma:validate
npm run db:migrate
npm run dev
```

The API defaults to http://localhost:8000. Use npm start for the server without file watching. Applied migrations are historical records: add new migrations instead of changing applied SQL or checksums. npm run db:dev creates development migrations; npm run db:studio opens Prisma Studio.

Neon database URLs use the Prisma Neon adapter over secure WebSockets on port 443. Other PostgreSQL hosts use the standard PostgreSQL adapter. Prisma CLI migrations still require a direct database connection on port 5432.

## Source structure

```text
src/
  server.js       starts the API
  app.js          middleware and route registration
  config.js       loads backend/.env
  db.js           shared Prisma client
  routes/         endpoints grouped by feature
  controllers/    validation, permissions, and responses
  services/       billing reconciliation
  middleware/     authentication and staff permissions
  utils/          shared domain helpers
prisma/           schema and database migration history
```

## Follow a request

1. `frontend/src/lib/api.js` sends the browser request and handles API errors.
2. `backend/src/app.js` registers the feature routers. Stripe's raw webhook parser runs before JSON parsing so signature verification receives the original bytes.
3. A route applies authentication and role checks, then calls its controller.
4. The controller validates input and checks ownership. Services handle provider calls and reconciliation; Prisma reads or writes the database.
5. The frontend updates its state from the API response.

## Backend routes

| Router           | Public API prefix | Purpose                                               |
| ---------------- | ----------------- | ----------------------------------------------------- |
| authRoutes       | `/api/auth`       | Signup, sign-in, profile and account deletion         |
| workspaceRoutes  | `/api/auth`       | Private workspaces, projects, invitations and members |
| adminRoutes      | `/api/admin`      | Staff-only user and account management                |
| billingRoutes    | `/api/billing`    | Stripe checkout and billing portal                    |
| supportRoutes    | `/api/support`    | Contact tickets and replies                           |
| messageRoutes    | `/api/messages`   | The signed-in user's messages                         |
| reportRoutes     | `/api/reports`    | The signed-in user's saved generation reports         |

Existing URLs are preserved. Workspace ownership, membership changes, project edits and invite acceptance keep their transaction locks. Subscription entitlements are calculated in `utils/subscriptions.js`; Stripe reconciliation lives in `services/billingService.js`.

## Private workspaces

Every account owns a primary workspace with a permanent UUID, even when several accounts choose the same name. Workspace IDs are identifiers; they grant no access. A database trigger creates the primary workspace on account creation and preserves its ID when the profile workspace name changes. Paid accounts can add more workspaces. Primary workspaces cannot be deleted.

Open **Workspaces**, select a workspace you own, then use **People and invitations**. Enter an email, choose Viewer or Editor access, and select **Send invitation**. Email invitations can only be accepted by an account with that email address. Each invitation expires after seven days and works for one signed-in account. The recipient explicitly accepts the invitation. The invitation survives the sign-in flow and new-account onboarding. A recipient keeps their own private primary workspace as well as access to the shared workspace.

Only the owner can manage people, change viewer/editor access, revoke pending invitations, or delete additional workspaces. Editors can create, edit and delete projects; viewers can only read them. Removing a member prevents further access and a consumed invite cannot restore their access. A new invitation is required. Reaccepting an invite never silently upgrades an existing member's role. Configured owner seat limits include the owner. Configured project limits apply per workspace; otherwise Free allows 2 projects, Plus 10, and Pro/Ultra have no default cap.

Invites use 256-bit random tokens. Only SHA-256 hashes are stored; the raw token is delivered only in the invitation email and appears in a URL fragment so it is not included in server access logs or referrer headers. Email invitations use the existing Resend integration and require `FRONTEND_URL`, `RESEND_API_KEY` (or a saved integration), and a verified `EMAIL_FROM`. An email address is required for every invitation. Shareable invitation creation and copying are disabled. If email delivery fails, the invitation is revoked and an error is shown. Older invitations without an email address cannot be accepted. Owners can revoke pending invitations. Apply the `20261118000000_workspace_invite_email` migration before using email invitations.

All endpoints below require authentication:

| Method         | `/api/auth` path                    | Access                                             |
| -------------- | ----------------------------------- | -------------------------------------------------- |
| GET / POST     | `/workspaces`                       | List own/joined; create additional on paid plan    |
| GET / POST     | `/workspaces/:id/projects`          | Read: member; create: owner/editor                 |
| PATCH / DELETE | `/projects/:projectId`              | Owner/editor of the project's workspace            |
| GET            | `/projects/:projectId`              | Workspace member; includes saved request           |
| POST           | `/projects/:projectId/move`         | Owner/editor in source and destination             |
| DELETE         | `/workspaces/:id`                   | Owner; name confirmation; primary prohibited       |
| GET            | `/workspaces/:id/access`            | Owner; members and active invite metadata          |
| POST           | `/workspaces/:id/invites`           | Owner; `{ role: "viewer" or "editor" }`            |
| DELETE         | `/workspaces/:id/invites/:inviteId` | Owner                                              |
| PATCH          | `/workspaces/:id/members/:userId`   | Owner; `{ role: "viewer", "editor", or "remove" }` |
| POST           | `/workspace-invites/accept`         | Recipient; `{ token }`                             |

Access-changing operations, invitation acceptance and project operations lock the workspace and recheck permissions to prevent concurrent revocations from being bypassed. Staff roles do not bypass workspace membership. Legacy owner-only `primary`/`additional-N` URLs resolve only against that owner's migrated records; new UI links always use UUIDs. Deleting an additional workspace never renumbers another workspace.

Apply `npm run db:migrate` and regenerate the Prisma client before starting the API.

## Staff panel

Open `/admin` as an administrator or manager. Both roles use the same navigation: overview, users, support messages, subscriptions, payments, and refunds. The customer dashboard design, sidebar, account menu, responsive layout, and skeleton loading states are shared.

### Permissions and blocking

Both staff roles can manage customer accounts, block/unblock customers, handle support, manage billing, and message customers. Only admins can change staff accounts, or grant staff roles. Accounts cannot block or delete themselves. Blocking prevents sign-in and rejects existing session tokens on their next authenticated request; it does not cancel billing.

User filters support role, plan, active/blocked access, name/email/workspace search, and sorting. Pagination and filters are reflected in the URL.

### Email configuration

For email replies, configure `RESEND_API_KEY` and `EMAIL_FROM` with a verified sender email address in the server environment. Existing encrypted Resend settings override these defaults. In-app messages work without email configuration. Guest contacts require email replies because they have no account inbox. Sending an email records provider acceptance, not final inbox delivery.

Keep the existing `INTEGRATION_ENCRYPTION_KEY` stable when using saved encrypted email credentials; `JWT_SECRET` is the development fallback. No actual keys belong in source control.

### Billing and refunds

**Subscriptions → Dates & free access** grants Plus, Pro, or Ultra access for one week, 14 days, one calendar month (clamped at month end), or a custom start/end period. Start and end inputs display the staff member's local timezone. Access starts and expires on authenticated requests, and an open client refreshes at scheduled boundaries. No payment or automatic renewal is created. Accounts without an ongoing Stripe subscription use Free as their underlying plan outside the grant period; existing paid Stripe access continues and cannot be reduced by a lower complimentary tier. Staff can edit the schedule or remove the grant.

Stripe's recorded subscription start and billing-period end are displayed separately from complimentary dates. The start date is populated when Stripe subscription state is next synchronized. Complimentary schedules do not move Stripe billing dates or cancel charges.

Pricing disables the current plan and lower included tiers with a not-allowed cursor. Higher tiers link to the review screen. An active Plus subscriber can review an upgrade to Pro in a Stripe `subscription_update_confirm` portal flow using the existing subscription, trusted server price IDs, and the configured portal's proration behavior. No second subscription is created. Same-plan purchases, downgrades, and unhealthy or scheduled-to-cancel subscriptions are rejected by the upgrade endpoint. The effective plan changes through normal Stripe reconciliation after confirmation/payment. Ultra uses the same Checkout and subscription upgrade flow.

Subscriptions show each account's plan, status, renewal/end date, and scheduled cancellation. Staff can cancel at period end or remove that scheduled cancellation. This action does not issue a refund. Account plan overrides remain separate from Stripe prices and billing agreements.

Payments are read from Stripe and show customer mapping, charged/refunded amounts, currency, receipt, and status. Refunds require an explicit amount and reason, validate charge ownership and the remaining balance, and use a persisted operation ID as the Stripe idempotency key. Pending operations can be retried from Refunds → Issued refunds using the original operation. Refunds go to the original payment method and do not cancel subscriptions. Financial refund records prevent deleting their associated account; block access when needed instead.

Configure the Stripe webhook endpoint for the existing subscription/invoice events plus `refund.created`, `refund.updated`, and `refund.failed`. Refund events retrieve current provider state so out-of-order deliveries cannot restore an outdated refund status.

### Contacts and messaging

The floating Support widget accepts Support, Contact, Refund, and Live chat topics; there is no standalone support page. Custom-plan enquiries and offer endpoints have been removed. Incoming contacts appear in their respective staff inbox, with contact identity, category, status, and conversation history. Staff can mark requests open, pending, or resolved.

Signed-in requests use the authenticated account ID and email, regardless of submitted identity fields. Guest submissions are not automatically attached to an account merely because the email matches. Normal users use a floating Support chat at the bottom-right of their dashboard, Home, Features, How it works, Use Cases, Pricing, and Docs. It is available across public and customer pages and hidden for administrators and managers. The dashboard's Messages button opens that popup; bookmarked `/messages` links redirect to the dashboard and open it. Guests can open the launcher on the public pages and sign in to chat.

The widget supports ticket creation, support/refund/contact/live-chat topics, conversation history, threaded replies, unread indicators, and account messages. It preserves open state and drafts while navigating between the allowed pages. Open user conversations and staff conversation dialogs poll every five seconds; closed user inboxes poll every thirty seconds and staff ticket lists every fifteen seconds while the page is visible. Polling preserves draft replies and existing content. This is a human support interface; it does not invent bot responses, typing indicators, or staff online status. Request ownership remains checked server-side.

### Customer reports

Test generation and reports are available only to customer roles. Customer generation previews a request without making AI calls or executing browser tests. The reports API lists and retrieves only the signed-in customer's own saved results. Staff have no generation endpoint or report access.

### Test projects and workspace moves

Apply migrations with `npm run db:migrate` and regenerate Prisma with `npm run prisma:generate` before starting the updated backend. The `20261117000000_project_generation_request` migration adds a nullable JSONB field to projects; existing projects remain valid.

Open **Create test project** inside a workspace, or choose an editable workspace in the test generator. Enter a test / project name, review the request, and choose **Save as project**. The project stores the description and reviewed request settings, including requirements or document metadata. Document contents are not stored, and saving does not generate AI test cases or use credits. **View project** opens the saved request and offers a JSON download.

**Move project** transfers the project and saved request between owned workspaces or accepted invitations with Editor access. The server requires Owner or Editor access in both workspaces and enforces the destination owner's project limit. The destination workspace owner becomes the project owner, and destination membership controls access after the move. Moves lock both workspaces in a consistent order and reject stale concurrent edits.

### Validation

From `backend`, run `npm run prisma:validate`. From `frontend`, run `npm run build` and `npm run lint`.

Provider implementation references: [Stripe refunds](https://docs.stripe.com/api/refunds/create), [Stripe subscription updates](https://docs.stripe.com/api/subscriptions/update), and [Resend email](https://resend.com/docs/api-reference/emails/send-email).

## Commands and verification

Run these from backend:

| Command                 | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| npm run prisma:validate | Validate the database schema                                    |
| npm run prisma:generate | Generate the Prisma client                                     |
| npm run db:migrate      | Apply committed database migrations                            |
| npm run dev             | Start the API with file watching                               |
| npm start               | Start the API                                                  |

## Ultra plan rollout

Ultra replaces Custom and includes unlimited seats, projects, workspaces, and credits for USD 299/month. Annual billing is USD 3,588/year, with no annual discount for Ultra. Other plan prices remain unchanged.

Configure `STRIPE_PRICE_ULTRA_MONTHLY` with an active USD 299 monthly recurring price and `STRIPE_PRICE_ULTRA_ANNUAL` with an active USD 3,588 annual recurring price on the Casefy Ultra product. Enable that product in the existing Stripe billing portal configuration for upgrades. The API validates the Ultra price and interval before starting Checkout or an upgrade. Existing tax settings are unchanged.

The Prisma `ultra` enum maps to the existing PostgreSQL `custom` value, so existing accounts load without renaming stored plans. Run `npm run prisma:generate` and restart the API after changing the schema. The optional `20261123000000_ultra_plan` migration clears stored Ultra limits, moves old custom enquiries to general support, and retires unpaid offers. It is not required to restore admin reads; the application already uses unlimited Ultra limits. No live database or Stripe subscription is changed by the source update or Prisma client generation. Review and authorize the data cleanup and the full pending migration queue before running `npm run db:migrate`.

Historical agreements remain stored solely to reconcile existing paid subscriptions at their agreed price; this rollout does not reprice or cancel existing Stripe subscriptions. New purchases use the fixed Ultra catalog prices.

Unlimited credits are represented as null allowance/balance with `unlimited: true` in the credits API. Usage is recorded with an `unlimited_` activity prefix, without creating a finite allowance or blocking on a balance. If the account later moves to a limited plan, activity performed on Ultra does not consume that plan's allowance. Request-size validation remains in place.
