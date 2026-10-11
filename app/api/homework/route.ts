import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { normalizeEmail } from "@/lib/auth";
import { sendEmail, emailShell } from "@/lib/email";
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
        include: { group: { select: { id: true, name: true } }, teacher: { select: { id: true, name: true } }, dones: { select: { studentId: true } } },
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
      const items = await prisma.homework.findMany({ where: { groupId: { in: mine } } as never, include: { group: { select: { id: true, name: true } }, teacher: { select: { id: true, name: true } }, dones: { select: { studentId: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
      return Response.json({ items });
    }
    // STUDENT — faqat a'zo bo'lgan guruhlar
    const memberships = await prisma.groupMember.findMany({ where: { userId: auth.id }, select: { groupId: true } });
    const myIds = new Set(memberships.map(m => m.groupId));
    if (groupId && !myIds.has(groupId)) return Response.json({ error: "Bu guruhga ruxsat yo'q" }, { status: 403 });
    const ids = groupId ? [groupId] : [...myIds];
    if (ids.length === 0) return Response.json({ items: [] });
    const items = await prisma.homework.findMany({ where: { groupId: { in: ids } } as never, include: { group: { select: { id: true, name: true } }, teacher: { select: { id: true, name: true } }, dones: { select: { studentId: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
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
    // Guruh + ustoz nomini olish (bildirishnoma va email uchun)
    let groupName = "", teacherName = "";
    try {
      const g = await prisma.group.findUnique({ where: { id: groupId }, select: { name: true, teacher: { select: { name: true } } } });
      groupName = g?.name ?? "";
      teacherName = g?.teacher?.name ?? "";
    } catch {}
    const dueTxt = hw.dueDate ? `Topshirish sanasi: ${hw.dueDate}.` : "";
    const descTxt = body.description ? String(body.description).trim() : "";
    // O'quvchilarga bildirishnoma (Bildirishnoma) + email
    try {
      const members = await prisma.groupMember.findMany({
        where: { groupId },
        select: { user: { select: { id: true, email: true, name: true } } },
      });
      for (const m of members) {
        const u = m.user;
        if (!u?.id) continue;
        await prisma.notification.create({
          data: {
            userId: u.id,
            title: `Yangi uy vazifasi: ${title}`,
            body: `${groupName ? `Guruh: ${groupName}. ` : ""}${teacherName ? `Ustoz: ${teacherName}. ` : ""}${dueTxt} ${descTxt}`.trim().slice(0, 300),
          },
        }).catch(() => {});
        // Email ham yuboriladi (xato bilan to'xtamasin)
        if (u.email) {
          const rows = `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;margin:4px 0 14px;">
              <tr><td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;"><span style="color:#64748b;font-size:13px;">Mavzu</span><div style="font-weight:bold;color:#0f1b3d;margin-top:2px;">${title}</div></td></tr>
              ${groupName ? `<tr><td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;"><span style="color:#64748b;font-size:13px;">Guruh</span><div style="color:#0f1b3d;margin-top:2px;">${groupName}</div></td></tr>` : ""}
              ${teacherName ? `<tr><td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;"><span style="color:#64748b;font-size:13px;">Ustoz</span><div style="color:#0f1b3d;margin-top:2px;">${teacherName}</div></td></tr>` : ""}
              ${hw.dueDate ? `<tr><td style="padding:14px 16px;"><span style="color:#64748b;font-size:13px;">Topshirish sanasi</span><div style="color:#b45309;font-weight:bold;margin-top:2px;">${hw.dueDate}</div></td></tr>` : ""}
            </table>
            ${descTxt ? `<p style="margin:0 0 8px;font-size:14px;color:#334155;">${descTxt}</p>` : ""}`;
          const html = emailShell("Yangi uy vazifasi berildi", `Salom ${u.name ?? ""}! Ustozingiz ${groupName ? `"${groupName}"` : "guruhingizga"} yangi uy vazifasi berdi.`, rows, { label: "Bildirishnomalarni ko‘rish", url: `${(process.env.NEXTAUTH_URL || "https://dream-korea.onrender.com").replace(/\/$/, "")}/notifications` });
          sendEmail(u.email, `DREAM KOREA — uy vazifasi: ${title}`, html, `${title}. ${dueTxt}`).catch(() => {});
        }
      }
    } catch {}
    return Response.json({ ok: true, item: hw });
  } catch (e) { console.error("POST homework", e); return Response.json({ error: "Saqlab bo'lmadi" }, { status: 500 }); }
}

// PATCH /api/homework — uy vazifasini "bajarilgan" deb belgilash (Bajar gan / Bajar magan)
// body: { homeworkId, studentId?, done }  — studentId berilsa ustoz/o'zi, bo'lmasa o'zi
export async function PATCH(req: Request) {
  const auth = await getAuth(req);
  if (!auth) return Response.json({ error: "Auth kerak" }, { status: 401 });
  let body: { homeworkId?: string; studentId?: string; done?: boolean } = {};
  try { body = await req.json(); }catch {}
  const homeworkId = String(body.homeworkId ?? "").trim();
  let studentId = String(body.studentId ?? "").trim() || auth.id;
  const done = body.done !== false;
  if (!homeworkId) return Response.json({ error: "homeworkId kerak" }, { status: 400 });
  try {
    const hw = await prisma.homework.findUnique({ where: { id: homeworkId }, select: { id: true, groupId: true, teacherId: true } });
    if (!hw) return Response.json({ error: "Vazifa topilmadi" }, { status: 404 });
    // Ruxsat: faqat ustoz (guruh egasi) yoki admin belgilaydi — o'quvchi o'zini belgilay olmaydi
    if (auth.role === "STUDENT") {
      return Response.json({ error: "Uy vazifasini faqat ustoz belgilaydi" }, { status: 403 });
    } else if (auth.role === "TEACHER") {
      if (String(hw.teacherId) !== auth.id) return Response.json({ error: "Bu vazifa sizniki emas" }, { status: 403 });
    }
    if (done) {
      await prisma.homeworkDone.upsert({
        where: { homeworkId_studentId: { homeworkId, studentId } },
        create: { homeworkId, studentId },
        update: {},
      });
    } else {
      await prisma.homeworkDone.deleteMany({ where: { homeworkId, studentId } });
    }
    return Response.json({ ok: true, done });
  } catch (e) { console.error("PATCH homework", e); return Response.json({ error: "O'zgartirib bo'lmadi" }, { status: 500 }); }
}
