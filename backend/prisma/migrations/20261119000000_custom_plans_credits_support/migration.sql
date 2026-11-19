-- Preserve existing subscriptions while renaming the plan.
ALTER TYPE "Plan" RENAME VALUE 'enterprise' TO 'custom';
UPDATE "support_requests" SET "category" = 'custom' WHERE "category" = 'enterprise';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_support_agent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_synthetic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "support_requests" ADD COLUMN     "assigned_to_id" INTEGER,
ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "generation_runs" ADD COLUMN     "credits_used" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "credit_entries" (
    "id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "description" VARCHAR(250) NOT NULL,
    "operation_key" VARCHAR(160) NOT NULL,
    "generation_run_id" INTEGER,
    "period_start" TIMESTAMPTZ(6) NOT NULL,
    "period_end" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_records" (
    "id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "external_id" TEXT,
    "amount" INTEGER NOT NULL,
    "amount_refunded" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
    "status" VARCHAR(30) NOT NULL,
    "source" VARCHAR(20) NOT NULL DEFAULT 'stripe',
    "plan" "Plan" NOT NULL,
    "description" VARCHAR(250) NOT NULL,
    "receipt_url" TEXT,
    "live_mode" BOOLEAN NOT NULL DEFAULT false,
    "disputed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_deals" (
    "id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "support_request_id" INTEGER NOT NULL,
    "approved_by_id" INTEGER NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'offered',
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
    "interval" VARCHAR(10) NOT NULL DEFAULT 'month',
    "seats" INTEGER NOT NULL,
    "projects" INTEGER NOT NULL,
    "monthly_credits" INTEGER NOT NULL,
    "notes" VARCHAR(2000) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),
    "activated_at" TIMESTAMPTZ(6),
    "stripe_checkout_session_id" TEXT,
    "stripe_subscription_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_deals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_entries_operation_key_key" ON "credit_entries"("operation_key");

-- CreateIndex
CREATE INDEX "credit_entries_user_id_period_start_created_at_idx" ON "credit_entries"("user_id", "period_start", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_records_external_id_key" ON "payment_records"("external_id");

-- CreateIndex
CREATE INDEX "payment_records_user_id_created_at_idx" ON "payment_records"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "payment_records_created_at_idx" ON "payment_records"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "custom_deals_stripe_checkout_session_id_key" ON "custom_deals"("stripe_checkout_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_deals_stripe_subscription_id_key" ON "custom_deals"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "custom_deals_user_id_status_idx" ON "custom_deals"("user_id", "status");

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_entries" ADD CONSTRAINT "credit_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_entries" ADD CONSTRAINT "credit_entries_generation_run_id_fkey" FOREIGN KEY ("generation_run_id") REFERENCES "generation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_deals" ADD CONSTRAINT "custom_deals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_deals" ADD CONSTRAINT "custom_deals_support_request_id_fkey" FOREIGN KEY ("support_request_id") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_deals" ADD CONSTRAINT "custom_deals_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "credit_entries" ADD CONSTRAINT "credit_entry_nonzero" CHECK ("amount" <> 0);
ALTER TABLE "credit_entries" ADD CONSTRAINT "credit_entry_period" CHECK ("period_end" > "period_start");
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_amounts_valid" CHECK ("amount" >= 0 AND "amount_refunded" >= 0 AND "amount_refunded" <= "amount");
ALTER TABLE "custom_deals" ADD CONSTRAINT "custom_deal_terms_valid" CHECK ("amount" > 0 AND "seats" > 0 AND "projects" > 0 AND "monthly_credits" > 0 AND "interval" IN ('month', 'year'));
