import { prisma } from "@/lib/db";
import { readAuth } from "@/lib/token";

export const dynamic = "force-dynamic";

// Ma'lumotnoma — OPENAI_API_KEY bo'lmasa yoki so'rov yiqilsa halol javob (AI deb yolg'on ko'rsatmaymiz)
const REFERENCE: { keys: string[]; answer: string }[] = [
  { keys: ["은/는", "은는", "_topic", "mavzu"], answer: "은/는 — mavzu yuklamasi. Oldin tilga olingan yoki umumiy mavzuni bildiradi.\nMasalan: 저는 학생입니다 — «Men talabaman» (mavzu men).\n이/가 — yangi axborot/ega urg'usi: 학생이 왔습니다 — aynan talaba keldi." },
  { keys: ["이/가", "이가"], answer: "이/가 — ega yuklamasi. Yangi axborotni beradi yoki ega urg'usini ko'rsatadi.\n비가 옵니다 — yomg'ir yog'moqda (yangi axborot).\nSolishtirish: 은/는 — mavzu, 이/가 — ega." },
  { keys: ["을/를", "을를", "tushum"], answer: "을/를 — tushum kelishigi (obyekt).\n책을 읽습니다 — kitob o'qiyman.\nUnli dan keyin 를, undan keyin 을 yoziladi." },
  { keys: ["입니다", "입니다니다", "bo'lishlik"], answer: "입니다 — rasmiy «...dir» ko'rinishi.\n저는 선생님입니다 — Men ustozman.\n요/이에요 — norasmiy shakl: 학생이에요." },
  { keys: ["에", "o'rin"], answer: "에 — o'rin-payt kelishigi.\n학교에 가요 — maktabga boraman.\n에서 — chiqish/o'rin: 학교에서 공부합니다 — maktabda o'qiyman." },
  { keys: ["사랑", "sevgi"], answer: "사랑 (sarang) — sevgi.\nMisollar: 사랑해요 — sevaman; 가족 사랑 — oila sevgisi; 첫사랑 — birinchi sevgi." },
  { keys: ["안녕하세요", "salom"], answer: "안녕하세요 — rasmiy salom.\nQo'shimcha: 안녕히 가세요 — xayr (ketayotganga), 안녕히 계세요 — xayr (qolayotganga)." },
  { keys: ["toik", "topik", "tayyorgarlik"], answer: "TOPIK strategiyasi: 1) Har kuni 20 ta yangi so'z. 2) 은/는 vs 이/가 kabi asosiy farqlarni yodlang. 3) Reading da avval savollarni keyin matnni o'qing. 4) Har hafta 1 ta mock test topshiring (/topik)." },
  { keys: ["ㅢ", "니까", "niga"], answer: "니까 — sabab (chunki): 아침이라서 배가 고파요 — ertalabligani uchun ochman." },
];

function referenceAnswer(q: string): string | null {
  const lower = q.toLowerCase();
  for (const r of REFERENCE) {
    if (r.keys.some(k => lower.includes(k.toLowerCase()))) return r.answer;
  }
  return null;
}

// POST /api/ai — { messages: [{role, text}] } → { reply, source: "openrouter" | "openai" | "reference" | "none" }
const AXRORBEK_SYSTEM = `Sen "Axrorbek AI" — DREAM KOREA o'quv markazining rasmiy koreys tili yordamchisisan.
Vazifang: o'quvchilarga koreys tilini o'rgatish — grammatika (격조사/particle'lar, kelishiklar), lug'at, tarjima (koreys↔o'zbek), gap qurish va TOPIK imtihoniga tayyorgarlik.
Qoidalar:
- Javobni o'zbek tilida ber, koreys yozuvi bilan misollar keltir.
- Qisqa, aniq va do'stona yoz; izoh kerak bo'lsa 3-5 gapdan oshirma.
- Xato bo'lsa muloyimlik bilan tuzatib, to'g'risini ko'rsat.
- Savol noaniq bo'lsa bir-ikki misol bilan aniqlashtirib so'r.
- Hech qanday imkoniyatni uddalay olmasang, halol ayt va yordam uchun +998 94 328 05 13 raqamini ber.`;

// POST /api/ai — { messages: [{role, text}] } → { reply, source }
export async function POST(req: Request) {
  // AI faqat tizimga kirgan foydalanuvchi uchun
  if (!readAuth(req)) {
    return Response.json({ error: "AI dan foydalanish uchun tizimga kiring", code: "UNAUTHORIZED" }, { status: 401 });
  }
  let body: { messages?: { role: string; text: string }[] } = {};
  try { body = await req.json(); } catch {}
  const messages = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
  const lastUser = [...messages].reverse().find(m => m.role === "user")?.text?.trim() ?? "";

  // 1) OpenRouter (Axrorbek AI) — OPENROUTER_API_KEY bo'lsa
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey && lastUser) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${orKey}`,
          "HTTP-Referer": "https://dream-korea.onrender.com",
          "X-Title": "DREAM KOREA - Axrorbek AI",
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || "xiaomi/mimo-v2.6-flash",
          messages: [
            { role: "system", content: AXRORBEK_SYSTEM },
            ...messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })),
          ],
          max_tokens: 600,
        }),
      });
      if (r.ok) {
        const d = await r.json();
        const reply = d?.choices?.[0]?.message?.content?.trim();
        if (reply) return Response.json({ reply, source: "openrouter" });
      } else {
        const err = await r.text().catch(() => "");
        console.error("openrouter http", r.status, err.slice(0, 300));
      }
    } catch (e) {
      console.error("openrouter error", e);
    }
  }

  // 2) OpenAI kaliti bo'lsa — real AI
  const key = process.env.OPENAI_API_KEY;
  if (key && lastUser) {
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: "Sen DREAM KOREA o'quv markazining koreys tili yordamchisisan. O'zbek tilida javob bera olasan. Qisqa, aniq va foydali javob ber." },
            ...messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })),
          ],
          max_tokens: 500,
        }),
      });
      if (r.ok) {
        const d = await r.json();
        const reply = d?.choices?.[0]?.message?.content?.trim();
        if (reply) return Response.json({ reply, source: "openai" });
      }
    } catch (e) {
      console.error("openai error", e);
    }
  }

  // 2) Ma'lumotnomadan halol javob
  const ref = lastUser ? referenceAnswer(lastUser) : null;
  if (ref) return Response.json({ reply: ref, source: "reference" });

  // 3) Hech nima topilmadi — halol xabar
  return Response.json({
    reply: "Axrorbek AI hozircha ulanmagan va savolingiz ma'lumotnomada yo'q. Administratorga murojaat qiling: +998 94 328 05 13.",
    source: "none",
  });
}
