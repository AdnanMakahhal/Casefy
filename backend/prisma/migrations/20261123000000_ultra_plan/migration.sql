BEGIN;

-- Keep the existing storage value. Prisma maps the app's Ultra plan to 'custom'.
-- This optional data cleanup is not required to read existing accounts.

UPDATE "users"
SET "seat_limit" = NULL, "project_limit" = NULL, "monthly_credit_limit" = NULL
WHERE "plan" = 'custom';

-- Keep the conversation history in the general support inbox.
UPDATE "support_requests" SET "category" = 'support'
WHERE "category" IN ('custom', 'enterprise');

-- Retain historic agreements for billing reconciliation; retire unpaid offers.
UPDATE "custom_deals" SET "status" = 'retired'
WHERE "status" IN ('offered', 'accepted');

COMMIT;
