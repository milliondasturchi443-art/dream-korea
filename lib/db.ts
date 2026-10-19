import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// MongoDB ulanishda 5 soniyada otish — sahifalar 30s turmasin
function fastUrl(raw?: string): string | undefined {
  if (!raw) return raw;
  if (/serverSelectionTimeoutMS=/i.test(raw)) return raw;
  return raw + (raw.includes("?") ? "&" : "?") + "serverSelectionTimeoutMS=5000";
}

// Vaqtinchalik uzilishlar (tarmoq yoki Atlas bir necha soniyada tiklanadi)
const TRANSIENT_CODES = new Set(["P1001", "P1002", "P1008", "P1017"]);
const TRANSIENT_RE =
  /ECONNRESET|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|EPIPE|socket hang up|server selection|No available servers|ReplicaSetNoPrimary|I\/O error|timed out|Connection closed|Connection is scheduled|Network error|TLS handshake|query engine/i;

function isTransient(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as { code?: string; message?: string };
  if (err.code && TRANSIENT_CODES.has(err.code)) return true;
  return TRANSIENT_RE.test(err.message ?? "");
}

// "Aloqa umuman o'rnatilmadi" — yozuv serverga yetmagan, takrorlash xavfsiz.
const UNREACHABLE_RE =
  /server selection|No available servers|ReplicaSetNoPrimary|Can't reach database|Database server not reachable|not reachable/i;

function isSafeToRetryWrite(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as { code?: string; message?: string };
  if (err.code && TRANSIENT_CODES.has(err.code)) return true;
  return UNREACHABLE_RE.test(err.message ?? "");
}

const READ_OPS = new Set([
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function withRetry<T>(
  fn: () => Promise<T>,
  shouldRetry: (e: unknown) => boolean,
): Promise<T> {
  const MAX = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (!shouldRetry(e) || attempt === MAX) throw e;
      await sleep(150 * attempt);
    }
  }
  throw lastErr;
}

function createClient(): PrismaClient {
  const url = fastUrl(process.env.DATABASE_URL);
  const base = url
    ? new PrismaClient({ datasourceUrl: url })
    : new PrismaClient();

  const client = base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query, operation }) {
          return withRetry(() => query(args), (e) => {
            if (READ_OPS.has(operation)) return isTransient(e);
            return isSafeToRetryWrite(e);
          });
        },
      },
    },
  });

  // Uzatilgan client tashqi API bir xil — 45 ta fayl TypeScriptsiz ishlayveradi
  return client as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
