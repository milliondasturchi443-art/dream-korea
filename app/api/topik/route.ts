import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";

// GET /api/topik — список TOPIK тестов (для студентов и админа)
export async function GET() {
  try {
    const tests = await prisma.test.findMany({
      include: { _count: { select: { questions: true } } },
      orderBy: { createdAt: "desc" },
    });
    // Если пусто — отдаём встроенные seed-тесты (реальное число вопросов, без выдумки)
    if (tests.length === 0) {
      return Response.json({
        tests: [
          { id: "seed_topik1_reading", title: "TOPIK I — Reading", level: "TOPIK I", type: "Reading", questions: 3, time: "10 daq" },
          { id: "seed_topik1_listening", title: "TOPIK I — Listening", level: "TOPIK I", type: "Listening", questions: 2, time: "5 daq" },
          { id: "seed_topik1_full", title: "TOPIK I — Full Mock", level: "TOPIK I", type: "Full", questions: 5, time: "15 daq" },
        ],
        seeded: true,
        note: "Namuna seed-testlar (demo). To'liq TOPIK to'plamini admin Kontent bo'limidan qo'shadi.",
      });
    }
    return Response.json({
      tests: tests.map(t => ({
        id: t.id,
        title: t.title,
        level: t.level,
        type: t.type,
        questions: t._count.questions,
        time: t.type === "Reading" ? "40 daq" : t.type === "Listening" ? "35 daq" : "80 daq",
      })),
    });
  } catch (e) {
    console.error("GET /api/topik", e);
    return Response.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// POST /api/topik — создать тест (только ADMIN, Bearer token)
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
