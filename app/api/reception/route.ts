import { prisma } from "@/lib/db";
import { darsUser } from "@/lib/dars-auth";
import { ensureStudentAccount, findStudentByPhone, normalizeReceptionTime } from "@/lib/reception-student";
import { z } from "zod";
export const dynamic = "force-dynamic";

const PURPOSES = ["TOPIK", "Koreada o'qish", "Ishlash", "Sayohat"] as const;
const PLANS = ["Til kursi", "Kolleg", "Bakalavr", "Magistr"] as const;
const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"] as const;
const OBJECTID = /^[a-f\d]{24}$/i;

const createSchema = z.object({
  name: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(7).max(30),
  days: z.array(z.enum(DAYS)).min(1),
  time: z.string().trim().min(3).max(20), // "13:30" yoki "10:00 - 12:00" — normalizeReceptionTime tekshiradi
  teacherId: z.string().regex(OBJECTID).optional().nullable(),
  groupId: z.string().regex(OBJECTID).optional().nullable(),
  note: z.string().max(500).optional(),
  address: z.string().trim().max(300).optional(),
  parentName: z.string().trim().max(150).optional(),
  parentPhone: z.string().trim().max(30).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  purpose: z.array(z.enum(PURPOSES)).max(PURPOSES.length).optional(),
  plan: z.enum(PLANS).optional(),
});

// PATCH: holat o'zgarishi (status) VA/yoki to'liq tahrirlash — barcha maydonlar ixtiyoriy
const patchSchema = z.object({
  id: z.string().regex(OBJECTID),
  status: z.enum(["new", "contacted", "enrolled"]).optional(),
  name: z.string().trim().min(2).max(150).optional(),
  phone: z.string().trim().min(7).max(30).optional(),
  days: z.array(z.enum(DAYS)).min(1).optional(),
  time: z.string().trim().min(3).max(20).optional(),
  teacherId: z.string().regex(OBJECTID).nullable().optional(),
  groupId: z.string().regex(OBJECTID).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
  parentName: z.string().trim().max(150).nullable().optional(),
  parentPhone: z.string().trim().max(30).nullable().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  purpose: z.array(z.enum(PURPOSES)).optional(),
  plan: z.enum(PLANS).nullable().optional(),
});

const include = { teacher: { select: { name: true } }, group: { select: { name: true } } } as const;

export async function GET(req: Request) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  try {
    // 300+ talaba ham ko'rinsin — limit kengaytirildi
    const items = await prisma.reception.findMany({ include, orderBy: { createdAt: "desc" }, take: 1000 });
    return Response.json({ items });
  } catch { return Response.json({ error: "Yuklab bo'lmadi" }, { status: 503 }); }
}

export async function POST(req: Request) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Ma'lumotlar noto'g'ri (Ism, telefon, kunlar, vaqt majburiy)" }, { status: 400 });
  const { name, phone, days, time, teacherId, groupId, note, address, parentName, parentPhone, startDate, purpose, plan } = parsed.data;
  // Vaqt aynan kiriterilganidek saqlanadi (13:30 → 13:30); xato format — 400
  const timeNorm = normalizeReceptionTime(time);
  if (!timeNorm) return Response.json({ error: "Dars vaqti noto'g'ri (masalan 13:30 yoki 10:00 - 12:00)" }, { status: 400 });
  if (groupId) {
    const g = await prisma.group.findUnique({ where: { id: groupId }, select: { teacherId: true } });
    if (!g) return Response.json({ error: "Guruh topilmadi" }, { status: 404 });
    if (teacherId && g.teacherId !== teacherId) return Response.json({ error: "Guruh tanlangan o'qituvchiga tegishli emas" }, { status: 400 });
  }
  try {
    const item = await prisma.reception.create({ data: {
      name, phone, days: days.join(","), time: timeNorm,
      teacherId: teacherId ?? null, groupId: groupId ?? null, note: note ?? null,
      address: address || null, parentName: parentName || null, parentPhone: parentPhone || null,
      startDate: startDate || null,
      purpose: purpose && purpose.length ? purpose.join(",") : null,
      plan: plan || null,
    } });
    // Talaba uchun hisob avtomatik yaratiladi: email dreamkoreastudentNNNN@gmail.com + tasodifiy parol.
    // Hisob yaratilsa ham, qabul qilinmaguncha talaba tizimga kira olmaydi (status ≠ enrolled).
    let account: { email: string; password: string | null; existing: boolean } | null = null;
    try {
      const acc = await ensureStudentAccount(name, phone);
      if (acc) account = { email: acc.email, password: acc.password, existing: acc.existing };
    } catch (e) { console.error("reception auto-account error", e); }
    return Response.json({ ok: true, item, account }, { status: 201 });
  } catch { return Response.json({ error: "Saqlab bo'lmadi" }, { status: 503 }); }
}

