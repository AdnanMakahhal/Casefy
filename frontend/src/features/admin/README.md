# Admin feature architecture

Admin pages use path-based routes. Query parameters are reserved for filters and
resource selection, not page selection.

## Routes

- `/admin` — overview
- `/admin/users` — user management
- `/admin/support` — support inbox
- `/admin/custom` — custom plan requests
- `/admin/subscriptions` — subscriptions
- `/admin/payments` — payments
- `/admin/refunds` — refunds

Legacy `/admin?view=...` URLs are redirected by `AdminPage.jsx` and should not be
used in new code.

## Current ownership

- `AdminPage.jsx` owns the shared admin shell and route-level refresh state.
- `navigation.js` is the single source of truth for route metadata and paths.
- Service components own their data requests, filters, dialogs, and notices.
- `api.js`, `ui.jsx`, and `styles.js` contain code shared across admin services.

## Planned extraction

The next refactor should be behavioral no-op work performed in small steps:

1. Extract `overview/AdminOverview.jsx` from `AdminPage.jsx`.
2. Extract `users/AdminUsers.jsx`, `users/UserDialogs.jsx`, and
   `users/UsersTable.jsx`.
3. Group each service under its own folder, for example
   `subscriptions/SubscriptionsPage.jsx` and `payments/PaymentsPage.jsx`.
4. Extract `layout/AdminLayout.jsx` for the sidebar, page heading, refresh action,
   notices, and route outlet.
5. Convert `App.jsx` to nested admin routes rendered through `AdminLayout`.
6. Remove the legacy `?view=` redirect after existing bookmarks have migrated.

Keep API state close to the page that consumes it. Only move state into the
layout when multiple child routes genuinely share it.
