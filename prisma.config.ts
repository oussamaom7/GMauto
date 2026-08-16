import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection — Supabase's
    // transaction-mode pooler (used by DATABASE_URL at runtime) doesn't
    // support the session-level locks Prisma Migrate relies on.
    //
    // Read directly from process.env (not the `env()` helper) so this
    // resolves to `undefined` instead of throwing when unset — `prisma
    // generate` (run via postinstall on every deploy) doesn't touch the
    // datasource at all and shouldn't hard-fail over a missing connection
    // string; only `migrate`/`db push`/`studio` actually need it resolved.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
