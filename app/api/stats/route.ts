import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

function isAdminReq(req: Request): boolean {
  const token = readAuthToken(req);
  const d = verify(token);
  return !!d && d.role === "ADMIN" && isAdminEmail(String(d.email ?? ""));
}

type LearningStudent = {
  id: string; name: string; email: string; xp: number; stars: number; streak: number;
  topikLevel: string | null; lastActive: string;
  unitsDone: number; percent: number; started: boolean;
  examBest: { score: number; total: number } | null; examAttempts: number;
  topikN: number; topikAvg: number;
  writingN: number; homeworkN: number;
};

function unitPercent(unit: { videos: { id: string }[] }, p: { vocabDone: boolean; grammarDone: boolean; listeningDone: boolean; videoDone: boolean }): number {
  const total = unit.videos.length > 0 ? 4 : 3;
  const done = [p.vocabDone, p.grammarDone, p.listeningDone, ...(unit.videos.length > 0 ? [p.videoDone] : [])].filter(Boolean).length;
  return Math.round((done / total) * 100);
}

const avg = (nums: number[]) => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);

// O'quv statistikasi: darslar, imtihonlar, TOPIK (O'qish/Tinglash), yozish, kitoblar, vazifalar
async function buildLearningStats() {
  const unitsTotal = await prisma.darsUnit.count();
  const [rows, bookCats, homeworkDone, completedLessons, enrollments, levels] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true, name: true, email: true, xp: true, stars: true, streak: true, topikLevel: true, updatedAt: true,
        darsProgress: { select: { unit: { select: { videos: { select: { id: true } } } }, vocabDone: true, grammarDone: true, listeningDone: true, videoDone: true } },
        darsExamBests: { select: { score: true, total: true, attempts: true } },
        testAttempts: { select: { score: true, total: true, test: { select: { type: true } } } },
        topikWritingAttempts: { select: { score: true } },
        writingAttempts: { select: { score: true } },
        homeworkDones: { select: { id: true } },
      },
    }),
    prisma.book.groupBy({ by: ["category"], _count: true }).catch((): { category: string; _count: number }[] => []),
    prisma.homeworkDone.count(),
    prisma.lessonProgress.count({ where: { completed: true } }),
    prisma.enrollment.count(),
    prisma.user.groupBy({ by: ["topikLevel"], where: { role: "STUDENT" }, _count: true }).catch((): { topikLevel: string | null; _count: number }[] => []),
  ]);

  const bySection = new Map<string, { n: number; sum: number }>();
  const topikScores: number[] = [];
  const topikWritingScores: number[] = [];
  const darsWritingScores: number[] = [];
  let started = 0, unitsCompleted = 0, examBests = 0, examAttempts = 0, topikN = 0, topikWritingN = 0, darsWritingN = 0;

  const students: LearningStudent[] = rows.map(u => {
    let unitsDone = 0;
    for (const p of u.darsProgress) if (unitPercent(p.unit, p) === 100) unitsDone++;
    if (u.darsProgress.length) started++;
    unitsCompleted += unitsDone;

    let best: { score: number; total: number } | null = null;
    let stAttempts = 0;
    for (const b of u.darsExamBests) {
      stAttempts += b.attempts;
      examAttempts += b.attempts;
      if (!best || b.score * best.total > best.score * b.total) best = { score: b.score, total: b.total };
    }
    examBests += u.darsExamBests.length;

    const stTopik: number[] = [];
    for (const a of u.testAttempts) {
      const pct = a.total ? (a.score / a.total) * 100 : 0;
      topikScores.push(pct);
      stTopik.push(pct);
      topikN++;
      const key = a.test?.type || "Boshqa";
      const cur = bySection.get(key) ?? { n: 0, sum: 0 };
      cur.n++;
      cur.sum += pct;
      bySection.set(key, cur);
    }
    for (const w of u.topikWritingAttempts) { topikWritingN++; if (typeof w.score === "number") topikWritingScores.push(w.score); }
    for (const w of u.writingAttempts) { darsWritingN++; if (typeof w.score === "number") darsWritingScores.push(w.score); }

    return {
      id: u.id, name: u.name, email: u.email, xp: u.xp, stars: u.stars, streak: u.streak,
      topikLevel: u.topikLevel, lastActive: u.updatedAt.toISOString(),
      unitsDone, percent: unitsTotal ? Math.round((unitsDone / unitsTotal) * 100) : 0, started: u.darsProgress.length > 0,
      examBest: best, examAttempts: stAttempts,
      topikN: stTopik.length, topikAvg: avg(stTopik),
      writingN: u.topikWritingAttempts.length + u.writingAttempts.length,
      homeworkN: u.homeworkDones.length,
    };
  });

  let bookCount = 0;
  for (const c of bookCats) bookCount += c._count;

  return {
    unitsTotal,
    dars: {
      started,
      unitsCompleted,
      avgPercent: avg(students.map(s => s.percent)),
      exams: { bests: examBests, attempts: examAttempts },
    },
    topik: {
      attempts: topikN,
      avg: avg(topikScores),
      bySection: [...bySection.entries()]
        .map(([type, v]) => ({ type, n: v.n, avg: Math.round(v.sum / v.n) }))
        .sort((a, b) => b.n - a.n),
      levels: levels.map(l => ({ level: l.topikLevel || "Belgilanmagan", n: l._count })),
    },
    yozish: {
      topik: { n: topikWritingN, avg: avg(topikWritingScores) },
      dars: { n: darsWritingN, avg: avg(darsWritingScores) },
    },
    books: {
      count: bookCount,
      byCategory: bookCats.map(c => ({ category: c.category, n: c._count })),
    },
    homework: { done: homeworkDone },
    courses: { completedLessons, enrollments },
    students: students.sort((a, b) => b.percent - a.percent || b.xp - a.xp),
  };
}

// GET /api/stats — ochiq: faqat hisoblagichlar; admin uchun — to'liq ma'lumot (users, admissions...)
export async function GET(req: Request) {
  const admin = isAdminReq(req);
  try {
    const [students, teachers, courses, lessons, tests, attempts] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.course.count(),
      prisma.lesson.count(),
      prisma.test.count(),
      prisma.testAttempt.count(),
    ]);

    if (!admin) {
      return Response.json({ db: true, students, teachers, courses, lessons, tests, attempts });
    }

    const [users, admissions, recentCourses] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.admission.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.course.findMany({
        select: { id: true, title: true, createdAt: true, _count: { select: { lessons: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

    // oylik registratsiyalar (oxirgi 6 oy, haqiqiy)
    const byMonth: { name: string; users: number }[] = [];
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("uz-UZ", { month: "short" });
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const c = await prisma.user.count({ where: { createdAt: { gte: start, lt: end } } });
      byMonth.push({ name: fmt.format(start), users: c });
    }

    const learning = await buildLearningStats();

    return Response.json({ db: true, students, teachers, courses, lessons, tests, attempts, users, admissions, recentCourses, byMonth, learning });
  } catch (e) {
    console.error("GET /api/stats", e);
    return Response.json({ db: false, students: 0, teachers: 0, courses: 0, lessons: 0, tests: 0, attempts: 0 });
  }
}
