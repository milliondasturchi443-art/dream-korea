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
    if (email) { const u = await prisma.user.findUnique({ where: { email: normalizeEmail(email) }, select: { id: true, role: true, email: true } }); if (u) { id = u.id; role = String(u.role); email = u.email; } }
    else if (id) { const u = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, email: true } }); if (u) { id = u.id; role = String(u.role); email = u.email; } }
  } catch {}
  return { id, email, role };
}

// GET /api/homework?groupId=  — teacher: own groups; student: where member; admin: all
export async function GET(req: Request) {
  const auth = await getAuth(req);
  if (!auth) return Response.json({ error: "Auth kerak" }, { status: 401 });
  const groupId = new URL(req.url).searchParams.get("groupId")?.trim() || "";
  try {
    if (auth.role === "ADMIN") {
      const items = await prisma.homework.findMany({
        where: groupId ? { groupId } : undefined,
        include: { group: { select: { id: true, name: true } }, teacher: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" }, take: 100,
      });
      return Response.json({ items });
    }
    if (auth.role === "TEACHER") {
      const own = (await prisma.group.findMany({ where: { teacherId: auth.id }, select: { id: true } })).map(g => g.id);
      // chiqargan bug: groupId berilsa ham faqat O'Z guruhini ko'rish — begona guruhga kirish mumkin emas
      if (groupId && !own.includes(groupId)) return Response.json({ error: "Bu guruh sizniki emas" }, { status: 403 });
      const mine = groupId ? [groupId] : own;
      if (mine.length === 0) return Response.json({ items: [] });
      // teacher ichida ham teacher include qilinadi — aks holda sahifada h.teacher.name TypeError (qulaydi)
      const items = await prisma.homework.findMany({ where: { groupId: { in: mine } } as never, include: { group: { select: { id: true, name: true } }, teacher: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
      return Response.json({ items });
    }
    // STUDENT — faqat a'zo bo'lgan guruhlar
    const memberships = await prisma.groupMember.findMany({ where: { userId: auth.id }, select: { groupId: true } });
    const myIds = new Set(memberships.map(m => m.groupId));
    if (groupId && !myIds.has(groupId)) return Response.json({ error: "Bu guruhga ruxsat yo'q" }, { status: 403 });
    const ids = groupId ? [groupId] : [...myIds];
    if (ids.length === 0) return Response.json({ items: [] });
    const items = await prisma.homework.findMany({ where: { groupId: { in: ids } } as never, include: { group: { select: { id: true, name: true } }, teacher: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
    return Response.json({ items });
  } catch (e) { console.error("GET homework", e); return Response.json({ items: [] }); }
}

// POST /api/homework — teacher/admin creates homework for group
export async function POST(req: Request) {
  const auth = await getAuth(req);
  if (!auth || (auth.role !== "TEACHER" && auth.role !== "ADMIN")) return Response.json({ error: "Faqat ustoz" }, { status: 403 });
  let body: { groupId?: string; title?: string; description?: string; dueDate?: string } = {};
  try { body = await req.json(); } catch {}
  const groupId = String(body.groupId ?? "").trim();
  const title = String(body.title ?? "").trim();
  if (!groupId || !title) return Response.json({ error: "Guruh va mavzu kiriting" }, { status: 400 });
  if (auth.role === "TEACHER") {
    const g = await prisma.group.findUnique({ where: { id: groupId }, select: { teacherId: true } });
    if (!g || String(g.teacherId ?? "") !== auth.id) return Response.json({ error: "Bu guruh sizniki emas" }, { status: 403 });
  }
  try {
    const hw = await prisma.homework.create({
      data: { groupId, teacherId: auth.id, title, description: body.description ? String(body.description).trim() : undefined, dueDate: body.dueDate ? String(body.dueDate).trim() : undefined },
    });
    // уведомления ученикам группы
    try {
      const members = await prisma.groupMember.findMany({ where: { groupId }, select: { userId: true } });
      for (const m of members) {
        await prisma.notification.create({ data: { userId: m.userId, title: `Yangi uy vazifasi: ${title}`, body: `${hw.dueDate ? `Topshirish: ${hw.dueDate}. ` : ""}${(body.description ?? "").slice(0, 120)}` } }).catch(()=>{});
      }
    } catch {}
    return Response.json({ ok: true, item: hw });
  } catch (e) { console.error("POST homework", e); return Response.json({ error: "Saqlab bo'lmadi" }, { status: 500 }); }
}
