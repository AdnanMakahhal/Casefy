# Deploy Casefy on Vercel

Import `AdnanMakahhal/Casefy`, select `main`, and keep the **Root Directory at the repository root** (not `frontend`). The root `vercel.json` installs both npm workspaces, generates Prisma, builds the frontend, serves the API as a Node function and handles React routes, including invitation links. Use Node **24.x** in Project Settings. Vercel assigns a free `*.vercel.app` domain; no purchased domain is required.

## Environment settings

Add secrets in **Project Settings → Environment Variables**, then redeploy. They are deliberately excluded from Git. Start with a Preview using test payment credentials and an isolated Neon database branch.

To prepare an import from the existing local settings, run `npm run deployment:env`. It writes a private, Git-ignored `.env.vercel` file in the repository root, without printing values. Import it into Vercel's environment settings. It deliberately excludes local domain overrides and the local Stripe CLI webhook secret. Add the deployed endpoint's signing secret and missing PayPal settings separately. Treat the exported file as credentials; never share or commit it.

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string, with SSL enabled |
| `DIRECT_URL` | Optional unpooled connection string for migrations; the CLI derives it from Neon pooler URLs if omitted |
| `JWT_SECRET` | Strong server secret; copy the existing value if keeping existing sessions and encrypted integrations |
| `INTEGRATION_ENCRYPTION_KEY` | Preserve the existing value if set; if unset the app uses `JWT_SECRET` |
| `STRIPE_SECRET_KEY` | Matching test or live Stripe server key |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the deployed Stripe webhook endpoint; a local CLI listener secret does not work for this endpoint |
| `STRIPE_PRICE_PLUS_MONTHLY`, `STRIPE_PRICE_PLUS_ANNUAL` | Recurring USD prices: $24/month, $230.40/year |
| `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL` | Recurring USD prices: $79/month, $758.40/year |
| `STRIPE_PORTAL_CONFIGURATION_ID` | Active portal configuration in the same Stripe account/mode; enable cancellation and the supported upgrade prices |
| `PAYPAL_ENV` | `sandbox` or `live` |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Credentials from the same PayPal REST app and environment |
| `PAYPAL_WEBHOOK_ID` | ID of the deployed webhook registered on that PayPal app |
| `PAYPAL_PLAN_PLUS_MONTHLY`, `PAYPAL_PLAN_PLUS_ANNUAL` | Separate active PayPal plan IDs for $24/month and $230.40/year |
| `PAYPAL_PLAN_PRO_MONTHLY`, `PAYPAL_PLAN_PRO_ANNUAL` | Separate active PayPal plan IDs for $79/month and $758.40/year |

**Omit `FRONTEND_URL` and `VITE_API_URL` on Vercel.** The browser uses `/api` on the same domain. Stripe and PayPal use `VERCEL_PROJECT_PRODUCTION_URL`, falling back to `VERCEL_URL`, for trusted return URLs. Never copy the local `http://localhost:5173`/`8000` overrides into Vercel. If you later use a custom domain, set `FRONTEND_URL=https://your-domain` and update provider webhook endpoints. For isolated Preview billing tests, explicitly use the preview's HTTPS domain and its own test webhook.

The public client ID in the originally supplied PayPal button is retained as a fallback. Its secret was not supplied; the app does not treat the public ID alone as sufficient server configuration. One PayPal plan cannot cover all four differently priced/dated subscriptions. A missing or mismatched mapping keeps that option unavailable.

## Neon schema

Use the same Neon database if you want existing accounts and workspaces. Its 14 existing migrations have already been applied during development. For a new database or branch, set the target database environment securely and run `npm run db:migrate` before accepting traffic. Migrations are intentionally a release step, not an API request or an automatic preview-build side effect. The API reuses a Prisma client with a small pool; migrations use the unpooled Neon host.

## Provider webhooks

Once Vercel assigns the production domain, register these exact HTTPS endpoints:

- Stripe: `https://YOUR-PROJECT.vercel.app/api/billing/webhook`
- PayPal: `https://YOUR-PROJECT.vercel.app/api/billing/paypal/webhook`

Stripe events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`, `refund.created`, `refund.updated`, `refund.failed`.

PayPal events: `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.UPDATED`, `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.SUSPENDED`, `BILLING.SUBSCRIPTION.EXPIRED`, `BILLING.SUBSCRIPTION.PAYMENT.FAILED`, `PAYMENT.SALE.COMPLETED`.

Save the Stripe endpoint signing secret and PayPal webhook ID in Vercel, then redeploy. Provider deliveries must reach the public endpoint; Vercel Deployment Protection must not put a login gate in front of webhooks. Use the stable production domain for provider endpoints. Keep all keys, prices, plans and webhook configurations in the same test/live environment. Publish your Terms URL in Stripe's public business settings before live Checkout; the app always requires consent in live mode.

## Verify

Run `npm test` and `npm run build`. Run `npm run deployment:check` with the deployment environment loaded to perform read-only Neon, migration, Stripe price/portal and PayPal mapping checks. It prints no secrets and creates no subscriptions, payments or refunds. A nonzero result means configuration remains incomplete.

After deployment, check `/health`, sign-in, `/api/billing/plans`, a direct `/workspaces/:id` link, and a signed-in invitation acceptance. Complete test payments and signed webhook deliveries with sandbox accounts before switching to live credentials. No live payment has been performed by the automated checks.

Production staff document uploads are capped at 2 MB total, leaving room for base64 encoding inside Vercel's function request limit. Local staff generation keeps its 10 MB total limit. Larger hosted imports would require direct object-storage uploads.

References: [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [Vercel routing](https://vercel.com/docs/routing/rewrites), [Stripe subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks), [PayPal subscription webhooks](https://developer.paypal.com/docs/subscriptions/reference/webhooks/).
