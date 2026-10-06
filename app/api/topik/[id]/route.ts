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
