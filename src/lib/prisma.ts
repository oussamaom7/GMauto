import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    // Several transactions (invoice create/edit, order-to-invoice conversion)
    // loop over line items doing a couple of sequential round-trips each for
    // stock reconciliation — over a remote Supabase connection this can push
    // past Prisma's 5s interactive-transaction default, so give real work
    // more room than the default.
    transactionOptions: { timeout: 20000 },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
