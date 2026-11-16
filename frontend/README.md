# Casefy frontend

The frontend is a React application built with Vite and Tailwind CSS. It provides public pages, authentication, customer dashboards, private workspaces, checkout, support chat, and the shared staff panel.

See the [root README](../README.md) for project installation and the [backend README](../backend/README.md) for API setup and detailed workspace and staff behavior.

## Setup and development

Use Node.js 24 or 26. Run npm ci from the repository root to install the frontend, backend, and shared dependencies together.

Start the backend from a separate root terminal with npm run server. From frontend, start Vite:

```sh
npm run dev
```

Vite normally serves http://localhost:5173. Its development proxy forwards /api requests to http://127.0.0.1:8000.

### Environment

The default API path is /api. To use another API origin, set VITE_API_URL in frontend/.env.development.local. Vite variables are visible in the browser, so keep database credentials, JWT secrets, payment secrets, and provider API keys in the backend environment.

## Source structure

```text
src/
  main.jsx        React entry point
  App.jsx         application routes and providers
  pages/          route-level screens
  features/       admin, authentication, checkout, support, and workspace UI
  components/     reusable interface components
  Context/        shared toast and deletion state
  layouts/        header, footer, and page shell
  lib/            HTTP, formatting, and browser storage helpers
  index.css       global styles
public/           referenced logos and static assets
```

## Application behavior

Each page composes reusable components and feature-specific UI. Admin inboxes, payments, refunds, subscriptions, user dialogs, and the user table are separate modules under features/admin. Checkout's plan preview and receipt animation live under features/checkout. Shared HTTP, display formatting, and browser storage are under lib.

AuthProvider owns the signed-in session. src/lib/api.js sends API requests and handles errors. The API enforces account roles, workspace membership, ownership, and billing entitlements.

Customers manage workspaces, projects, and one-use invitation links through Workspaces. Owners manage membership; editors can modify projects and viewers can read them. The [backend workspace guide](../backend/README.md#private-workspaces) describes permissions, invite expiry, and API endpoints.

The customer's support conversation is a floating widget on the dashboard and supported public pages. Staff handle replies in the shared admin panel at /admin. Administrators and managers share navigation for users, support, subscriptions, payments, and refunds. See the [staff guide](../backend/README.md#staff-panel) for permissions and configuration.

New subscriptions use Stripe checkout. Higher eligible tiers use the existing subscription's upgrade flow. Enterprise requests use the contact form. Customer generation currently previews a request. Test generation and reports are customer-only pages.

## Checks and production build

From frontend:

```sh
npm run lint
npm run build
npm run preview
```

The build writes frontend/dist. Preview serves that build locally. Run npm run format:check from the repository root for shared formatting checks.

For production, host dist and forward /api to the backend, or set VITE_API_URL at build time for the intended API origin. Configure the backend FRONTEND_URL to the public HTTPS frontend URL for billing return links.
