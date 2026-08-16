import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection — Supabase's
    // transaction-mode pooler (used by DATABASE_URL at runtime) doesn't
    // support the session-level locks Prisma Migrate relies on.
    url: env("DIRECT_URL"),
  },
});
