ALTER TABLE "users" DROP CONSTRAINT "users_complimentary_schedule_valid";
ALTER TABLE "users" ADD CONSTRAINT "users_complimentary_schedule_valid" CHECK (
  ("complimentary_plan" IS NULL AND "complimentary_starts_at" IS NULL AND "complimentary_ends_at" IS NULL)
  OR ("complimentary_plan" IS NOT NULL AND "complimentary_plan" IN ('plus', 'pro', 'enterprise') AND "complimentary_starts_at" IS NOT NULL AND "complimentary_ends_at" IS NOT NULL AND "complimentary_ends_at" > "complimentary_starts_at")
);
