CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "workspace_key" VARCHAR(32) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "projects_owner_id_workspace_key_idx" ON "projects"("owner_id", "workspace_key");
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
