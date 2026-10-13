import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { normalizeEmail } from "@/lib/auth";
export const dynamic = "force-dynamic";

async function getUserId(req: Request): Promise<string | null> {
  const t = readAuthToken(req);
  const d = verify(t) as Record<string, unknown> | null;
  if (!d) return null;
  if (d.id) return String(d.id);
  const email = String(d.email ?? "");
  try { const u = await prisma.user.findUnique({ where: { email: normalizeEmail(email) }, select: { id: true } }); return u?.id ?? null; } catch { return null; }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const writingId = searchParams.get("writingId");
  const userId = await getUserId(req);
  if (!userId) return Response.json({ error: "Auth kerak" }, { status: 401 });
  if (!writingId) return Response.json({ error: "writingId kerak" }, { status: 400 });
  try {
    const attempts = await prisma.writingAttempt.findMany({ where: { writingId, userId }, orderBy: { createdAt: "desc" }, take: 20 });
    return Response.json({ attempts });
  } catch (e) { console.error("GET /api/dars/writing", e); return Response.json({ attempts: [] }); }
}

export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return Response.json({ error: "Auth kerak" }, { status: 401 });
  let b: { writingId?: string; text?: string } = {};
  try { b = await req.json(); } catch {}
  const writingId = String(b.writingId ?? "").trim();
  const text = String(b.text ?? "").trim();
  if (!writingId || !text) return Response.json({ error: "writingId va text kerak" }, { status: 400 });
  if (text.length < 10) return Response.json({ error: "Javob juda qisqa" }, { status: 400 });
  try {
    const w = await prisma.darsWriting.findUnique({ where: { id: writingId } });
    if (!w) return Response.json({ error: "Topshiriq topilmadi" }, { status: 404 });

    // AI-оценка через сервер (если есть ключ), иначе эвристика
    let score: number | null = null;
    let feedback: string | null = null;
    const key = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (key) {
      try {
        const prompt = `Ты — экзаменатор TOPIK 쓰기. Задание: ${w.prompt}\nКритерии: ${w.criteria ?? "вежливость, связки, грамматика"}\nОтвет ученика (корейский, 50-700 자):\n${text}\nОцени 0-100 и дай 3-4 предложения фидбэка на узбекском. Ответ строго JSON: {"score": number, "feedback": "string"}`;
        const url = process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
        const model = process.env.OPENROUTER_API_KEY ? (process.env.OPENROUTER_MODEL || "xiaomi/mimo-v2.6-flash") : (process.env.OPENAI_MODEL || "gpt-4o-mini");
        const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${key}` };
        if (process.env.OPENROUTER_API_KEY) { headers["HTTP-Referer"] = "https://dream-korea.onrender.com"; headers["X-Title"] = "DREAM KOREA"; }
        const r = await fetch(url, { method: "POST", headers, body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 400 }) });
        if (r.ok) {
          const d = await r.json();
          const content = d?.choices?.[0]?.message?.content ?? "";
          const m = content.match(/\{[\s\S]*\}/);
          if (m) { const j = JSON.parse(m[0]); score = Math.max(0, Math.min(100, Number(j.score) || 0)); feedback = String(j.feedback ?? "").trim() || content.slice(0, 600); }
          else { feedback = content.slice(0, 600); const n = content.match(/(\d{1,3})/); if (n) score = Math.max(0, Math.min(100, Number(n[1]))); }
        }
      } catch {}
    }
    // fallback эвристика
    if (score === null) {
      feedback = "Javob saqlandi. Avtomatik baholash hozir mavjud emas; mezonlar bo‘yicha javobingizni tekshiring.";
    }

    const attempt = await prisma.writingAttempt.create({ data: { writingId, userId, text, score, feedback } });
    // отмечаем writing как done для прогресса (если оценка есть)
    try { await prisma.darsProgress.upsert({ where: { userId_unitId: { userId, unitId: w.unitId } }, update: { writingDone: true }, create: { userId, unitId: w.unitId, writingDone: true } }); } catch {}
    return Response.json({ ok: true, attempt });
  } catch (e) { console.error("POST /api/dars/writing", e); return Response.json({ error: "Saqlab bo‘lmadi" }, { status: 500 }); }
}
