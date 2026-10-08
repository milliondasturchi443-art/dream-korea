import { prisma } from "@/lib/db";
import { verify } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

function isAdminReq(req: Request): boolean {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const d = verify(token);
  return !!d && d.role === "ADMIN" && isAdminEmail(String(d.email ?? ""));
}

// GET /api/stats — ochiq: faqat hisoblagichlar. Admin bo'lsa: detall + oxirgi yozuvlar.
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
      const users = await prisma.user.count({ where: { createdAt: { gte: start, lt: end } } });
      byMonth.push({ name: fmt.format(start), users });
    }

    return Response.json({ db: true, students, teachers, courses, lessons, tests, attempts, users, admissions, recentCourses, byMonth });
  } catch (e) {
    console.error("GET /api/stats", e);
    return Response.json({ db: false, students: 0, teachers: 0, courses: 0, lessons: 0, tests: 0, attempts: 0 });
  }
}
