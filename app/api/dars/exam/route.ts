import { prisma } from "@/lib/db";
import { darsUser } from "@/lib/dars-auth";
import { sealData, openData } from "@/lib/token";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import crypto from "node:crypto";

type ExamQ = { text: string; options: string[]; correct: number; explain?: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const BLOCK = 4;
const MAX_Q = 10;
const EXAM_TTL_MS = 2 * 3600 * 1000; // imtihon kaliti 2 soat amal qiladi

async function buildQuestions(from: number) {
  const to = from + BLOCK - 1;
  const units = await prisma.darsUnit.findMany({
    where: { order: { gte: from, lte: to } },
    include: { vocab: { orderBy: { order: "asc" } }, grammars: true, videos: { select: { id: true } } },
    orderBy: { order: "asc" },
  });
  const seen = new Set<string>();
  const vocabs: { ko: string; uz: string }[] = [];
  for (const u of units) for (const v of u.vocab) {
    const k = `${v.ko}\u0000${v.uz}`;
    if (seen.has(k)) continue;
    seen.add(k);
    vocabs.push({ ko: v.ko, uz: v.uz });
  }
  const uzPool = [...new Set(vocabs.map(v => v.uz))];
  const koPool = [...new Set(vocabs.map(v => v.ko))];

  const pool: ExamQ[] = [];
  for (const v of vocabs) {
    const uzOthers = shuffle(uzPool.filter(x => x !== v.uz)).slice(0, 3);
    if (uzOthers.length >= 1) {
      const options = shuffle([v.uz, ...uzOthers]);
      pool.push({ text: `«${v.ko}» nima degani?`, options, correct: options.indexOf(v.uz), explain: `${v.ko} — ${v.uz}` });
    }
    const koOthers = shuffle(koPool.filter(x => x !== v.ko)).slice(0, 3);
    if (koOthers.length >= 1) {
      const options = shuffle([v.ko, ...koOthers]);
      pool.push({ text: `«${v.uz}» koreyscha qanday aytiladi?`, options, correct: options.indexOf(v.ko), explain: `${v.ko} — ${v.uz}` });
    }
  }
  for (const u of units) for (const g of u.grammars) {
    const exs = Array.isArray(g.exercises) ? (g.exercises as { q?: string; options?: string[]; correct?: number; hint?: string }[]) : [];
    for (const ex of exs) {
      if (!ex.q || !Array.isArray(ex.options) || ex.options.length < 2) continue;
      const correct = typeof ex.correct === "number" && ex.correct >= 0 && ex.correct < ex.options.length ? ex.correct : 0;
      pool.push({ text: ex.q, options: ex.options, correct, explain: ex.hint || g.explain });
    }
  }
  return { to, unitsCount: units.length, questions: shuffle(pool).slice(0, MAX_Q) };
}

// Blokning barcha unitlari yakunlanganmi (xuddi ro'yxatdagi percent kabi)
async function blockDone(userId: string, unitIds: { id: string; hasVideo: boolean }[]) {
  if (!unitIds.length) return false;
  const rows = await prisma.darsProgress.findMany({ where: { userId, unitId: { in: unitIds.map(u => u.id) } } });
  const byId = new Map(rows.map(r => [r.unitId, r]));
  return unitIds.every(u => {
    const p = byId.get(u.id);
    if (!p) return false;
    const total = u.hasVideo ? 4 : 3;
    const done = [p.vocabDone, p.grammarDone, p.listeningDone, ...(u.hasVideo ? [p.videoDone] : [])].filter(Boolean).length;
    return done === total;
  });
}

// GET /api/dars/exam?from=1 — test savollari (blok: from..from+3) + eng yaxshi natija
// GET /api/dars/exam — barcha bloklar bo'yicha eng yaxshi natijalar (ro'yxat uchun)
export async function GET(req: Request) {
  try {
    const user = await darsUser(req);
    if (!user) return Response.json({ error: "Auth kerak" }, { status: 401 });
    const url = new URL(req.url);
    const fromRaw = url.searchParams.get("from");
    if (fromRaw === null) {
      const bests = await prisma.darsExamBest.findMany({ where: { userId: user.id }, orderBy: { from: "asc" } });
      return Response.json({ bests });
    }
    const from = Number(fromRaw);
    if (!Number.isInteger(from) || from < 1) return Response.json({ error: "Noto‘g‘ri blok" }, { status: 400 });
    const { to, unitsCount, questions } = await buildQuestions(from);
    if (unitsCount < BLOCK) return Response.json({ error: "Bu blok uchun to‘liq 4 ta unit yo‘q" }, { status: 404 });
    if (!questions.length) return Response.json({ error: "Bu blokda test uchun material hali qo‘shilmagan" }, { status: 400 });
    const units = await prisma.darsUnit.findMany({ where: { order: { gte: from, lte: to } }, select: { id: true, videos: { select: { id: true } } } });
    if (!(await blockDone(user.id, units.map(u => ({ id: u.id, hasVideo: u.videos.length > 0 }))))) {
      return Response.json({ error: "Avval shu blokdagi barcha 4 ta unitni yakunlang" }, { status: 403 });
    }
    const best = await prisma.darsExamBest.findUnique({ where: { userId_from: { userId: user.id, from } } });
    // To'g'ri javoblar klientga ochiq yuborilmaydi — shifrlangan kalitda saqlanadi
    const key = sealData({
      uid: user.id,
      from,
      jti: crypto.randomBytes(12).toString("base64url"),
      c: questions.map(q => q.correct),
      e: questions.map(q => q.explain ?? ""),
    }, EXAM_TTL_MS);
    const publicQs = questions.map(q => ({ text: q.text, options: q.options }));
    return Response.json({ from, to, questions: publicQs, total: questions.length, best, key });
  } catch { return Response.json({ error: "Imtihon yuklanmadi" }, { status: 503 }); }
}

// POST /api/dars/exam {from, key, answers:number[]} — ball serverda hisoblanadi (eng yaxshisi saqlanadi)
export async function POST(req: Request) {
  try {
    const user = await darsUser(req);
    if (!user) return Response.json({ error: "Auth kerak" }, { status: 401 });
    const parsed = z.object({
      from: z.number().int().min(1),
      key: z.string().min(10).max(20_000),
      answers: z.array(z.number().int().min(-1).max(20)).max(MAX_Q),
    }).safeParse(await req.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Natija noto‘g‘ri" }, { status: 400 });
    const { from, key, answers } = parsed.data;
    const sealed = openData(key);
    const correctArr = Array.isArray(sealed?.c) ? (sealed!.c as number[]) : null;
    const explainArr = Array.isArray(sealed?.e) ? (sealed!.e as string[]) : [];
    if (!sealed || !correctArr || sealed.uid !== user.id || sealed.from !== from) {
      return Response.json({ error: "Imtihon muddati o‘tgan — qayta boshlang" }, { status: 400 });
    }
    const total = correctArr.length;
    if (answers.length !== total) return Response.json({ error: "Barcha savollarga javob bering" }, { status: 400 });
    // Kalit bir martalik: javoblarni ko'rib, o'sha kalit bilan qayta topshirib bo'lmaydi
    if (typeof sealed.jti !== "string" || !rateLimit(`exam:jti:${sealed.jti}`, 1, EXAM_TTL_MS)) {
      return Response.json({ error: "Bu imtihon allaqachon topshirilgan — qayta boshlang" }, { status: 409 });
    }
    const score = correctArr.reduce((n, c, i) => n + (answers[i] === c ? 1 : 0), 0);
    const to = from + BLOCK - 1;
    const units = await prisma.darsUnit.findMany({ where: { order: { gte: from, lte: to } }, select: { id: true, videos: { select: { id: true } } } });
    if (units.length < BLOCK || !(await blockDone(user.id, units.map(u => ({ id: u.id, hasVideo: u.videos.length > 0 }))))) {
      return Response.json({ error: "Avval shu blokdagi barcha 4 ta unitni yakunlang" }, { status: 403 });
    }
    const existing = await prisma.darsExamBest.findUnique({ where: { userId_from: { userId: user.id, from } } });
    const better = !existing || score * existing.total >= existing.score * total;
    const best = existing
      ? await prisma.darsExamBest.update({
          where: { id: existing.id },
          data: { attempts: { increment: 1 }, ...(better ? { score, total, to } : {}) },
        })
      : await prisma.darsExamBest.create({ data: { userId: user.id, from, to, score, total } });
    return Response.json({ best, improved: better, score, total, review: correctArr.map((c, i) => ({ correct: c, explain: explainArr[i] || "" })) });
  } catch { return Response.json({ error: "Natija saqlanmadi" }, { status: 503 }); }
}
