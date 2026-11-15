ALTER TABLE "users" ADD COLUMN "blocked_at" TIMESTAMPTZ(6), ADD COLUMN "blocked_reason" VARCHAR(500);
ALTER TABLE "support_requests" ADD COLUMN "category" VARCHAR(20) NOT NULL DEFAULT 'support', ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'open', ADD COLUMN "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL;
UPDATE "support_requests" SET "category" = 'enterprise' WHERE "subject" ILIKE '%enterprise%';
CREATE INDEX "support_requests_category_status_created_at_idx" ON "support_requests"("category", "status", "created_at");
CREATE TABLE "user_messages" (
  "id" SERIAL PRIMARY KEY, "recipient_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "sender_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "support_request_id" INTEGER REFERENCES "support_requests"("id") ON DELETE SET NULL,
  "to_email" VARCHAR(254) NOT NULL, "subject" VARCHAR(160) NOT NULL, "body" VARCHAR(10000) NOT NULL,
  "channel" VARCHAR(20) NOT NULL DEFAULT 'in_app', "delivery_status" VARCHAR(20) NOT NULL DEFAULT 'sent',
  "provider_message_id" TEXT, "read_at" TIMESTAMPTZ(6), "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "user_messages_recipient_id_created_at_idx" ON "user_messages"("recipient_id", "created_at");
CREATE INDEX "user_messages_support_request_id_created_at_idx" ON "user_messages"("support_request_id", "created_at");
CREATE TABLE "integration_settings" ("provider" VARCHAR(30) PRIMARY KEY, "secret_ciphertext" TEXT, "model" VARCHAR(100), "sender_email" VARCHAR(254), "enabled" BOOLEAN NOT NULL DEFAULT true, "updated_at" TIMESTAMPTZ(6) NOT NULL);
CREATE TABLE "generation_runs" (
  "id" SERIAL PRIMARY KEY, "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "subject" VARCHAR(160) NOT NULL, "source" VARCHAR(20) NOT NULL, "provider" VARCHAR(30) NOT NULL,
  "model" VARCHAR(100) NOT NULL, "requested_count" INTEGER NOT NULL, "test_count" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(20) NOT NULL DEFAULT 'running', "result" JSONB, "error" VARCHAR(500), "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "generation_runs_user_id_created_at_idx" ON "generation_runs"("user_id", "created_at");
CREATE TABLE "refund_records" (
  "id" VARCHAR(36) PRIMARY KEY, "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "actor_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL, "charge_id" TEXT NOT NULL,
  "amount" INTEGER NOT NULL CHECK ("amount" > 0), "currency" VARCHAR(3) NOT NULL, "reason" VARCHAR(500) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending', "stripe_refund_id" TEXT UNIQUE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "refund_records_user_id_created_at_idx" ON "refund_records"("user_id", "created_at");
CREATE UNIQUE INDEX "refund_records_one_pending_charge" ON "refund_records"("charge_id") WHERE "status" = 'pending';
