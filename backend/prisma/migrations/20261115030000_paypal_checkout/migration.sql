ALTER TABLE "users" ADD COLUMN "paypal_subscription_id" TEXT UNIQUE, ADD COLUMN "paypal_plan" "Plan", ADD COLUMN "paypal_status" VARCHAR(30), ADD COLUMN "paypal_started_at" TIMESTAMPTZ(6), ADD COLUMN "paypal_period_end" TIMESTAMPTZ(6);
CREATE TABLE "paypal_checkouts" (
  "id" VARCHAR(36) PRIMARY KEY, "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "plan" "Plan" NOT NULL, "billing" VARCHAR(10) NOT NULL, "paypal_plan_id" TEXT NOT NULL,
  "subscription_id" TEXT UNIQUE, "status" VARCHAR(30) NOT NULL DEFAULT 'CREATED',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "paypal_checkouts_user_id_created_at_idx" ON "paypal_checkouts"("user_id", "created_at");
