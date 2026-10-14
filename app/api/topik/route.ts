import { prisma } from "@/lib/db";
import { TOPIC_SEED_TESTS } from "@/lib/topik-seed";
export const dynamic = "force-dynamic";

// GET /api/topik — список TOPIK тестов
export async function GET() {
  try {
    const tests = await prisma.test.findMany({
      include: { _count: { select: { questions: true } } },
      orderBy: { createdAt: "desc" },
    });
    const seed = TOPIC_SEED_TESTS.map(t => ({
      id: t.id, title: t.title, level: t.level, type: t.type,
      questions: t.questions.length, time: t.time,
    }));
    const db = tests.map(t => ({
      id: t.id, title: t.title, level: t.level, type: t.type,
      questions: t._count.questions,
      time: t.type === "Reading" ? "40 daq" : t.type === "Listening" ? "35 daq" : "80 daq",
    }));
    return Response.json({
      tests: [...seed, ...db],
      seeded: true,
      note: "Seed-testlar (original savollar, rasmiy imtihon uslubida).",
    });
  } catch (e) {
    console.error("GET /api/topik", e);
    return Response.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// POST /api/topik — создать тест (только ADMIN)
import { verify, readAuthToken } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";

export async function POST(req: Request) {
  const token = readAuthToken(req);
  const data = verify(token);
  const email = String((data as Record<string, unknown>)?.email ?? "");
  if (!data || (data as Record<string, unknown>)?.role !== "ADMIN" || !isAdminEmail(email)) {
    return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  }
  let body: { title?: string; level?: string; type?: string; questions?: { text: string; options: string[]; correct: string; explanation?: string }[] } = {};
  try { body = await req.json(); } catch {}
  const title = String(body.title ?? "").trim();
  const level = String(body.level ?? "TOPIK I").trim() || "TOPIK I";
  const type = String(body.type ?? "Reading").trim() || "Reading";
  if (!title) return Response.json({ error: "Sarlavha kiriting" }, { status: 400 });
  const qs = Array.isArray(body.questions) ? body.questions : [];
  try {
    const test = await prisma.test.create({ data: { title, level, type } });
    if (qs.length) {
      await prisma.question.createMany({
        data: qs.slice(0, 60).map((q, i) => ({
          testId: test.id,
          text: String(q.text ?? "").trim() || `Savol ${i + 1}`,
          options: Array.isArray(q.options) ? q.options : [],
          correct: String(q.correct ?? "A").trim().toUpperCase(),
          explanation: q.explanation ? String(q.explanation) : undefined,
          order: i,
        })),
      });
    }
    return Response.json({ id: test.id, ok: true });
  } catch (e) {
    console.error("POST /api/topik", e);
    return Response.json({ error: "Yaratib bo‘lmadi" }, { status: 500 });
  }
}
