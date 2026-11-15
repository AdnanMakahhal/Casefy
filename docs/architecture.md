# Code guide

The backend follows the chapter 4 course project's structure: application code lives in `src`, the server starts Express, routes describe endpoints, middleware authenticates requests, and one Prisma client connects to PostgreSQL. Casefy also keeps controllers and services because subscriptions, refunds and private workspaces need more logic than a basic todo API.

## Follow a request

1. `frontend/src/lib/api.js` sends the browser request and handles API errors.
2. `backend/src/app.js` registers the feature routers. Stripe's raw webhook parser runs before JSON parsing so signature verification receives the original bytes.
3. A route applies authentication and role checks, then calls its controller.
4. The controller validates input and checks ownership. Services handle provider calls and reconciliation; Prisma reads or writes the database.
5. The frontend updates its state from the API response.

## Backend routes

| Router | Public API prefix | Purpose |
| --- | --- | --- |
| authRoutes | `/api/auth` | Signup, sign-in, profile and account deletion |
| workspaceRoutes | `/api/auth` | Private workspaces, projects, invitations and members |
| adminRoutes | `/api/admin` | Staff-only user and account management |
| billingRoutes | `/api/billing` | Stripe checkout, billing portal and existing PayPal support |
| supportRoutes | `/api/support` | Contact tickets and replies |
| messageRoutes | `/api/messages` | The signed-in user's messages |
| reportRoutes | `/api/reports` | The signed-in user's saved generation reports |
| generationRoutes | `/api/generation` | Staff-only AI generation |

Existing URLs are preserved. Workspace ownership, membership changes, project edits and invite acceptance keep their transaction locks. Subscription entitlements are calculated in `utils/subscriptions.js`; Stripe reconciliation lives in `services/billingService.js`.

## Frontend features

Each page composes reusable components and feature-specific UI. Admin inboxes, payments, refunds, subscriptions, integrations, reports, user dialogs and the user table are separate modules under `features/admin`. Checkout's plan preview and receipt animation live under `features/checkout`. Shared HTTP, display formatting and browser storage are under `lib`.

`AuthProvider` owns the signed-in session. The normal user's support conversation is a floating widget; staff handle replies in the shared admin panel. `context` contains shared UI state rather than unused authentication placeholders.

## What is deliberately retained

- `prisma/migrations` is the applied database history. Its SQL and checksums are unchanged, including historical SQL comments.
- `tests` and smoke scripts protect authentication, payment and workspace behavior during refactoring.
- Generated Prisma files and installed dependencies are required to run the app but are ignored by Git.
- Server-side PayPal records and cancellation controls remain usable even though checkout no longer displays a PayPal button.
- Runtime source has no comments. Folder names, function names, formatting and these documents explain the code.
