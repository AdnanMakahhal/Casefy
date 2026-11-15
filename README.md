# Casefy

Casefy is a React frontend and an Express API backed by PostgreSQL and Prisma.

## Run locally

Use Node.js 24 or 26. Install once from the repository root:

```sh
npm ci
```

Copy backend/.env.example to backend/.env and set DATABASE_URL, JWT_SECRET and FRONTEND_URL. Existing local environment files are preserved. Apply migrations to a new database with npm run db:migrate.

Start the API and frontend in separate terminals:

```sh
npm run server
npm run dev
```

The API uses port 8000 and Vite normally uses 5173. Vite forwards /api requests to the API. An optional VITE_API_URL override belongs in frontend/.env.development.local; production defaults to the same-origin /api path.

## Folder structure

```text
backend/
  src/
    server.js       starts the API
    app.js          middleware and route registration
    config.js       loads the local environment
    db.js           one Prisma client
    routes/         endpoints grouped by feature
    controllers/    validation, permissions and responses
    services/       billing reconciliation and AI generation
    middleware/     authentication and staff permissions
    utils/          shared domain helpers
  prisma/           schema and database migration history
  scripts/          Stripe setup and database smoke checks
  tests/            API and business-rule regression tests
frontend/
  src/
    pages/          route-level screens
    features/       admin, authentication, checkout, support and workspace UI
    components/     reusable interface components
    context/        shared toast and deletion state
    layouts/        header, footer and page shell
    lib/            HTTP, formatting and browser storage helpers
    index.css       global styles
  public/           referenced logos and static assets
  tests/            checkout formatting tests
```

The root package-lock.json is the single dependency lockfile. See [architecture](docs/architecture.md) for the request flow and code navigation.

## Checks

```sh
npm run lint
npm run format:check
npm test
npm run build
npm run staff:smoke --workspace=casefy-backend
npm run workspace:smoke --workspace=casefy-backend
```

The smoke checks roll back their database fixtures. They do not send email, create charges, or call live AI providers. The build generates the Prisma client and writes the frontend to frontend/dist. Run npm start for the API; when hosting the built frontend separately, forward /api to the API and configure public HTTPS FRONTEND_URL for billing return URLs.

## Features

- Signup, sign-in, profile editing and role-based dashboards.
- Private workspaces with permanent IDs, one-use invitations and owner/viewer/editor permissions. See [workspaces](docs/private-workspaces.md).
- Shared admin/manager user management, support inboxes, subscription dates, complimentary access, refunds, integrations and reports. See [staff panel](docs/staff-panel.md).
- Stripe checkout, verified webhooks and subscription upgrades. Configure matching Stripe keys, prices, portal configuration and the deployed webhook signing secret in the backend environment.
- PayPal has no checkout button or browser SDK. Existing PayPal subscription verification and management remain available. See [existing PayPal support](docs/paypal-checkout.md).
- Staff AI generation uses configured provider credentials. Customer generation remains a request preview; browser test execution is not connected.

Keep environment files private. Database migrations are historical records and must not be edited after application; new database changes belong in new migrations.
