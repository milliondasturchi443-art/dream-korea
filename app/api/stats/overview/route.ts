import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { normalizeEmail } from "@/lib/auth";
export const dynamic = "force-dynamic";

type Auth = { id: string; role: string };

async function getAuth(req: Request): Promise<Auth | null> {
  const token = readAuthToken(req);
  const d = verify(token);
  if (!d) return null;
  let email = String(d.email ?? ""), id = d.id ? String(d.id) : "", role = String(d.role ?? "");
  try {
    if (email) { const u = await prisma.user.findUnique({ where: { email: normalizeEmail(email) }, select: { id: true, role: true } }); if (u) { id = u.id; role = String(u.role); } }
  } catch {}
  return { id, role };
}

// GET /api/stats/overview — sayt statistikasi + guruh ishtirokchilari statistikasi
// STUDENT: o'z guruhlari; TEACHER: o'z guruhlari; ADMIN: barcha guruhlar
export async function GET(req: Request) {
  const auth = await getAuth(req);
  if (!auth) return Response.json({ error: "Auth kerak" }, { status: 401 });
  try {
    // Sayt (umumiy) statistikasi
    const [students, teachers, groups, courses, lessons, tests] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.group.count(),
      prisma.course.count(),
      prisma.lesson.count(),
      prisma.test.count(),
    ]);
    const site = { students, teachers, groups, courses, lessons, tests };

    // Foydalanuvchining guruhlari
    let groupWhere: Record<string, unknown> = {};
    if (auth.role === "STUDENT") {
      const my = await prisma.groupMember.findMany({ where: { userId: auth.id }, select: { groupId: true } });
      groupWhere = { id: { in: my.map(m => m.groupId) } };
    } else if (auth.role === "TEACHER") {
      groupWhere = { teacherId: auth.id };
    } // ADMIN — bo'sh = barchasi

    const gs = await prisma.group.findMany({
      where: groupWhere as never,
      select: {
        id: true,
        name: true,
        teacher: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const groupsOut = await Promise.all(gs.map(async (g) => {
      const members = await prisma.groupMember.findMany({
        where: { groupId: g.id },
        select: { user: { select: { id: true, name: true, email: true } } },
      });
      const memberIds = members.map(m => m.user.id).filter(Boolean);
      // Har bir ishtirokchi: davomat + uy vazifasi soni
      const [attTotals, hwTotals] = await Promise.all([
        prisma.attendance.groupBy({ by: ["studentId"], where: { groupId: g.id, studentId: { in: memberIds } }, _count: { _all: true } }),
        prisma.homework.count({ where: { groupId: g.id } }),
      ]);
      const attMap = new Map<string, number>(attTotals.map((a: { studentId: string; _count: { _all: number } }) => [a.studentId, a._count._all]));
      const participants = members.map(m => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        attendance: attMap.get(m.user.id) ?? 0,
      }));
      return { id: g.id, name: g.name, teacher: g.teacher, homeworkCount: hwTotals, participants };
    }));

    return Response.json({ site, groups: groupsOut });
  } catch (e) {
    console.error("GET stats/overview", e);
    return Response.json({ error: "Statistika yuklanmadi" }, { status: 500 });
  }
}
