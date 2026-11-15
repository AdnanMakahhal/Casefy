ALTER TABLE "users"
  ADD COLUMN "seat_limit" INTEGER,
  ADD COLUMN "project_limit" INTEGER,
  ADD COLUMN "monthly_credit_limit" INTEGER,
  ADD CONSTRAINT "users_seat_limit_positive" CHECK ("seat_limit" > 0),
  ADD CONSTRAINT "users_project_limit_positive" CHECK ("project_limit" > 0),
  ADD CONSTRAINT "users_monthly_credit_limit_positive" CHECK ("monthly_credit_limit" > 0);
