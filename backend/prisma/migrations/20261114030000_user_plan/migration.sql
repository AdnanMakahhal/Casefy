CREATE TYPE "Plan" AS ENUM ('free', 'plus', 'pro', 'enterprise');
ALTER TABLE "users" ADD COLUMN "plan" "Plan" NOT NULL DEFAULT 'free';