// Enroll: find-or-create student by phone, add to teacher's group.
async function enroll(item: { id: string; name: string; phone: string; days: string; teacherId: string | null; groupId: string | null }) {
  type EnrollResult =
    | { ok: true; student: { id: string; email: string }; tempPassword: string | null; groupId: string; groupName: string | null; added: boolean }
    | { ok: false; error: string; student?: { id: string; email: string }; tempPassword?: string | null };
  // 1. Qabul paytida yaratilgan hisob (yoki oldin mavjud) — telefon bo'yicha topiladi
  const acc = await ensureStudentAccount(item.name, item.phone);
  if (!acc) return { ok: false, error: "Hisob yaratib bo'lmadi" } as EnrollResult;
  const student = { id: acc.id, email: acc.email };
  const tempPassword = acc.password;
  // 3. Resolve group: chosen → teacher's first → auto-create with generated name
  let groupId = item.groupId;
  let groupName: string | null = null;
  if (!groupId && item.teacherId) {
    const g = await prisma.group.findFirst({ where: { teacherId: item.teacherId }, select: { id: true, name: true }, orderBy: { createdAt: "asc" } });
    if (g) { groupId = g.id; groupName = g.name; }
  }
  if (!groupId) {
    // Auto-create group with generated name: "<teacher> guruh N" (or "<days> guruh N")
    const count = item.teacherId
      ? await prisma.group.count({ where: { teacherId: item.teacherId } })
      : await prisma.group.count();
    const label = item.teacherId
      ? ((await prisma.user.findUnique({ where: { id: item.teacherId }, select: { name: true } }))?.name ?? "Yangi")
      : item.days.split(",")[0];
    const name = `${label} guruh ${count + 1}`;
    const created = await prisma.group.create({ data: { name, teacherId: item.teacherId } });
    groupId = created.id;
    groupName = created.name;
    await prisma.reception.update({ where: { id: item.id }, data: { groupId } }).catch(() => {});
  }
  let added = false;
  try {
    await prisma.groupMember.create({ data: { groupId, userId: student.id } });
    added = true;
  } catch { added = false; } // already a member
  return { ok: true, student, tempPassword, groupId, groupName, added } as EnrollResult;
}

