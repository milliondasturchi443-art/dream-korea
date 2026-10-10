import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { normalizeEmail } from "@/lib/auth";
export const dynamic = "force-dynamic";

async function getAuth(req: Request) {
  const token = readAuthToken(req);
  const d = verify(token);
  if (!d) return null;
  let email = String(d.email ?? ""), id = d.id ? String(d.id) : "", role = String(d.role ?? "");
  try {
    if (email) {
      const u = await prisma.user.findUnique({ where: { email: normalizeEmail(email) }, select: { id: true, role: true, email: true, name: true } });
      if (u) { id = u.id; role = String(u.role); email = u.email; }
    } else if (id) {
      const u = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, email: true, name: true } });
      if (u) { id = u.id; role = String(u.role); email = u.email; }
    }
  } catch {}
  return { id, email, role, name: d.name ? String(d.name) : "" };
}

// GET /api/attendance?groupId=&date=  — teacher/admin sees group attendance; student sees own
export async function GET(req: Request) {
  const auth = await getAuth(req);
  if (!auth) return Response.json({ error: "Auth kerak" }, { status: 401 });
  const url = new URL(req.url);
  const groupId = url.searchParams.get("groupId")?.trim() || "";
  const date = url.searchParams.get("date")?.trim() || "";
  const studentId = url.searchParams.get("studentId")?.trim() || "";
  try {
    if (auth.role === "STUDENT") {
      const where: Record<string, unknown> = { studentId: auth.id };
      if (groupId) (where as Record<string, unknown>).groupId = groupId;
      if (date) (where as Record<string, unknown>).date = date;
      const rows = await prisma.attendance.findMany({ where: where as never, orderBy: { date: "desc" }, take: 100 });
      return Response.json({ rows });
    }
    const where: Record<string, unknown> = {};
    if (groupId) where.groupId = groupId;
    if (date) where.date = date;
    if (studentId) where.studentId = studentId;
    // teacher: faqat o'z guruhlari (groupId bo'lsa ham tekshiriladi — begona guruhga kirib bo'lmaydi)
    if (auth.role === "TEACHER") {
      const mine = await prisma.group.findMany({ where: { teacherId: auth.id }, select: { id: true } });
      const ids = mine.map(g => g.id);
      if (ids.length === 0) return Response.json({ rows: [] });
      if (groupId) {
        if (!ids.includes(groupId)) return Response.json({ error: "Bu guruh sizniki emas" }, { status: 403 });
      } else {
        where.groupId = { in: ids } as unknown as string;
      }
    }
    const rows = await prisma.attendance.findMany({
      where: where as never,
      include: { student: { select: { id: true, name: true, email: true } } },
      orderBy: { date: "desc" },
      take: 200,
    });
    return Response.json({ rows });
  } catch (e) { console.error("GET attendance", e); return Response.json({ rows: [] }); }
}

// POST /api/attendance — teacher marks: { groupId, date (YYYY-MM-DD), marks: [{ studentId, status: PRESENT|ABSENT, note? }] }
export async function POST(req: Request) {
  const auth = await getAuth(req);
  if (!auth) return Response.json({ error: "Auth kerak" }, { status: 401 });
  if (auth.role !== "TEACHER" && auth.role !== "ADMIN") return Response.json({ error: "Faqat ustoz" }, { status: 403 });

  let body: { groupId?: string; date?: string; marks?: { studentId: string; status: string; note?: string }[] } = {};
  try { body = await req.json(); } catch {}
  const groupId = String(body.groupId ?? "").trim();
  const date = String(body.date ?? "").trim();
  const marks = Array.isArray(body.marks) ? body.marks : [];
  if (!groupId || !date || marks.length === 0) return Response.json({ error: "groupId, date va marks kerak" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({ error: "Sana formati YYYY-MM-DD" }, { status: 400 });

  // teacher must own group
  if (auth.role === "TEACHER") {
    const g = await prisma.group.findUnique({ where: { id: groupId }, select: { teacherId: true } });
    if (!g || String(g.teacherId ?? "") !== auth.id) return Response.json({ error: "Bu guruh sizniki emas" }, { status: 403 });
  }

  // Teacher: faqat guruhdagi talabalar — begona studentId kiritib bo'lmaydi
  let allowedIds: Set<string> | null = null;
  try {
    const mems = await prisma.groupMember.findMany({ where: { groupId }, select: { userId: true } });
    allowedIds = new Set(mems.map(m => m.userId));
  } catch {}
  try {
    // upsert each mark — faqat ruxsat berilgan talabalar uchun
    for (const m of marks) {
      const studentId = String(m.studentId ?? "").trim();
      if (!studentId) continue;
      if (allowedIds && !allowedIds.has(studentId)) continue;
      let status = String(m.status ?? "").trim().toUpperCase();
      if (status !== "PRESENT" && status !== "ABSENT") status = "ABSENT";
      await prisma.attendance.upsert({
        where: { groupId_studentId_date: { groupId, studentId, date } },
        create: { groupId, studentId, date, status, note: m.note ? String(m.note).trim() || undefined : undefined },
        update: { status, note: m.note ? String(m.note).trim() || undefined : undefined },
      });
      // Уведомление об отсутствии — сохраняем в Notification (история)
      if (status === "ABSENT") {
        try {
          await prisma.notification.create({
            data: {
              userId: studentId,
              title: "Вы пропустили занятие. Вам вынесено предупреждение.",
              body: `${date} — guruh: ${groupId}. Sababni ustozingizga xabar bering.`,
            },
          });
        } catch {}
      }
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("POST attendance", e);
    return Response.json({ error: "Saqlab bo'lmadi" }, { status: 500 });
  }
}
