import { prisma } from "@/lib/db";
import { darsUser } from "@/lib/dars-auth";
import { z } from "zod";

const submission = z.object({
  unitId: z.string().regex(/^[a-f\d]{24}$/i),
  section: z.enum(["vocab", "grammar", "listening", "homework", "video"]),
  answers: z.record(z.string(), z.number().int().min(0).max(20)),
});

export async function GET(req: Request) {
  try {
    const user = await darsUser(req);
    if (!user) return Response.json({ error: "Auth kerak" }, { status: 401 });
    const [progress, wallet] = await Promise.all([
      prisma.darsProgress.findMany({ where: { userId: user.id } }),
      prisma.user.findUnique({ where: { id: user.id }, select: { xp: true, coins: true, stars: true, streak: true } }),
    ]);
    return Response.json({ progress, user: wallet });
  } catch { return Response.json({ error: "Progress yuklanmadi" }, { status: 503 }); }
}

export async function POST(req: Request) {
  try {
    const user = await darsUser(req);
    if (!user) return Response.json({ error: "Auth kerak" }, { status: 401 });
    const parsed = submission.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: "Javob formati noto‘g‘ri" }, { status: 400 });
    const { unitId, section, answers } = parsed.data;
    const unit = await prisma.darsUnit.findUnique({ where: { id: unitId }, include: { grammars: true, listenings: true, videos: true, vocab: { orderBy: { order: "asc" } } } });
    if (!unit) return Response.json({ error: "Unit topilmadi" }, { status: 404 });
    const previous = await prisma.darsUnit.findMany({ where: { order: { lt: unit.order } }, select: { id: true } });
    const completed = await prisma.darsProgress.count({ where: { userId: user.id, unitId: { in: previous.map(u => u.id) }, stars: { gt: 0 } } });
    if (completed !== previous.length) return Response.json({ error: "Avval oldingi unitni yakunlang" }, { status: 403 });
    const commit = async (
      field: "vocabDone" | "grammarDone" | "listeningDone" | "homeworkDone" | "videoDone",
      passed: boolean, score: number, total: number,
      review: { key: string; correct: number; explanation: string }[],
    ) => {
      // Transaction makes completion and wallet update indivisible. Concurrent writes
      // conflict and are retried against the already-completed record.
      for (let retry = 0; retry < 4; retry++) {
        try {
          const result = await prisma.$transaction(async tx => {
            const old = await tx.darsProgress.findUnique({ where: { userId_unitId: { userId: user.id, unitId } } });
            const gain = passed && !old?.[field] ? 10 : 0;
            const row = await tx.darsProgress.upsert({
              where: { userId_unitId: { userId: user.id, unitId } },
              create: { userId: user.id, unitId, [field]: passed, xpAwarded: gain },
              update: { [field]: passed || !!old?.[field], xpAwarded: { increment: gain } },
            });
            // "Uy vazifasi" olib tashlandi — yakunlash: vocab + grammar + listening
            // (+ unitda video bo'lsa video ham majburiy)
            const videoOk = unit.videos.length === 0 || row.videoDone;
            const newlyComplete = row.vocabDone && row.grammarDone && row.listeningDone && videoOk && row.stars === 0;
            if (newlyComplete) await tx.darsProgress.update({ where: { id: row.id }, data: { stars: 3 } });
            if (gain) await tx.user.update({ where: { id: user.id }, data: { xp: { increment: gain + (newlyComplete ? 50 : 0) }, coins: { increment: 5 }, stars: { increment: newlyComplete ? 3 : 0 } } });
            return { gained: gain + (newlyComplete ? 50 : 0), passed, score, total, review };
          });
          return Response.json(result);
        } catch (e) {
          if (retry === 3 || !(e instanceof Error) || !("code" in e) || !["P2034", "P2002"].includes(String(e.code))) throw e;
        }
      }
    };
    // Video bo'limi: "Video ko'rishni boshlash" tugmasi bilan qabul qilinadi
    if (section === "video") {
      if (!unit.videos.length) return Response.json({ error: "Bu unitda video hali qo‘shilmagan" }, { status: 400 });
      return await commit("videoDone", true, 1, 1, []);
    }
    const questions: { key: string; correct: number; explanation: string }[] = [];
    if (section === "vocab") unit.vocab.forEach((v, i) => questions.push({ key: v.id, correct: i, explanation: `${v.ko} — ${v.uz}` }));
    if (section === "grammar" || section === "homework") unit.grammars.forEach(g => {
      const exercises = g.exercises as { correct: number; hint?: string }[];
      exercises.forEach((e, i) => questions.push({ key: `${g.id}:${i}`, correct: e.correct, explanation: e.hint || g.explain }));
    });
    if (section === "listening") unit.listenings.forEach(l => {
      const qs = l.questions as { correct: string; options: { key: string }[]; explanation?: string }[];
      qs.forEach((q, i) => questions.push({ key: `${l.id}:${i}`, correct: q.options.findIndex(o => o.key === q.correct), explanation: q.explanation || l.transcript || "" }));
    });
    if (!questions.length) return Response.json({ error: "Mashqlar hali qo‘shilmagan" }, { status: 400 });
    const score = questions.filter(q => answers[q.key] === q.correct).length;
    const passed = score / questions.length >= 0.8;
    const field = ({ vocab: "vocabDone", grammar: "grammarDone", listening: "listeningDone", homework: "homeworkDone", video: "videoDone" } as const)[section];
    return await commit(field, passed, score, questions.length, questions);
  } catch { return Response.json({ error: "Natija saqlanmadi. Qayta urinib ko‘ring." }, { status: 503 }); }
}
