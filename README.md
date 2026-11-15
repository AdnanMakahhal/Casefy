# Casefy

Casefy helps teams create and manage software test cases.

For Vercel, import this repository at its root. See [Vercel, Neon and payments setup](docs/vercel-deployment.md) for environment variables, automatic `vercel.app` domains, database migrations and provider webhooks.

## How it works

1. Create a project for your app.
2. Add requirements or documents.
3. Generate and review test cases.
4. Run approved tests and review the results.

Signup, login, onboarding, and profiles use the backend API. The backend uses PostgreSQL through Prisma. Staff test generation is connected to configurable AI providers. Customer generation remains a request preview; test execution is not connected.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown in your terminal.

## Run the backend

Create a PostgreSQL database, then from the `backend` folder:

```bash
npm install
copy .env.example .env
npm run prisma:generate
npm run db:migrate
npm run dev
```

Set `DATABASE_URL` and a private `JWT_SECRET` in `backend/.env` before running migrations or starting the API. The API listens on port `8000` by default. Set `VITE_API_URL=http://localhost:8000/api` in `frontend/.env` if needed.

## Users and roles

PayPal Subscribe is available beneath Stripe for new paid checkouts. See [PayPal checkout setup](docs/paypal-checkout.md) for the server credentials, webhook, and separate tier/interval plan mappings needed to enable it.

The shared [staff panel](docs/staff-panel.md) is available at `/admin` for Admin and Manager accounts. It includes user blocking, contact inboxes, subscription/payment/refund management, customer messages, encrypted provider configuration, unlimited staff generation, and saved reports. Configure AI and email keys in API integrations before using those providers.

The dashboard's Generate test cases button and Test generator navigation item open `/test-generator`. For standard customer accounts, this is a UI preview: user stories, local PDF/DOCX/TXT/Markdown attachments, URL input for paid plans, coverage types, case count, priority, and model/provider settings can be prepared and reviewed. Source drafts and per-model configurations are preserved while switching controls. Requests can be downloaded as JSON; document contents are not included in that download. No content is sent to an AI provider and no credits are charged. The reusable `ModelSelectorPrompt` and provider placeholders live in `frontend/src/features/test-generation`; `CasefyMark.jsx` is the placeholder for the future Casefy icon. Admins and managers can generate real test cases after configuring a provider in the shared admin panel; see the Staff panel section below.

`backend/prisma/schema.prisma` defines users, permanent private workspaces, memberships, hashed single-use invitations, workspace projects, billing records and support data. A database trigger creates a private primary workspace for every new account, including accounts created by staff. It also synchronizes primary workspace renames. Deleting a workspace cascades only its projects, invitations and memberships.

Signup has two steps. The first collects credentials in memory; the second submits them with the role and workspace name to create the account. Passwords are hashed with bcrypt and are never returned by the API or saved in browser storage. Reloading before finishing signup returns to the first step. The session token is kept in session storage, and `/me` restores the current database user on refresh.

| Database role | Login destination |
| --- | --- |
| `admin`, `manager` | `/admin` (shared staff panel) |
| `qa_engineer`, `student`, `employee`, `developer` | `/dashboard` (shared workspace) |

Public signup and profile updates accept only the four standard roles. To assign an existing account as Admin or Manager, run `npm run db:studio` in `backend` and change that user's role. No default privileged account or password is created. The API verifies the current database user on authenticated requests; frontend routing alone does not authorize admin access.

Endpoints: `POST /api/auth/signup`, `POST /api/auth/signin`, `GET /api/auth/me`, `PATCH /api/auth/me`, and `DELETE /api/auth/me`. `GET /api/admin` is restricted to Admin and Manager accounts. Signup requires `name`, `email`, `password` (at least 8 characters), `role`, and `workspaceName` (1–80 characters). Login returns `{ user, token, redirectTo }`.

The profile page supports editing name, email, workspace name, and standard roles. Changing the email requires `currentPassword`; privileged users can edit their details but cannot change their own roles. Deleting the account requires `currentPassword`, permanently removes only the authenticated user, and clears the browser session.

Profile photos accept JPEG, PNG, or WebP files up to 10 MB. A circular crop preview supports dragging, zooming, and keyboard-accessible position sliders. The browser uploads the selected square crop as `avatarImage`; the server validates it and stores a 256×256 JPEG data URL on the user record. Send `avatarImage: null` to remove the photo. Apply the avatar migration with `npm run db:migrate` and regenerate the client after pulling schema changes.

The `/workspaces` page lists private workspaces owned by or shared with the authenticated user. Each workspace has a permanent UUID and its own access list. Signup automatically creates a private primary workspace. Paid accounts can create additional workspaces; Free users can use their own workspace and accept invitations. Workspace names need only be unique within an owner account.

Workspace cards link to `/workspaces/:id`. Owners can create viewer or editor invite links, revoke unused links, change permissions, and remove members. Invitations require sign-in, expire after seven days, and can be accepted by one account. Viewers can read projects; owners and editors can create, edit and delete projects. The server checks membership on every request, including for staff accounts. Existing workspaces and projects are migrated to UUIDs without changing their ownership. See [private workspace details](docs/private-workspaces.md).

## Prisma development

Accounts have a database-backed `plan` (`free` by default). Free accounts can view all existing workspace names, but the Add workspace control is hidden and the creation API returns 403. Paid plans (`plus`, `pro`, `enterprise`) can add names. Roles do not bypass this plan restriction. Signup and profile updates cannot change the plan. The profile badge displays the stored plan. Stripe-confirmed subscription state controls Plus and Pro upgrades.

