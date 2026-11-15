# PayPal checkout

The gold, rectangular, horizontal PayPal Subscribe button appears beneath Stripe on new Plus and Pro checkouts. It loads the official PayPal JavaScript SDK with `vault=true` and `intent=subscription`, using the public client ID supplied in the request. Free/current/included plans and existing-subscription upgrade flows retain their existing controls.

The supplied reference plan is `P-79U58668YW295372JNL4QHKA`. A PayPal plan specifies one recurring price and interval. It must not be assigned to all four checkout choices unless each choice actually matches that plan's terms. The server verifies the plan's price, USD currency, billing frequency, and absence of an extra setup fee before creating a subscription. Mismatched plans cannot charge through this integration.

## Required setup

Set these values in the server environment (`backend/.env` locally). Keep the client secret out of browser configuration and source control:

```dotenv
PAYPAL_ENV=live
PAYPAL_CLIENT_ID=your_matching_public_client_id
PAYPAL_CLIENT_SECRET=your_private_server_secret
PAYPAL_WEBHOOK_ID=your_verified_webhook_id
PAYPAL_PLAN_PLUS_MONTHLY=matching_paypal_plan_id
PAYPAL_PLAN_PLUS_ANNUAL=matching_paypal_plan_id
PAYPAL_PLAN_PRO_MONTHLY=matching_paypal_plan_id
PAYPAL_PLAN_PRO_ANNUAL=matching_paypal_plan_id
```

The supplied public client ID is the live default. Use a matching sandbox client ID, secret, plans, and webhook with `PAYPAL_ENV=sandbox` for testing. The existing Stripe sandbox setting does not switch PayPal's environment.

Expected terms match the existing Casefy catalog: Plus USD 24/month or USD 230.40/year; Pro USD 79/month or USD 758.40/year. Use only the matching environment's plan IDs. The SDK button remains unavailable until its selected plan mapping, server secret, and webhook ID are configured. The administrator's API integrations panel shows mapping readiness.

Configure the PayPal webhook URL as the public API origin plus `/api/billing/paypal/webhook`. Subscribe to `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.UPDATED`, `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.SUSPENDED`, `BILLING.SUBSCRIPTION.EXPIRED`, `BILLING.SUBSCRIPTION.PAYMENT.FAILED`, and `PAYMENT.SALE.COMPLETED`. Localhost needs an existing public development tunnel before PayPal can deliver webhooks.

## Behavior

The server creates an account-owned checkout reference and uses it as PayPal's request idempotency key and `custom_id`. The browser receives a subscription ID for the SDK approval flow. Approval callbacks do not grant access by themselves: the server verifies ownership, the PayPal plan, provider status, and a matching recorded payment. A missing payment returns a pending state. Signed webhooks fetch current provider state for subsequent synchronization.

Verified PayPal access is kept separate from Stripe and complimentary grants. It expires at the verified paid-through date, and failed renewals cannot extend access merely by moving the next billing date. Canceling renewals through Profile retains only already verified paid access. Pending approvals can be resumed from Profile. Account deletion and a second Stripe checkout are blocked while a PayPal subscription remains nonterminal. Existing Stripe subscriptions must be managed through their Stripe flow instead of starting parallel PayPal billing.

PayPal customer payment, refund, and price administration remains in the merchant's PayPal account; the existing staff Payments/Refunds tables continue to manage Stripe transactions. This change does not create PayPal plans, alter merchant pricing, or perform any actual subscription signup or charge during tests.

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/billing/paypal/config?plan=plus&billing=monthly` | Public SDK configuration and availability; never exposes the secret |
| `POST /api/billing/paypal/subscriptions` | Create or resume the authenticated account's subscription approval |
| `POST /api/billing/paypal/verify` | Verify the account-owned approved subscription and payment |
| `POST /api/billing/paypal/cancel` | Cancel the authenticated account's PayPal renewal |
| `POST /api/billing/paypal/webhook` | Verify provider signatures and synchronize current subscription state |

References: [PayPal JavaScript SDK configuration](https://developer.paypal.com/sdk/js/configuration/), [subscription integration and server verification](https://developer.paypal.com/docs/subscriptions/integrate/), [Subscriptions API](https://developer.paypal.com/docs/api/subscriptions/v1/).
