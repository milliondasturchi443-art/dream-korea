import { prisma } from "@/lib/db";
import { darsUser } from "@/lib/dars-auth";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import crypto from "node:crypto";
export const dynamic = "force-dynamic";

const PURPOSES = ["TOPIK", "Koreada o'qish", "Ishlash", "Sayohat"] as const;
const PLANS = ["Til kursi", "Kolleg", "Bakalavr", "Magistr"] as const;

const createSchema = z.object({
  name: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(7).max(30),
  days: z.array(z.enum(["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"])).min(1),
  time: z.string().trim().regex(/^\d{2}:\d{2}( ?- ?\d{2}:\d{2})?$/), // "15:00" yoki "10:00 - 12:00"
  teacherId: z.string().regex(/^[a-f\d]{24}$/i).optional().nullable(),
  groupId: z.string().regex(/^[a-f\d]{24}$/i).optional().nullable(),
  note: z.string().max(500).optional(),
  address: z.string().trim().max(300).optional(),
  parentName: z.string().trim().max(150).optional(),
  parentPhone: z.string().trim().max(30).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  purpose: z.array(z.enum(PURPOSES)).max(PURPOSES.length).optional(),
  plan: z.enum(PLANS).optional(),
});

const include = { teacher: { select: { name: true } }, group: { select: { name: true } } } as const;

// ---- Talaba hisobini avtomatik yaratish (Qabul bo'limi uchun) ----
// Email: dreamkoreastudent0001@gmail.com — faqat oxirgi 4 raqam o'zgaradi.
// Parol: tasodifiy 10 belgi (admin ko'rsatadi, talaba keyin o'zgartiradi).
const STUDENT_EMAIL_PREFIX = "dreamkoreastudent";
const STUDENT_EMAIL_DOMAIN = "gmail.com";

// Keyingi bo'sh raqam: mavjud max raqam + 1 (0001, 0002, …)
async function nextStudentEmail(): Promise<string> {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: STUDENT_EMAIL_PREFIX } },
    select: { email: true },
  });
  let max = 0;
  for (const u of users) {
    const m = /^dreamkoreastudent(\d+)@/i.exec(u.email || "");
    const n = m ? parseInt(m[1], 10) : NaN;
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${STUDENT_EMAIL_PREFIX}${String(max + 1).padStart(4, "0")}@${STUDENT_EMAIL_DOMAIN}`;
}

type StudentAccount = { id: string; email: string; password: string | null; existing: boolean };

// Telefon bo'yicha mavjud talaba hisobini topadi (+998/bo'shliqlarni hisobga olgan holda)
async function findStudentByPhone(phone: string) {
  const tail = phone.replace(/\D/g, "").slice(-9);
  return prisma.user.findFirst({
    where: { OR: [{ phone }, ...(tail ? [{ phoneKey: tail }, { phone: { contains: tail } }] : [])] },
    select: { id: true, email: true },
  });
}

// Hisob yo'q bo'lsa — yangi yaratadi; bo'lsa — mavjudini qaytaradi (parol null)
async function ensureStudentAccount(name: string, phone: string): Promise<StudentAccount | null> {
  const existing = await findStudentByPhone(phone);
  if (existing) return { id: existing.id, email: existing.email, password: null, existing: true };

  const password = crypto.randomBytes(9).toString("base64url").slice(0, 10);
  const hash = await bcrypt.hash(password, 10);
  const tail = phone.replace(/\D/g, "").slice(-9) || null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const email = await nextStudentEmail();
    try {
      const u = await prisma.user.create({
        data: { name, phone, phoneKey: tail, email, password: hash, role: "STUDENT", emailVerified: true },
        select: { id: true, email: true },
      });
      return { id: u.id, email: u.email, password, existing: false };
    } catch {
      // raqam band (parallel yozuv) — kim yutdi: mavjudni qaytaramiz, aks holda keyingi raqam
      const byEmail = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
      if (byEmail) return { id: byEmail.id, email: byEmail.email, password: null, existing: true };
    }
  }
  return null;
}

export async function GET(req: Request) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  try {
    const items = await prisma.reception.findMany({ include, orderBy: { createdAt: "desc" }, take: 200 });
    return Response.json({ items });
  } catch { return Response.json({ error: "Yuklab bo'lmadi" }, { status: 503 }); }
}

export async function POST(req: Request) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Ma'lumotlar noto'g'ri (Ism, telefon, kunlar, vaqt majburiy)" }, { status: 400 });
  const { name, phone, days, time, teacherId, groupId, note, address, parentName, parentPhone, startDate, purpose, plan } = parsed.data;
  if (groupId) {
    const g = await prisma.group.findUnique({ where: { id: groupId }, select: { teacherId: true } });
    if (!g) return Response.json({ error: "Guruh topilmadi" }, { status: 404 });
    if (teacherId && g.teacherId !== teacherId) return Response.json({ error: "Guruh tanlangan o'qituvchiga tegishli emas" }, { status: 400 });
  }
  try {
    const item = await prisma.reception.create({ data: {
      name, phone, days: days.join(","), time,
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

const patchSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i), status: z.enum(["new", "contacted", "enrolled"]) });

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
  try {
    const before = await prisma.reception.findUnique({ where: { id: parsed.data.id } });
    if (!before) return Response.json({ error: "Topilmadi" }, { status: 404 });
    const item = await prisma.reception.update({ where: { id: before.id }, data: { status: parsed.data.status }, include });
    if (parsed.data.status === "enrolled" && before.status !== "enrolled") {
      const r = await enroll({ id: before.id, name: before.name, phone: before.phone, days: before.days, teacherId: before.teacherId, groupId: before.groupId });
      const item2 = await prisma.reception.findUnique({ where: { id: before.id }, include });
      if (!r.ok) return Response.json({ ok: true, item: item2, warn: r.error, created: r.student ? { email: r.student.email, tempPassword: r.tempPassword } : undefined });
      return Response.json({ ok: true, item: item2, enrolled: { email: r.student.email, tempPassword: r.tempPassword, added: r.added, groupName: r.groupName } });
    }
    return Response.json({ ok: true, item });
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
