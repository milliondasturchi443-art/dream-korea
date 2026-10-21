import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { TOPIC_SEED_MAP, buildSeedFull } from "@/lib/topik-seed";
export const dynamic = "force-dynamic";

function seedMapFor(testId: string): Record<string, string> | null {
  const test = testId === "seed_topik1_full"
    ? buildSeedFull("seed_topik1_full")
    : TOPIC_SEED_MAP[testId];
  if (!test) return null;
  const map: Record<string, string> = {};
  test.questions.forEach((q, i) => { map[String(i + 1)] = q.correct; });
  return map;
}

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
  let score = 0, total = 0;
  // Topshirilgandan keyingi tahlil (to'g'ri javoblar faqat shu yerda qaytadi)
  let review: { id: string; text: string; correct: string; explanation?: string }[] = [];
  try {
    if (testId.startsWith("seed_")) {
      const map = seedMapFor(testId);
      if (!map) return Response.json({ error: "Test topilmadi" }, { status: 404 });
      total = Object.keys(map).length;
      score = Object.entries(answers).filter(([k, v]) => map[k] === v).length;
      const full = testId === "seed_topik1_full" ? buildSeedFull(testId) : TOPIC_SEED_MAP[testId];
      review = (full?.questions ?? []).map((q, i) => ({ id: String(i + 1), text: q.text, correct: q.correct, explanation: (q as { explanation?: string }).explanation }));
    } else {
      const qs = await prisma.question.findMany({ where: { testId }, select: { id: true, correct: true, text: true, explanation: true }, orderBy: { order: "asc" } });
      if (!qs.length) return Response.json({ error: "Test topilmadi yoki savollari yo'q" }, { status: 404 });
      const byId = Object.fromEntries(qs.map(q => [q.id, String(q.correct).trim().toUpperCase()]));
      total = qs.length;
      for (const [qid, ans] of Object.entries(answers)) if (byId[qid] && ans === byId[qid]) score++;
      review = qs.map(q => ({ id: q.id, text: q.text, correct: String(q.correct).trim().toUpperCase(), explanation: q.explanation ?? undefined }));
    }
  } catch (e) { console.error("attempt scoring", e); return Response.json({ error: "Saqlab bo'lmadi" }, { status: 500 }); }
  if (userId && !testId.startsWith("seed_")) {
    try { await prisma.testAttempt.create({ data: { userId, testId, score, total, answers } }); } catch (e) { console.error("attempt save", e); }
  }
  const pct = total ? Math.round(score / total * 100) : 0;
  return Response.json({ ok: true, score, total, pct, isSeed: testId.startsWith("seed_"), review });
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
  } catch (e) { console.error("GET attempts", e); return Response.json({ attempts: [] }); }
}
