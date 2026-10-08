import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";

// Встроенные вопросы для seed-тестов (когда БД пустая)
const SEED_QUESTIONS: Record<string, { text: string; options: { key: string; text: string }[]; correct: string; explanation: string }[]> = {
  seed_topik1_reading: [
    { text: "다음 중 맞는 것을 고르십시오.", options: [{ key: "A", text: "학생입니다." }, { key: "B", text: "요리사입니다." }, { key: "C", text: "선생님입니다." }, { key: "D", text: "회사원입니다." }], correct: "C", explanation: "Rasmdagi odam doskada — 선생님." },
    { text: "빈칸: 저는 ___ 입니다.", options: [{ key: "A", text: "학교" }, { key: "B", text: "학생" }, { key: "C", text: "책상" }, { key: "D", text: "의자" }], correct: "B", explanation: "저는 학생입니다." },
    { text: "대화: — 안녕하세요? — 안녕하세요. 저는 민준입니다. → ?", options: [{ key: "A", text: "민준은 학생입니다." }, { key: "B", text: "인사하는 대화입니다." }, { key: "C", text: "학교에 갑니다." }, { key: "D", text: "책을 읽습니다." }], correct: "B", explanation: "Salomlashish dialogi." },
  ],
  seed_topik1_listening: [
    { text: "[Listening] 어디에 가요? — 학교에 가요.", options: [{ key: "A", text: "학교" }, { key: "B", text: "병원" }, { key: "C", text: "은행" }, { key: "D", text: "시장" }], correct: "A", explanation: "학교에 가요." },
    { text: "[Listening] 지금 몇 시예요? — 열 시예요.", options: [{ key: "A", text: "9시" }, { key: "B", text: "10시" }, { key: "C", text: "11시" }, { key: "D", text: "12시" }], correct: "B", explanation: "열 시 = 10." },
  ],
  seed_topik1_full: [],
  seed_topik2_reading: [],
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id.startsWith("seed_")) {
    const qs = SEED_QUESTIONS[id] ?? SEED_QUESTIONS.seed_topik1_reading;
    // Для full — объединяем
    if (id === "seed_topik1_full") {
      const all = [...SEED_QUESTIONS.seed_topik1_reading, ...SEED_QUESTIONS.seed_topik1_listening];
      return Response.json({ id, title: "TOPIK I — Full Mock", level: "TOPIK I", type: "Full", time: "80 daq", questions: all.map((q, i) => ({ id: String(i + 1), text: q.text, options: q.options, correct: q.correct, explanation: q.explanation })) });
    }
    return Response.json({
      id,
      title: id.includes("listening") ? "TOPIK I — Listening" : id.includes("topik2") ? "TOPIK II — Reading" : "TOPIK I — Reading",
      level: id.startsWith("seed_topik2") ? "TOPIK II" : "TOPIK I",
      type: id.includes("full") ? "Full" : id.includes("listening") ? "Listening" : "Reading",
      time: id.includes("full") ? "80 daq" : "40 daq",
      questions: qs.map((q, i) => ({ id: String(i + 1), text: q.text, options: q.options, correct: q.correct, explanation: q.explanation })),
    });
  }
  try {
    const test = await prisma.test.findUnique({ where: { id }, include: { questions: { orderBy: { order: "asc" } } } });
    if (!test) return Response.json({ error: "Topilmadi" }, { status: 404 });
    return Response.json({
      id: test.id,
      title: test.title,
      level: test.level,
      type: test.type,
      questions: test.questions.map(q => ({
        id: q.id,
        text: q.text,
        options: Array.isArray(q.options) ? (q.options as { key: string; text: string }[]) : [{ key: "A", text: String(q.options) }],
        correct: q.correct,
        explanation: q.explanation ?? "",
      })),
    });
  } catch (e) {
    console.error("GET /api/topik/[id]", e);
    return Response.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// ==== ADMIN: savol qo'shish / test o'chirish ====
import { verify, readAuthToken } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";

function requireAdmin(req: Request) {
  const token = readAuthToken(req);
  const d = verify(token);
  return !!d && d.role === "ADMIN" && isAdminEmail(String(d.email ?? ""));
}

// POST /api/topik/[id] — testga savol qo'shish (ADMIN)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  if (id.startsWith("seed_")) return Response.json({ error: "Seed testga savol qo'shib bo'lmaydi" }, { status: 400 });
  let body: { text?: string; options?: { key: string; text: string }[]; correct?: string; explanation?: string } = {};
  try { body = await req.json(); } catch {}
  const text = String(body.text ?? "").trim();
  if (!text) return Response.json({ error: "Savol matnini kiriting" }, { status: 400 });
  const options = Array.isArray(body.options) && body.options.length >= 2
    ? body.options.map((o, i) => ({ key: String(o.key || "ABCD"[i] || "A").toUpperCase(), text: String(o.text ?? "") }))
    : [{ key: "A", text: "—" }, { key: "B", text: "—" }, { key: "C", text: "—" }, { key: "D", text: "—" }];
  const correct = String(body.correct ?? "A").trim().toUpperCase() || "A";
  if (!options.some(o => o.key === correct)) {
    return Response.json({ error: "To'g'ri javob variantlardan biri bo'lishi kerak" }, { status: 400 });
  }
  try {
    const test = await prisma.test.findUnique({ where: { id }, select: { id: true } });
    if (!test) return Response.json({ error: "Test topilmadi" }, { status: 404 });
    const last = await prisma.question.findFirst({ where: { testId: id }, orderBy: { order: "desc" } });
    const q = await prisma.question.create({
      data: {
        testId: id,
        text,
        options,
        correct,
        explanation: String(body.explanation ?? "").trim() || undefined,
        order: (last?.order ?? -1) + 1,
      },
    });
    return Response.json({ ok: true, question: q });
  } catch (e) {
    console.error("POST /api/topik/[id] savol", e);
    return Response.json({ error: "Saqlab bo'lmadi" }, { status: 500 });
  }
}

// DELETE /api/topik/[id] — testni o'chirish; ?question=qid — faqat savolni o'chirish (ADMIN)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  if (id.startsWith("seed_")) return Response.json({ error: "Seed testni o'chirib bo'lmaydi" }, { status: 400 });
  const questionId = new URL(req.url).searchParams.get("question");
  try {
    if (questionId) {
      await prisma.question.delete({ where: { id: questionId } });
      return Response.json({ ok: true });
    }
    const test = await prisma.test.findUnique({ where: { id }, select: { id: true } });
    if (!test) return Response.json({ error: "Test topilmadi" }, { status: 404 });
    await prisma.testAttempt.deleteMany({ where: { testId: id } });
    await prisma.question.deleteMany({ where: { testId: id } });
    await prisma.test.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/topik/[id]", e);
    return Response.json({ error: "O'chirib bo'lmadi" }, { status: 500 });
  }
}
