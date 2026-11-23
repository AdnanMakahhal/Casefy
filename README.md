# Casefy

Casefy contains a React frontend and an Express API backed by PostgreSQL and Prisma. It includes accounts, private workspaces, support messaging, Stripe billing, and staff tools.

## Installation

Use Node.js 24 or 26 and npm. Install dependencies separately:

```sh
npm ci --prefix backend
npm ci --prefix frontend
```

Each application has its own package.json and package-lock.json. Backend installation generates the Prisma client.

## Local development

Configure backend/.env with DATABASE_URL, JWT_SECRET, and FRONTEND_URL. Keep credentials private. See the [backend README](backend/README.md) for configuration and migration details. Review pending migrations before applying them to an existing database.

Start the API and frontend in separate terminals:

```sh
npm run dev --prefix backend
```

```sh
npm run dev --prefix frontend
```

The API defaults to port 8000. Vite defaults to port 5173 and forwards /api requests to the API.

## Structure

```text
casefy/
  backend/
    src/           Express API
    prisma/        database schema and migration history
  frontend/
    src/
      ui/          application layout
      components/  shared components, header, and footer
      pages/       route screens and static JSX legal pages
      features/    feature-specific UI and logic
    public/        static assets
```

## Validation and production build

```sh
npm run lint --prefix frontend
npm run build --prefix frontend
npm run prisma:validate --prefix backend
```

The frontend build writes frontend/dist. Host it with /api forwarded to the API, or configure VITE_API_URL at build time. Set the backend FRONTEND_URL to the public frontend origin. Start the API with `npm start --prefix backend`.

Generation currently prepares and saves request previews. AI generation and browser execution still require implementation. Removing demo content does not enable those integrations.

See the [frontend README](frontend/README.md) and [backend README](backend/README.md) for application behavior and configuration.
