import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
export const dynamic = "force-dynamic";

// POST /api/topik/attempt — сохранить попытку (если залогинен — в БД, иначе просто считает)
export async function POST(req: Request) {
  let body: { testId?: string; answers?: Record<string, string>; score?: number; total?: number } = {};
  try { body = await req.json(); } catch {}
  const testId = String(body.testId ?? "").trim();
  const answers = body.answers ?? {};
  const score = Number(body.score ?? 0);
  const total = Number(body.total ?? 0);
  if (!testId) return Response.json({ error: "testId kerak" }, { status: 400 });

  const token = readAuthToken(req);
  const data = token ? verify(token) : null;
  const userId = data ? String((data as Record<string, unknown>).id ?? "") : "";

  // Если userId есть и testId — реальный из БД — пишем в БД
  if (userId && !testId.startsWith("seed_")) {
    try {
      await prisma.testAttempt.create({ data: { userId, testId, score, total, answers } });
    } catch (e) {
      console.error("attempt save", e);
    }
  }
  return Response.json({ ok: true, score, total });
}

// GET /api/topik/attempt?userId= — последние попытки (требует auth)
export async function GET(req: Request) {
  const token = readAuthToken(req);
  const data = token ? verify(token) : null;
  if (!data) return Response.json({ error: "Auth kerak" }, { status: 401 });
  const userId = String((data as Record<string, unknown>).id ?? "");
  if (!userId) return Response.json({ attempts: [] });
  try {
    const atts = await prisma.testAttempt.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20, include: { test: { select: { title: true, level: true } } } });
    return Response.json({ attempts: atts });
  } catch (e) {
    console.error("GET attempts", e);
    return Response.json({ attempts: [] });
  }
}
