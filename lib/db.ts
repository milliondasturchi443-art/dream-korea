import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// MongoDB ulanishda 5 soniyada otish — sahifalar 30s turmasin
function fastUrl(raw?: string): string | undefined {
  if (!raw) return raw;
  if (/serverSelectionTimeoutMS=/i.test(raw)) return raw;
  return raw + (raw.includes("?") ? "&" : "?") + "serverSelectionTimeoutMS=5000";
}

function createClient(): PrismaClient {
  const url = fastUrl(process.env.DATABASE_URL);
  return url ? new PrismaClient({ datasourceUrl: url }) : new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
