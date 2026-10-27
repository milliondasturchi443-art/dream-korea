import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/attendance/report?month=YYYY-MM&groupId=...
// Oylik davomat hisoboti (admin): guruhlar, o'quvchilar, kunlar kesimida.
type Row = {
  key: string;        // "groupId|studentId"
  studentId: string; name: string; email: string;
  groupId: string; groupName: string; teacherName: string;
  present: number; absent: number; days: Record<string, "PRESENT" | "ABSENT">;
};
type GroupSum = {
  id: string; name: string; teacherName: string; students: number;
  lessons: number; present: number; absent: number; percent: number | null;
};

function bad(msg: string, status = 400) { return Response.json({ error: msg }, { status }); }

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });

  const url = new URL(req.url);
  const now = new Date();
  const month = (url.searchParams.get("month") || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`).trim();
  const groupId = (url.searchParams.get("groupId") || "").trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return bad("Oy noto‘g‘ri — YYYY-MM formatida kiriting");
  if (groupId && !/^[a-f\d]{24}$/i.test(groupId)) return bad("Guruh id noto‘g‘ri");

  const from = `${month}-01`;
  const to = `${month}-31`; // string solishtirish uchun yetarli (31 har doim 30/31 kundan katta)

  try {
    // 1) Guruhlar (ixtiyoriy bitta guruh bo'yicha filtr)
    const groups = await prisma.group.findMany({
      where: groupId ? { id: groupId } : {},
      include: { teacher: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });

    // 2) A'zolar: guruhidagi barcha o'quvchilar (davomat belgilanmagan bo'lsa ham ko'rinadi)
    const members = groupId
      ? await prisma.groupMember.findMany({ where: { groupId }, include: { user: { select: { id: true, name: true, email: true } } } })
      : await prisma.groupMember.findMany({ include: { user: { select: { id: true, name: true, email: true } } } });

    // 3) Oy ichidagi davomat yozuvlari
    const att = await prisma.attendance.findMany({
      where: { date: { gte: from, lte: to }, ...(groupId ? { groupId } : {}) },
      select: { groupId: true, studentId: true, date: true, status: true },
    });

    const groupById = new Map(groups.map(g => [g.id, g]));
    const rows = new Map<string, Row>();
    for (const m of members) {
      const g = groupById.get(m.groupId);
      if (!g) continue;
      rows.set(`${m.groupId}|${m.userId}`, {
        key: `${m.groupId}|${m.userId}`,
        studentId: m.userId, name: m.user?.name || "Nomsiz", email: m.user?.email || "",
        groupId: m.groupId, groupName: g.name, teacherName: g.teacher?.name || "—",
        present: 0, absent: 0, days: {},
      });
    }
    for (const a of att) {
      const r = rows.get(`${a.groupId}|${a.studentId}`);
      if (!r) continue; // guruh a'zosi emas — chetlab o'tamiz
      const st = a.status === "ABSENT" ? "ABSENT" : "PRESENT";
      r.days[a.date] = st;
      if (st === "PRESENT") r.present++; else r.absent++;
    }

    // 4) Oy kunlari (darslar faqat belgilangan kunlar soni — oy boshidan kunlar ro'yxati)
    const [y, m] = month.split("-").map(Number);
    const dayCount = new Date(y, m, 0).getDate();
    const allDays: string[] = [];
    for (let d = 1; d <= dayCount; d++) allDays.push(`${month}-${String(d).padStart(2, "0")}`);
    // ko'rsatish uchun kunlar: kamida bitta o'quvchida belgi qo'yilgan kunlar (bo'lmasa — oyning barcha kunlari)
    const shownDays = allDays.filter(d => [...rows.values()].some(r => r.days[d]));

    const students = [...rows.values()].map(r => {
      const total = r.present + r.absent;
      return {
        id: r.studentId, name: r.name, email: r.email,
        groupId: r.groupId, groupName: r.groupName, teacherName: r.teacherName,
        present: r.present, absent: r.absent, total,
        percent: total ? Math.round((r.present / total) * 100) : null,
        days: shownDays.map(d => r.days[d] ?? null), // null = hali belgilanmagan — ustunlar `days` bilan mos
      };
    }).sort((a, b) => a.groupName.localeCompare(b.groupName) || a.name.localeCompare(b.name));

    // 5) Guruh yig'indilari
    const groupSummaries: GroupSum[] = groups.map(g => {
      const rs = [...rows.values()].filter(r => r.groupId === g.id);
      const present = rs.reduce((s, r) => s + r.present, 0);
      const absent = rs.reduce((s, r) => s + r.absent, 0);
      const total = present + absent;
      // guruhdagi darslar soni: kamida bitta o'quvchida belgi qo'yilgan kunlar
      const lessons = shownDays.filter(d => rs.some(r => r.days[d])).length;
      return {
        id: g.id, name: g.name, teacherName: g.teacher?.name || "—",
        students: rs.length, lessons,
        present, absent,
        percent: total ? Math.round((present / total) * 100) : null,
      };
    }).filter(g => g.students > 0 || !groupId);

    const totalPresent = students.reduce((s, r) => s + r.present, 0);
    const totalAbsent = students.reduce((s, r) => s + r.absent, 0);
    const totalMarks = totalPresent + totalAbsent;

    return Response.json({
      month,
      days: shownDays, // ko'rsatish uchun: faqat belgilangan kunlar (bo'lmasa — oy kunlari)
      students,
      groups: groupSummaries,
      totals: {
        students: students.length,
        groups: groupSummaries.length,
        lessons: shownDays.length,
        present: totalPresent,
        absent: totalAbsent,
        percent: totalMarks ? Math.round((totalPresent / totalMarks) * 100) : null,
      },
    });
  } catch (e) {
    console.error("attendance report error", e);
    return Response.json({ error: "Hisobotni olib bo‘lmadi" }, { status: 500 });
  }
}
