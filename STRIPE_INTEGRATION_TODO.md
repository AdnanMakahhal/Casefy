# Stripe Checkout integration follow-up

## Scenario and scope

Scenario A applies. One Checkout Session creation call exists in [backend/controllers/billingController.js](backend/controllers/billingController.js). Checkout Studio settings are retained alongside the customer, account reference, and metadata fields that the user subsequently authorized preserving so billing works. Session reuse checks account ownership and tolerates older sessions with no metadata. The existing [success page](frontend/src/pages/CheckoutSuccess.jsx) displays the thank-you message after server-confirmed payment. Existing routes, authentication, webhook handling, SDK initialization, database logic, and request idempotency options are preserved.

## Values to Replace

None of the four `sample_only` fields is missing or uses a sample placeholder. No replacement values were introduced.

| Field | Preserved value | Remaining action |
| --- | --- | --- |
| `mode` | `subscription` | None; Casefy sells recurring subscriptions. |
| `line_items` | `[{ price, quantity: 1 }]` | None for the configured sandbox; `price` comes from the existing server-side plan allowlist. |
| `success_url` | `${config.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}` | Keep the Checkout Session template; the existing success route is real. |
| `cancel_url` | `${config.origin}/checkout?plan=${plan}&billing=${billing}&canceled=1` | None for local testing; the existing checkout route is real. |

The `{CHECKOUT_SESSION_ID}` token is Stripe's substitution template, not an unfinished placeholder. Production deployment still needs its own real origin, API keys, recurring Price IDs, and webhook signing secret in the existing backend environment configuration.

## Configured Parameters

**File containing the Checkout Studio parameters:** [backend/controllers/billingController.js](backend/controllers/billingController.js).

| Parameter | Configured value |
| --- | --- |
| `ui_mode` | `hosted_page` |
| `billing_address_collection` | `auto` |
| `phone_number_collection` | `{ enabled: true }` |
| `automatic_tax` | `{ enabled: false }` |
| `allow_promotion_codes` | `false` |
| `payment_method_collection` | `always` |
| `submit_type` | `auto` |
| `consent_collection` | `{ terms_of_service: "required" }` |
| `name_collection` | `{ individual: { enabled: true } }` |
| `integration_identifier` | `hosted_mobile_app_0001` |
| `origin_context` | `mobile_app` |

The installed Stripe Node SDK is 23.1.0, so `hosted_page` is used as requested. The SDK's default API version remains in use; no API version argument was added. Tax collection remains disabled.

## Account binding

The user authorized preserving the fields required by the existing billing flow:

- `customer`: the authenticated account's stored Stripe customer.
- `client_reference_id`: the authenticated user ID checked by the success handler.
- `metadata`: the user ID, selected plan, and billing interval used for account-linked session reuse.
- `subscription_data`: flexible billing mode and subscription user metadata.

These fields let webhook reconciliation, the success handler, duplicate-subscription prevention, the billing portal, and cancellation on account deletion locate the correct account and subscription. Older unbound sessions are not reused. The secret key remains loaded from the backend environment; sample URLs, Price IDs, and the sample support email were not copied into application code.

## Setup and next steps

1. Account-binding fields are restored with the user's authorization. Use the existing authenticated checkout flow.
2. **Current blocker verified against Stripe:** set Casefy's real public Terms of Service URL in [Stripe's public business settings](https://dashboard.stripe.com/settings/business-details?edit=public). Stripe rejected the configured session because required terms consent is enabled but the account has no Terms URL. The user has been asked for this URL. No legal URL was invented, and required consent was not disabled.
3. Keep secret keys and webhook secrets in the ignored backend environment file or a production secret manager. Existing variable names remain unchanged: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PLUS_MONTHLY`, `STRIPE_PRICE_PRO_MONTHLY`, and `FRONTEND_URL`. No browser environment variables were added; hosted Checkout does not require a publishable key in this frontend.
4. Existing dependencies and infrastructure are already installed. For local testing, run `npm run dev` and `npm run stripe:listen` in separate terminals from `backend`, and run the Vite frontend separately. Monthly and annual billing are enabled for Plus and Pro. Annual Prices include the approved recurring 20% discount: Plus USD 230.40/year and Pro USD 758.40/year. IDs are stored as `STRIPE_PRICE_PLUS_ANNUAL` and `STRIPE_PRICE_PRO_ANNUAL` in the backend environment. The existing Terms of Service URL blocker still needs to be resolved before Checkout sessions can be created.
5. After resolving compatibility, test with Stripe sandbox keys and card `4242 4242 4242 4242`, a future expiry, and any three-digit CVC. Do not use real payment details for sandbox tests.
6. Recheck account ownership, customer mapping, session reuse, webhook-driven provisioning, portal access, and cancellation before relying on fulfillment. Product, fulfillment, and order-tracking infrastructure was not added or refactored in this task.

## Validation

- JavaScript syntax and exact configured-parameter checks passed.
- All four existing `sample_only` expressions were preserved.
- Account-binding parameters are also included with the user's authorization.
- All 60 backend tests passed, including the previously failing customer-binding and session-reuse tests. Frontend lint and production build passed.
- Direct sandbox validation reached Stripe and was rejected for the missing Terms of Service URL described above. No payment was made. The temporary customer was deleted; no Checkout session was created.

## Project structure

No new server files or routes were created. The existing billing controller and success page were updated, along with this document.

Resources: [Stripe Support](https://support.stripe.com), [Stripe MCP](https://docs.stripe.com/mcp).