## Stripe Billing

The Enterprise pricing button opens `/support`, a public contact form for name, email, subject, and description. `POST /api/support` validates and saves the request to `SupportRequest` and returns a reference number. Signed-in users' name and email are prefilled. Requests are routed to the staff Support, Enterprise, or Refunds inbox. Authenticated requests are linked to the requesting account. Staff can reply in-app or through the configured Resend integration. Users can read and reply to their conversations at `/messages`.

The Stripe CLI was installed using `npm install -g @stripe/cli`, followed by `stripe agent setup`. Stripe's `stripe_implementation_planner` was called through the official MCP server with Casefy's business context. Its original and accepted responses are saved in `docs/stripe-planner-response.json` and `docs/stripe-planner-accepted.json`.

The plan uses Stripe-hosted Checkout with recurring flat-rate Prices and flexible billing mode, a freemium account with no card at signup, and the customer portal API for subscription management. Each paid tier has its own Product with monthly and annual Prices. Plus is USD 24/month or USD 230.40/year; Pro is USD 79/month or USD 758.40/year. Annual billing includes a recurring 20% discount compared with twelve monthly payments. Pricing shows the equivalent monthly rate and full yearly charge; Checkout shows the annual total. Enterprise uses the support form for custom quotes.

The previous checkout collected placeholder billing details and displayed a nonfunctional payment-method selector. It now reads prices from the server and redirects to Stripe to collect payment details. It does not promise PayPal availability; Stripe displays the eligible payment methods configured in the sandbox. The hosted redirect does not need Stripe.js or a publishable key in frontend code.

Sandbox keys and catalog IDs are in the ignored `backend/.env`. `.env.example` contains empty placeholders. Never commit actual keys. For production, use a restricted key with only the required Billing, Checkout, Customer, Price, and portal permissions, stored in your hosting platform's secret manager. Use a separate production webhook signing secret.

From `backend`, use separate terminals for the API and webhook listener:

```bash
npm run dev
```

```bash
npm run stripe:listen
```

The listener reads the sandbox key from `.env`, forwards selected billing events to `http://localhost:8000/api/billing/webhook`, and stores the signing secret without displaying it. Restart the backend after the first listener setup. Keep the listener running during local payment tests. Then open the site's Pricing page, choose Plus or Pro, and continue to Stripe. Use Stripe's sandbox card `4242 4242 4242 4242`, any future expiry, and any three-digit CVC.

`npm run stripe:setup` recreates/reuses the sandbox product catalog idempotently, including the approved annual prices with 20% off. The discount is built into recurring yearly Prices, so customers do not need a coupon. Annual prices use separate lookup keys from earlier undiscounted pricing. This setup script refuses live keys. `npm run stripe:test` exercises real Stripe sandbox API calls and the configured database using temporary users/customers. It cancels subscriptions and deletes the temporary customer and user records afterward; sandbox invoice history can remain in Stripe.

The backend accepts only configured server-side plan/interval pairs. Customer IDs and return URLs come from authenticated account data and server configuration. Per-account database locks and idempotency keys prevent concurrent duplicate checkouts, and open sessions are reused. An existing active or delinquent subscription must be managed through the portal.

Webhooks use the raw request body and verify the Stripe signature before processing. Event IDs are saved atomically with the plan update. Each event fetches current Stripe subscription state under the same account lock, so older events do not restore an outdated plan. Paid access requires a recognized Price and either an active subscription with a paid latest invoice or a Stripe trial. Delinquent, unpaid, paused, incomplete, canceled, and unknown-price subscriptions get Free access. Scheduled cancellations retain access while the subscription remains active and paid. The success URL alone never grants paid access.

The profile refreshes subscription state from Stripe and opens the authenticated customer's portal. Deleting an account expires open Checkout sessions and cancels active subscriptions immediately before removing local data, preventing future renewal charges. Stripe customer/invoice records remain available in Stripe for billing history.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/billing/plans` | Public catalog amounts and available intervals |
| `POST /api/billing/checkout` | Authenticated hosted Checkout session; `{ plan, billing }` |
| `GET /api/billing/checkout/:sessionId` | Verify ownership and reconcile payment/subscription state |
| `POST /api/billing/portal` | Authenticated customer portal session |
| `GET /api/billing/status` | Refresh authenticated subscription state |
| `POST /api/billing/webhook` | Stripe-signed billing event handler |

Before live payments, configure your production `FRONTEND_URL` and a publicly reachable HTTPS webhook, and enable the intended Smart Retries and customer recovery emails in Stripe Billing settings. Tax collection is deliberately not enabled: confirm your tax obligations and registrations first, then configure [Stripe Tax for subscriptions](https://docs.stripe.com/billing/taxes/collect-taxes). The integration follows [Stripe's subscription guide](https://docs.stripe.com/billing/subscriptions/build-subscriptions), [customer portal guidance](https://docs.stripe.com/customer-management/integrate-customer-portal), and [webhook guidance](https://docs.stripe.com/webhooks).

Run backend commands from `backend`:

```bash
npm run prisma:validate
npm run db:dev -- --name your_change
npm run prisma:generate
npm test
```

The initial migration is intended for a new database. If you already applied the old `sql/schema.sql`, preserve that database and baseline/convert its existing `users` table before deploying this initial migration; do not reset a database containing user data. The old text role column must become the `Role` enum and the nullable `workspace_name` column must be added.

Prisma configuration follows the [Prisma 7 setup documentation](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7). Backend tests use an injected database implementation to exercise authentication and authorization without a running PostgreSQL server.
