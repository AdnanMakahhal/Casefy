ALTER TABLE "users"
ADD COLUMN "stripe_customer_id" TEXT,
ADD COLUMN "stripe_subscription_id" TEXT,
ADD COLUMN "stripe_checkout_session_id" TEXT,
ADD COLUMN "subscription_status" TEXT,
ADD COLUMN "subscription_period_end" TIMESTAMPTZ(6),
ADD COLUMN "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");
CREATE UNIQUE INDEX "users_stripe_subscription_id_key" ON "users"("stripe_subscription_id");

CREATE TABLE "stripe_webhook_events" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "processed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);
