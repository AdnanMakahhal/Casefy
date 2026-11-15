DROP TABLE IF EXISTS "paypal_checkouts";

ALTER TABLE "users"
  DROP COLUMN IF EXISTS "paypal_subscription_id",
  DROP COLUMN IF EXISTS "paypal_plan",
  DROP COLUMN IF EXISTS "paypal_billing",
  DROP COLUMN IF EXISTS "paypal_status",
  DROP COLUMN IF EXISTS "paypal_started_at",
  DROP COLUMN IF EXISTS "paypal_period_end";
