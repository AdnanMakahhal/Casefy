# Staff panel

Open `/admin` as an administrator or manager. Both roles use the same navigation: overview, users, support messages, Enterprise contacts, subscriptions, payments, refunds, integrations, test generator, and reports. The customer dashboard design, sidebar, account menu, responsive layout, and skeleton loading states are shared.

## Permissions and blocking

Both staff roles can manage customer accounts, block/unblock customers, handle support, manage billing, message customers, and generate tests without a Casefy monthly credit quota. Only admins can change staff accounts, grant staff roles, or save API credentials. Accounts cannot block or delete themselves. Blocking prevents sign-in and rejects existing session tokens on their next authenticated request; it does not cancel billing.

User filters support role, plan, active/blocked access, name/email/workspace search, and sorting. Pagination and filters are reflected in the URL.

## Integration configuration

In **API integrations**, save an API key and a model ID available to that provider account. OpenAI, DeepSeek, and Google Gemini are supported. Keys are AES-256-GCM encrypted before database storage and are never returned through the API. Saving with an empty key preserves the existing secret. Disabling an integration prevents its use.

For email replies, configure **Resend** with its API key and a verified sender email address. In-app messages work without email configuration. Guest contacts require email replies because they have no account inbox. Sending an email records provider acceptance, not final inbox delivery.

Environment variables can supply defaults: `OPENAI_API_KEY`, `OPENAI_MODEL`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `RESEND_API_KEY`, and `EMAIL_FROM`. Database settings override environment defaults.

Set a stable, private `INTEGRATION_ENCRYPTION_KEY` before saving production credentials. The existing `JWT_SECRET` is the development fallback. Changing the encryption secret requires re-entering saved API keys. No actual keys belong in source control.

Stripe continues to use the existing server environment settings. The integrations screen shows whether Stripe and webhook signing are configured, and whether Stripe is in sandbox or live mode.

## Billing and refunds

**Subscriptions → Dates & free access** grants Plus, Pro, or Enterprise access for one week, 14 days, one calendar month (clamped at month end), or a custom start/end period. Start and end inputs display the staff member's local timezone. Access starts and expires on authenticated requests, and an open client refreshes at scheduled boundaries. No payment or automatic renewal is created. Accounts without an ongoing Stripe subscription use Free as their underlying plan outside the grant period; existing paid Stripe access continues and cannot be reduced by a lower complimentary tier. Staff can edit the schedule or remove the grant.

Stripe's recorded subscription start and billing-period end are displayed separately from complimentary dates. The start date is populated when Stripe subscription state is next synchronized. Complimentary schedules do not move Stripe billing dates or cancel charges.

Pricing disables the current plan and lower included tiers with a not-allowed cursor. Higher tiers link to the review screen. An active Plus subscriber can review an upgrade to Pro in a Stripe `subscription_update_confirm` portal flow using the existing subscription, trusted server price IDs, and the configured portal's proration behavior. No second subscription is created. Same-plan purchases, downgrades, and unhealthy or scheduled-to-cancel subscriptions are rejected by the upgrade endpoint. The effective plan changes through normal Stripe reconciliation after confirmation/payment. Enterprise upgrades go through the contact form.

Subscriptions show each account's plan, status, renewal/end date, and scheduled cancellation. Staff can cancel at period end or remove that scheduled cancellation. This action does not issue a refund. Account plan overrides remain separate from Stripe prices and billing agreements.

Payments are read from Stripe and show customer mapping, charged/refunded amounts, currency, receipt, and status. Refunds require an explicit amount and reason, validate charge ownership and the remaining balance, and use a persisted operation ID as the Stripe idempotency key. Pending operations can be retried from Refunds → Issued refunds using the original operation. Refunds go to the original payment method and do not cancel subscriptions. Financial refund records prevent deleting their associated account; block access when needed instead.

Configure the Stripe webhook endpoint for the existing subscription/invoice events plus `refund.created`, `refund.updated`, and `refund.failed`. The local `npm run stripe:listen` helper includes those events. Refund events retrieve current provider state so out-of-order deliveries cannot restore an outdated refund status.

No actual payment, refund, subscription cancellation, or outbound email is performed by the test suite or staff smoke script.

## Contacts and messaging

The support form accepts Support, Enterprise, or Refund topics. Enterprise pricing links select the Enterprise topic automatically. Incoming contacts appear in their respective staff inbox, with contact identity, category, status, and conversation history. Staff can mark requests open, pending, or resolved.

Signed-in requests use the authenticated account ID and email, regardless of submitted identity fields. Guest submissions are not automatically attached to an account merely because the email matches. Normal users use a floating Support chat at the bottom-right of their dashboard, Home, Features, How it works, Use Cases, Pricing, and Docs. It is hidden on other pages and for staff accounts. The dashboard's Messages button opens that popup; bookmarked `/messages` links redirect to the dashboard and open it. Guests can open the launcher on the public pages and sign in to chat.

The widget supports ticket creation, support/refund/Enterprise topics, conversation history, threaded replies, unread indicators, and account messages. It preserves open state and drafts while navigating between the allowed pages. Open user conversations and staff conversation dialogs poll every five seconds; closed user inboxes poll every thirty seconds and staff ticket lists every fifteen seconds while the page is visible. Polling preserves draft replies and existing content. This is a human support interface; it does not invent bot responses, typing indicators, or staff online status. Request ownership remains checked server-side.

## Generation and reports

Admins and managers can generate tests from user stories, PDF/DOCX/TXT/Markdown documents, or publicly accessible HTML/text pages. Staff have unlimited runs without Casefy credit deductions, with up to 100 cases per request and one in-flight request per staff account in the API process. Provider charges, availability, and rate limits still apply.

Documents are limited to five files and 10 MB total. Scanned PDFs without extractable text need OCR before upload. Public URLs are fetched with pinned public IPv4 DNS resolution, redirect validation, timeouts, and response-size limits. Private network addresses are rejected. The fetcher reads page text and does not execute JavaScript or browser tests.

Results are validated, stored, viewable in Reports, and exportable as JSON. Reports show actual generation status and counts; no execution results or pass rates are invented. Ordinary customer generation keeps the existing preview behavior.

## Validation

From `backend`, run `npm test`, `npm run prisma:validate`, and `npm run staff:smoke`. The smoke script exercises the real database using a transaction that rolls back all fixtures, mocks provider generation, and checks PDF text extraction. From `frontend`, run `npm run build` and lint changed files.

Provider implementation references: [Stripe refunds](https://docs.stripe.com/api/refunds/create), [Stripe subscription updates](https://docs.stripe.com/api/subscriptions/update), [OpenAI Responses](https://developers.openai.com/api/reference/resources/responses/methods/create), [DeepSeek chat completions](https://api-docs.deepseek.com/api/create-chat-completion/), [Gemini content generation](https://ai.google.dev/api/generate-content), and [Resend email](https://resend.com/docs/api-reference/emails/send-email).
