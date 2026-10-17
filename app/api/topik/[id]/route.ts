import { prisma } from "@/lib/db";
import { buildSeedFull } from "@/lib/topik-seed";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = requireAdmin(req);
  const wantSolutions = admin || new URL(req.url).searchParams.get("solutions") === "1";
  if (id.startsWith("seed_")) {
    const test = buildSeedFull(id);
    if (!test) return Response.json({ error: "Topilmadi" }, { status: 404 });
    return Response.json({
      id: test.id,
      title: test.title,
      level: test.level,
      type: test.type,
      time: test.time,
      questions: test.questions.map((q, i) => ({
        id: String(i + 1),
        text: q.text,
        audio: q.audio,
        options: q.options,
        ...(wantSolutions ? { correct: q.correct, explanation: q.explanation } : {}),
      })),
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
      questions: test.questions.map(q => {
        const base: Record<string, unknown> = {
          id: q.id,
          text: q.text,
          options: Array.isArray(q.options) ? (q.options as { key: string; text: string }[]) : [{ key: "A", text: String(q.options) }],
        };
        if (wantSolutions) { base.correct = q.correct; base.explanation = q.explanation ?? ""; }
        return base;
      }),
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

// PATCH /api/topik/[id] — testni tahrirlash: sarlavha / daraja / tur (ADMIN)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  if (id.startsWith("seed_")) return Response.json({ error: "Seed testni o'zgartirib bo'lmaydi" }, { status: 400 });
  let body: { title?: string; level?: string; type?: string } = {};
  try { body = await req.json(); } catch {}
  const data: { title?: string; level?: string; type?: string } = {};
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return Response.json({ error: "Sarlavha bo'sh bo'lishi mumkin emas" }, { status: 400 });
    if (title.length > 150) return Response.json({ error: "Sarlavha juda uzun (max 150)" }, { status: 400 });
    data.title = title;
  }
  if (body.level !== undefined) {
    const level = String(body.level).trim();
    if (!level || level.length > 20) return Response.json({ error: "Daraja noto'g'ri" }, { status: 400 });
    data.level = level;
  }
  if (body.type !== undefined) {
    const type = String(body.type).trim();
    if (!type || type.length > 20) return Response.json({ error: "Tur noto'g'ri" }, { status: 400 });
    data.type = type;
  }
  if (!Object.keys(data).length) return Response.json({ error: "O'zgarish yo'q" }, { status: 400 });
  try {
    await prisma.test.update({ where: { id }, data });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Test topilmadi" }, { status: 404 });
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
      const q = await prisma.question.findUnique({ where: { id: questionId }, select: { testId: true } });
      if (!q) return Response.json({ error: "Savol topilmadi" }, { status: 404 });
      if (q.testId !== id) return Response.json({ error: "Savol bu testga tegishli emas" }, { status: 400 });
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