export async function PATCH(req: Request) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  const { id, status } = parsed.data;
  try {
    const before = await prisma.reception.findUnique({ where: { id } });
    if (!before) return Response.json({ error: "Topilmadi" }, { status: 404 });

    // ——— Tahrirlash: faqat yuborilgan maydonlar yangilanadi (qolgani o'zgarmaydi) ———
    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone;
    if (parsed.data.days !== undefined) data.days = parsed.data.days.join(",");
    if (parsed.data.note !== undefined) data.note = parsed.data.note;
    if (parsed.data.address !== undefined) data.address = parsed.data.address;
    if (parsed.data.parentName !== undefined) data.parentName = parsed.data.parentName;
    if (parsed.data.parentPhone !== undefined) data.parentPhone = parsed.data.parentPhone;
    if (parsed.data.startDate !== undefined) data.startDate = parsed.data.startDate;
    if (parsed.data.purpose !== undefined) data.purpose = parsed.data.purpose.length ? parsed.data.purpose.join(",") : null;
    if (parsed.data.plan !== undefined) data.plan = parsed.data.plan;
    if (parsed.data.status !== undefined) data.status = parsed.data.status;
    if (parsed.data.time !== undefined) {
      const t = normalizeReceptionTime(parsed.data.time);
      if (!t) return Response.json({ error: "Dars vaqti noto'g'ri (masalan 13:30 yoki 10:00 - 12:00)" }, { status: 400 });
      data.time = t; // aynan shunday saqlanadi — vaqt mintaqasi konvertatsiya qilinmaydi
    }
    if (parsed.data.groupId !== undefined) {
      const gid = parsed.data.groupId;
      if (gid) {
        const g = await prisma.group.findUnique({ where: { id: gid }, select: { teacherId: true } });
        if (!g) return Response.json({ error: "Guruh topilmadi" }, { status: 404 });
        const tid = parsed.data.teacherId !== undefined ? parsed.data.teacherId : before.teacherId;
        if (tid && g.teacherId && g.teacherId !== tid) return Response.json({ error: "Guruh tanlangan o'qituvchiga tegishli emas" }, { status: 400 });
        // ustoz ko'rsatilmagan bo'lsa — guruh ustozi bilan sinxronlaymiz (kartochkada ham ko'rinadi)
        if (parsed.data.teacherId === undefined) data.teacherId = g.teacherId ?? null;
      } else {
        data.groupId = null;
      }
      data.groupId = gid;
    }
    if (parsed.data.teacherId !== undefined) data.teacherId = parsed.data.teacherId;

    const hasChanges = Object.keys(data).length > 0;
    if (!hasChanges && !status) return Response.json({ ok: true, item: before });

    const item = await prisma.reception.update({ where: { id }, data, include });
    let warn: string | undefined;
    let enrolled: { email: string; tempPassword: string | null; added: boolean; groupName: string | null } | undefined;

    if (status === "enrolled" && before.status !== "enrolled") {
      // "Yozildi" — talaba guruhga qo'shiladi (avval tahrirlangan ma'lumotlar bazada)
      const r = await enroll({ id, name: item.name, phone: item.phone, days: item.days, teacherId: item.teacherId, groupId: item.groupId });
      const item2 = await prisma.reception.findUnique({ where: { id }, include });
      if (!r.ok) return Response.json({ ok: true, item: item2, warn: r.error, created: r.student ? { email: r.student.email, tempPassword: r.tempPassword } : undefined });
      enrolled = { email: r.student.email, tempPassword: r.tempPassword, added: r.added, groupName: r.groupName };
      return Response.json({ ok: true, item: item2, enrolled });
    }

    // ——— Guruhni almashtirish: o'quvchi allaqachon "yozilgan" bo'lsa — a'zolik yangi guruhga ko'chiriladi ———
    if (before.status === "enrolled" && parsed.data.groupId !== undefined && (before.groupId ?? null) !== (item.groupId ?? null)) {
      try {
        // telefon o'zgargan bo'lsa — avval talaba hisobining telefonini yangilaymiz (eski telefon bo'yicha topamiz)
        if (parsed.data.phone !== undefined && parsed.data.phone !== before.phone) {
          const oldAcc = await findStudentByPhone(before.phone);
          if (oldAcc) {
            const tail = parsed.data.phone.replace(/\D/g, "").slice(-9) || null;
            await prisma.user.update({ where: { id: oldAcc.id }, data: { phone: parsed.data.phone, phoneKey: tail } }).catch(() => {});
          }
        }
        const acc = await ensureStudentAccount(item.name, item.phone);
        if (!acc) {
          warn = "O'quvchi hisobi topilmadi — guruh o'zgarmadi";
        } else {
          if (before.groupId) await prisma.groupMember.deleteMany({ where: { groupId: before.groupId, userId: acc.id } }).catch(() => {});
          if (item.groupId) {
            try { await prisma.groupMember.create({ data: { groupId: item.groupId, userId: acc.id } }); }
            catch { /* allaqachon a'zo */ }
          }
        }
      } catch (e) {
        console.error("reception group move", e);
        warn = "Guruhni almashtirib bo'lmadi";
      }
    }

    const final = await prisma.reception.findUnique({ where: { id }, include });
    return Response.json({ ok: true, item: final, warn });
  } catch { return Response.json({ error: "Saqlab bo'lmadi" }, { status: 503 }); }
}

export async function DELETE(req: Request) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const id = (new URL(req.url).searchParams.get("id") || "").trim();
  if (!/^[a-f\d]{24}$/i.test(id)) return Response.json({ error: "Noto'g'ri id" }, { status: 400 });
  try { await prisma.reception.delete({ where: { id } }); return Response.json({ ok: true }); }
  catch { return Response.json({ error: "O'chirib bo'lmadi" }, { status: 503 }); }
}
