# Admin feature architecture

Admin pages use path-based routes. Query parameters are reserved for filters and
resource selection, not page selection.

## Routes

- `/admin` — overview
- `/admin/users` — user management
- `/admin/support` — support inbox
- `/admin/subscriptions` — subscriptions
- `/admin/payments` redirects to `/admin/support?category=payment`, preserving customer filters.
- `/admin/refunds` redirects to `/admin/support?category=refund`.

Legacy `/admin?view=...` URLs are redirected by `AdminPage.jsx` and should not be
used in new code.

## Current ownership

Support conversations open inline with `?requestId=...`. The topic filter accepts
`messages`, `payment`, and `refund`; payment and refund tickets show billing
history only to admins and managers. History is matched by the ticket's authenticated
`userId`, never by a guest email address. Refund approval uses the existing Stripe
refund flow and one server-derived operation ID per ticket, including retries.
Refund amounts and reasons are reviewed before confirmation. Viewing or filtering
conversations never issues refunds.

Only the assigned admin or manager can send a conversation reply. The API
rechecks assignment under a row lock when saving the message. New tickets include
one persisted `support_bot` welcome reply, clearly labeled as automated; it is
not sent as an email and is not added again on customer replies.

Closed tickets reject replies from both staff and customers. Closure is rechecked
under the request row lock before saving a message. The UI shows a closure notice
and returns to the conversation list after two seconds. Entering and leaving a
DM uses the shared animated view; initial loading uses chat-shaped skeletons.

New tickets start Pending. Only Pending -> Open -> Closed is allowed; neither
staff nor customer replies change the ticket state. Closed tickets cannot be
opened, reassigned, or reopened. Stale direct links show a neutral closed card.

The Support Payments filter keeps the complete payment ledger under Payment
history, plus Payment conversations for billing tickets. Receipts, customer
filters, messaging, refunds, and pagination use the existing Payments component.
Manual Refresh reloads the current view with its skeleton and disables/spins
the header action until loading finishes. Background inbox polling keeps data
visible. Staff requests time out after 30 seconds with a retryable error.

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
