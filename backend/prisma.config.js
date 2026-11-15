import "./config.js";
import { defineConfig } from "prisma/config";

// Session advisory locks must not be held on Neon's transaction pooler.
let migrationDatabaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
if (migrationDatabaseUrl) {
  const url = new URL(migrationDatabaseUrl);
  if (url.hostname.endsWith(".neon.tech")) url.hostname = url.hostname.replace("-pooler.", ".");
  migrationDatabaseUrl = url.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: migrationDatabaseUrl },
});
