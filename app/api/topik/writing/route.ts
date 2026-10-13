import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { normalizeEmail } from "@/lib/auth";
import { promptById } from "@/lib/topik-writing";
export const dynamic = "force-dynamic";

async function getUserId(req: Request): Promise<string | null> {
  const d = verify(readAuthToken(req)) as Record<string, unknown> | null;
  if (!d) return null;
  if (d.id) return String(d.id);
  const email = String(d.email ?? "");
  try { const u = await prisma.user.findUnique({ where: { email: normalizeEmail(email) }, select: { id: true } }); return u?.id ?? null; } catch { return null; }
}

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return Response.json({ error: "Auth kerak" }, { status: 401 });
  try {
    const attempts = await prisma.topikWritingAttempt.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 });
    return Response.json({ attempts });
  } catch { return Response.json({ attempts: [] }); }
}

export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return Response.json({ error: "Auth kerak" }, { status: 401 });
  let b: { promptId?: string; text?: string } = {};
  try { b = await req.json(); } catch {}
  const prompt = promptById(String(b.promptId ?? ""));
  const text = String(b.text ?? "").trim();
  if (!prompt) return Response.json({ error: "Topshiriq topilmadi" }, { status: 404 });
  if (text.length < 10) return Response.json({ error: "Javob juda qisqa" }, { status: 400 });

  let score: number | null = null;
  let feedback: string | null = null;
  const key = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (key) {
    try {
      const p = `Ты — экзаменатор TOPIK 쓰기 ${prompt.no}. Задание: ${prompt.promptKo}\nМинимум ${prompt.minChars} 자. Ответ ученика:\n${text}\nОцени 0-100 (длина, связки, грамматика, лексика) и дай 3-4 предложения фидбэка на узбекском. Строго JSON: {"score": number, "feedback": "string"}`;
      const url = process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
      const model = process.env.OPENROUTER_API_KEY ? (process.env.OPENROUTER_MODEL || "xiaomi/mimo-v2.6-flash") : (process.env.OPENAI_MODEL || "gpt-4o-mini");
      const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${key}` };
      if (process.env.OPENROUTER_API_KEY) { headers["HTTP-Referer"] = "https://dream-korea.onrender.com"; headers["X-Title"] = "DREAM KOREA"; }
      const r = await fetch(url, { method: "POST", headers, body: JSON.stringify({ model, messages: [{ role: "user", content: p }], max_tokens: 400 }) });
      if (r.ok) {
        const d = await r.json();
        const content = String(d?.choices?.[0]?.message?.content ?? "");
        const m = content.match(/\{[\s\S]*\}/);
        if (m) { const j = JSON.parse(m[0]); score = Math.max(0, Math.min(100, Number(j.score) || 0)); feedback = String(j.feedback ?? "").trim() || content.slice(0, 600); }
        else { feedback = content.slice(0, 600); const n = content.match(/(\d{1,3})/); if (n) score = Math.max(0, Math.min(100, Number(n[1]))); }
      }
    } catch {}
  }
  if (score === null) {
    // Lightweight heuristic when AI is not configured.
    const hangul = (text.match(/[가-힣]/g) || []).length;
    const kw = prompt.keywords.filter(k => text.includes(k)).length;
    score = Math.min(100, Math.round((Math.min(text.length, prompt.minChars * 2) / (prompt.minChars * 2)) * 55 + (hangul > 20 ? 20 : hangul) + kw * 8));
    feedback = `Uzunlik: ${text.length} 자 (min ${prompt.minChars}). Kalit so'zlar: ${kw}/${prompt.keywords.length}. Maslahat: ${score < 60 ? "kamida belgilangan hajmga yeting va bog'lovchilardan (그리고/하지만/때문에) foydalaning." : "yaxshi! Bog'lovchi va so'z tanlovi bo'yicha yana bir marta o'qib chiqing."}`;
  }

  try {
    const attempt = await prisma.topikWritingAttempt.create({ data: { userId, promptId: prompt.id, text, score, feedback } });
    return Response.json({ ok: true, attempt });
  } catch { return Response.json({ error: "Saqlab bo'lmadi" }, { status: 500 }); }
}
