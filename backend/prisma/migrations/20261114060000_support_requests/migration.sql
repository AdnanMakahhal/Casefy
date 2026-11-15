CREATE TABLE "support_requests" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "subject" VARCHAR(160) NOT NULL,
  "description" VARCHAR(5000) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);
