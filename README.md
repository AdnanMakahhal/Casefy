# Casefy

Casefy combines a React frontend with an Express API backed by PostgreSQL and Prisma. It includes account dashboards, private workspaces, support messaging, Stripe billing, and staff tools for test generation and account management.

## Documentation

- [Frontend README](frontend/README.md): browser setup, page structure, authentication, support UI, and production builds.
- [Backend README](backend/README.md): API setup, database commands, routes, private workspaces, staff operations, and integrations.

## Requirements and installation

Use Node.js 24 or 26 and npm. The root package.json defines frontend and backend as npm workspaces. Install all three folders' dependencies once from the repository root:

```sh
npm ci
```

The root package-lock.json is the single dependency lockfile. Installation also generates the backend Prisma client.

## Run locally

Create backend/.env with DATABASE_URL, JWT_SECRET, and FRONTEND_URL. See the [backend setup](backend/README.md#environment) for details. Preserve existing local environment files and keep credentials out of source control.

Apply committed migrations to your configured database:

```sh
npm run db:migrate
```

Start the API and frontend in separate terminals from the root:

```sh
npm run server
```

```sh
npm run dev
```

The API defaults to port 8000 and Vite to 5173. Vite forwards /api requests to the API.

## Repository structure

```text
Casefy/
  README.md           project setup and shared commands
  package.json        npm workspaces and shared scripts
  package-lock.json   shared dependency lockfile
  backend/
    README.md         backend documentation
    src/              Express API
    prisma/           database schema and migrations
    scripts/          local setup and smoke checks
  frontend/
    README.md         frontend documentation
    src/              React application
    public/           static assets
```

## Shared commands

Run these from the repository root:

| Command              | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| npm run lint         | Check frontend lint rules                      |
| npm run format:check | Check source formatting                        |
| npm run format       | Format source files                            |
| npm run build        | Generate Prisma client and build frontend/dist |
| npm start            | Start the backend API                          |

When hosting the built frontend separately, forward /api to the API and configure a public HTTPS FRONTEND_URL for billing return URLs.

Staff generation uses configured provider credentials. Customer generation remains a request preview; browser test execution is not connected.
