# Casefy frontend

The frontend is a React application built with Vite and Tailwind CSS. It provides public pages, authentication, customer dashboards, private workspaces, checkout, support chat, and the shared staff panel.

See the [root README](../README.md) for project installation and the [backend README](../backend/README.md) for API setup and detailed workspace and staff behavior.

## Setup and development

Use Node.js 24 or 26. Run `npm ci` from frontend, or `npm ci --prefix frontend` from the repository root. Install backend dependencies separately with `npm ci --prefix backend`.

Start the backend from a separate root terminal with `npm run dev --prefix backend`. From frontend, start Vite:

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
  components/     reusable interface components, header, and footer
  Context/        shared toast and deletion state
  ui/             layout, buttons, typography, marketing components, and skeletons
  lib/            HTTP, formatting, and browser storage helpers
  styles/         index.css, font imports (fonts.js), and Tailwind component styles
public/           referenced logos and static assets
```

## Application behavior

Shared buttons live in `src/ui/Button.jsx`, with Tailwind styles in `src/ui/Button.css`. Use `variant` (`primary`, `secondary`, `outline`, `danger`, or `ghost`) and `size` (`sm`, `md`, `lg`, or `icon`) for standard actions. Use `size="custom"` to supply spacing through `className`, or `variant="unstyled"` for specialized controls.

```jsx
import Button from "./ui/Button";

<Button type="submit" loading={isSaving}>Save changes</Button>
<Button variant="outline" onClick={onCancel}>Cancel</Button>
<Button to="/workspaces">Open workspaces</Button>
```

Buttons default to `type="button"`. Pass `type="submit"` for form submission. Both `disabled` and `loading` prevent actions; navigation uses `to` for app routes or `href` for external links. Native attributes, event handlers, and refs pass through to the underlying element.

Typography components live in `src/ui/H1.jsx`, `H2.jsx`, `P.jsx`, and `Span.jsx`, with shared Tailwind styles in `Typography.css`. They render the corresponding HTML elements without extra wrappers and forward native attributes, event handlers, and refs. The existing animated, accented heading is in `src/ui/Heading.jsx`.

```jsx
import H1 from "./ui/H1";
import H2 from "./ui/H2";
import P from "./ui/P";
import Span from "./ui/Span";

<H1>Workspace overview</H1>
<H2>Recent projects</H2>
<P>Manage your team's <Span variant="accent">test coverage</Span>.</P>
<P variant="muted">Updated today</P>
```

`H1` supports the `hero` variant; `H2` supports `compact`. Paragraph variants are `body` (default), `lead`, and `muted`. Spans inherit surrounding styles by default and support `accent`, `muted`, and `label`. Use `className` for utility overrides, or `variant="unstyled"` on headings and paragraphs when existing screen-specific styling should apply.

Each page composes reusable components and feature-specific UI. Admin inboxes, payments, refunds, subscriptions, user dialogs, and the user table are separate modules under features/admin. Checkout's plan preview and receipt animation live under features/checkout. Shared HTTP, display formatting, and browser storage are under lib.

AuthProvider owns the signed-in session. src/lib/api.js sends API requests and handles errors. The API enforces account roles, workspace membership, ownership, and billing entitlements.

Customers manage workspaces, projects, and one-use invitation links through Workspaces. Owners manage membership; editors can modify projects and viewers can read them. The [backend workspace guide](../backend/README.md#private-workspaces) describes permissions, invite expiry, and API endpoints.

Support is available through the floating Support button across public and customer pages. There is no standalone support page. Shared `ui/SupportButton.jsx` actions open the widget directly; refund actions select the refund topic. Old `/support` URLs redirect home and open the widget. Guests can sign in for account conversations or send a request inside the widget for sign-in help. Staff handle replies in the shared admin panel at /admin. Administrators and managers share navigation for users, support, subscriptions, payments, and refunds. See the [staff guide](../backend/README.md#staff-panel) for permissions and configuration.

New subscriptions use Stripe checkout. Higher eligible tiers use the existing subscription's upgrade flow. Ultra costs $299/month, or $3,588 billed annually at the same monthly rate, and includes unlimited seats, projects, workspaces, and credits. Custom-plan support enquiries and negotiated offers have been removed. Customer generation currently previews a request. Test generation and reports are customer-only pages.

## Checks and production build

From frontend:

```sh
npm run lint
npm run build
npm run preview
```

The build writes frontend/dist. Preview serves that build locally. Legal pages (Terms, Privacy, and Policy) contain direct JSX text and semantic HTML styled with Tailwind CSS.

For production, host dist and forward /api to the backend, or set VITE_API_URL at build time for the intended API origin. Configure the backend FRONTEND_URL to the public HTTPS frontend URL for billing return links.
