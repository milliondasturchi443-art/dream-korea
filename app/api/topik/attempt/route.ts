import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
export const dynamic = "force-dynamic";

const SEED_CORRECT: Record<string, Record<string, string>> = {
  seed_topik1_reading: { "1": "C", "2": "B", "3": "B" },
  seed_topik1_listening: { "1": "A", "2": "B" },
};

// Full-mock = reading + listening, ids 1..N подряд (как в GET /api/topik/[id])
function seedMapFor(testId: string): Record<string, string> | null {
  if (testId === "seed_topik1_full") {
    const full: Record<string, string> = {};
    let i = 1;
    for (const c of Object.values(SEED_CORRECT.seed_topik1_reading)) full[String(i++)] = c;
    for (const c of Object.values(SEED_CORRECT.seed_topik1_listening)) full[String(i++)] = c;
    return full;
  }
  return SEED_CORRECT[testId] ?? null;
}

// POST — сервер сам считает баллы из БД (seed — из констант). Клиентский score игнорируется.
export async function POST(req: Request) {
  let body: { testId?: string; answers?: Record<string, string> } = {};
  try { body = await req.json(); } catch {}
  const testId = String(body.testId ?? "").trim();
  const rawAns = body.answers ?? {};
  if (!testId) return Response.json({ error: "testId kerak" }, { status: 400 });
  const answers: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawAns)) {
    if (typeof k === "string" && typeof v === "string" && k.length <= 64 && v.length <= 8) answers[k] = v.trim().toUpperCase();
  }
  const token = readAuthToken(req);
  const data = token ? verify(token) : null;
  const userId = data ? String((data as Record<string, unknown>).id ?? "") : "";

  let score = 0;
  let total = 0;
  try {
    if (testId.startsWith("seed_")) {
      const map = seedMapFor(testId);
      if (!map) return Response.json({ error: "Test topilmadi" }, { status: 404 });
      total = Object.keys(map).length;
      score = Object.entries(answers).filter(([k, v]) => map[k] === v).length;
    } else {
      const qs = await prisma.question.findMany({ where: { testId }, select: { id: true, correct: true } });
      if (qs.length === 0) return Response.json({ error: "Test topilmadi yoki savollari yo'q" }, { status: 404 });
      const byId = Object.fromEntries(qs.map(q => [q.id, String(q.correct).trim().toUpperCase()]));
      total = qs.length;
      for (const [qid, ans] of Object.entries(answers)) {
        if (byId[qid] && ans === byId[qid]) score++;
      }
    }
  } catch (e) {
    console.error("attempt scoring", e);
    return Response.json({ error: "Saqlab bo'lmadi" }, { status: 500 });
  }
  if (userId && !testId.startsWith("seed_")) {
    try {
      await prisma.testAttempt.create({ data: { userId, testId, score, total, answers } });
    } catch (e) {
      console.error("attempt save", e);
    }
  }
  const pct = total ? Math.round((score / total) * 100) : 0;
  return Response.json({ ok: true, score, total, pct, isSeed: testId.startsWith("seed_") });
}

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
