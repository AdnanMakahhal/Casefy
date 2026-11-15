ALTER TABLE "users"
  ADD COLUMN "subscription_started_at" TIMESTAMPTZ(6),
  ADD COLUMN "complimentary_plan" "Plan",
  ADD COLUMN "complimentary_starts_at" TIMESTAMPTZ(6),
  ADD COLUMN "complimentary_ends_at" TIMESTAMPTZ(6),
  ADD CONSTRAINT "users_complimentary_schedule_valid" CHECK (
    ("complimentary_plan" IS NULL AND "complimentary_starts_at" IS NULL AND "complimentary_ends_at" IS NULL)
    OR ("complimentary_plan" IN ('plus', 'pro', 'enterprise') AND "complimentary_starts_at" IS NOT NULL AND "complimentary_ends_at" IS NOT NULL AND "complimentary_ends_at" > "complimentary_starts_at")
  );
