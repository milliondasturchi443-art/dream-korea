import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { normalizeEmail } from "@/lib/auth";
export const dynamic = "force-dynamic";

async function getAuth(req: Request) {
  const token = readAuthToken(req);
  const d = verify(token);
  if (!d) return null;
  let email = String(d.email ?? ""), id = d.id ? String(d.id) : "";
  try {
    if (email) { const u = await prisma.user.findUnique({ where: { email: normalizeEmail(email) }, select: { id: true } }); if (u) id = u.id; }
  } catch {}
  return { id };
}

// GET /api/teacher-stats?userId=  — ustozning ochiq statistikasi (o'quvchi o'z ustozini ko'radi)
export async function GET(req: Request) {
  const auth = await getAuth(req);
  if (!auth) return Response.json({ error: "Auth kerak" }, { status: 401 });
  const userId = new URL(req.url).searchParams.get("userId")?.trim() || "";
  if (!userId) return Response.json({ error: "userId kerak" }, { status: 400 });
  try {
    const teacher = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
    if (!teacher || String(teacher.role) !== "TEACHER") return Response.json({ error: "Ustoz topilmadi" }, { status: 404 });
    const groups = await prisma.group.findMany({ where: { teacherId: userId }, select: { id: true, name: true } });
    const groupIds = groups.map(g => g.id);
    const [studentsCount, homeworkCount, attendanceCount] = await Promise.all([
      prisma.groupMember.count({ where: { groupId: { in: groupIds } } }),
      prisma.homework.count({ where: { teacherId: userId } }),
      prisma.attendance.count({ where: { groupId: { in: groupIds } } }),
    ]);
    // noyob o'quvchilar
    const mems = await prisma.groupMember.findMany({ where: { groupId: { in: groupIds } }, select: { userId: true }, distinct: ["userId"] });
    return Response.json({
      teacher: { id: teacher.id, name: teacher.name },
      groups: groups.length,
      students: mems.length,
      homework: homeworkCount,
      attendance: attendanceCount,
      groupNames: groups.map(g => g.name),
    });
  } catch (e) {
    console.error("GET teacher-stats", e);
    return Response.json({ error: "Statistika yuklanmadi" }, { status: 500 });
  }
}
