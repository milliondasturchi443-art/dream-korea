import { prisma } from "@/lib/db";
import { darsUser } from "@/lib/dars-auth";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(7).max(30),
  days: z.array(z.enum(["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"])).min(1),
  time: z.string().trim().regex(/^\d{2}:\d{2}$/),
  teacherId: z.string().regex(/^[a-f\d]{24}$/i).optional().nullable(),
  groupId: z.string().regex(/^[a-f\d]{24}$/i).optional().nullable(),
  note: z.string().max(500).optional(),
});

const include = { teacher: { select: { name: true } }, group: { select: { name: true } } } as const;

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
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Ma'lumotlar noto'g'ri (Ism, telefon, kunlar, vaqt majburiy)" }, { status: 400 });
  const { name, phone, days, time, teacherId, groupId, note } = parsed.data;
  if (groupId) {
    const g = await prisma.group.findUnique({ where: { id: groupId }, select: { teacherId: true } });
    if (!g) return Response.json({ error: "Guruh topilmadi" }, { status: 404 });
    if (teacherId && g.teacherId !== teacherId) return Response.json({ error: "Guruh tanlangan o'qituvchiga tegishli emas" }, { status: 400 });
  }
  try {
    const item = await prisma.reception.create({ data: { name, phone, days: days.join(","), time, teacherId: teacherId ?? null, groupId: groupId ?? null, note: note ?? null } });
    return Response.json({ ok: true, item }, { status: 201 });
  } catch { return Response.json({ error: "Saqlab bo'lmadi" }, { status: 503 }); }
}

const patchSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i), status: z.enum(["new", "contacted", "enrolled"]) });

// Enroll: find-or-create student by phone, add to teacher's group.
async function enroll(item: { id: string; name: string; phone: string; teacherId: string | null; groupId: string | null }) {
  const digits = item.phone.replace(/\D/g, "");
  // 1. Existing account by phone?
  let student = await prisma.user.findFirst({
    where: { OR: [{ phone: item.phone }, { phone: { contains: digits.slice(-9) } }] },
    select: { id: true, email: true },
  });
  let tempPassword: string | null = null;
  if (!student) {
    // 2. Create account: email derived from phone (unique), random password.
    tempPassword = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
    const email = `${digits}@reception.dk`;
    try {
      student = await prisma.user.create({
        data: { name: item.name, phone: item.phone, email, password: await bcrypt.hash(tempPassword, 10), role: "STUDENT", emailVerified: true },
        select: { id: true, email: true },
      });
    } catch {
      // email already taken (race) — try lookup once more
      student = await prisma.user.findFirst({ where: { email }, select: { id: true, email: true } });
      if (!student) return { error: "Hisob yaratib bo'lmadi" };
      tempPassword = null;
    }
  }
  // 3. Resolve group: chosen group → teacher's first group
  let groupId = item.groupId;
  if (!groupId && item.teacherId) {
    const g = await prisma.group.findFirst({ where: { teacherId: item.teacherId }, select: { id: true }, orderBy: { createdAt: "asc" } });
    groupId = g?.id ?? null;
  }
  if (!groupId) return { error: "Guruh aniqlanmadi — o'qituvchi va guruhni tanlang", student };
  let added = false;
  try {
    await prisma.groupMember.create({ data: { groupId, userId: student.id } });
    added = true;
  } catch { added = false; } // already a member
  return { student, tempPassword, groupId, added };
}

export async function PATCH(req: Request) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  try {
    const before = await prisma.reception.findUnique({ where: { id: parsed.data.id } });
    if (!before) return Response.json({ error: "Topilmadi" }, { status: 404 });
    const item = await prisma.reception.update({ where: { id: before.id }, data: { status: parsed.data.status }, include });
    if (parsed.data.status === "enrolled" && before.status !== "enrolled") {
      const r = await enroll({ id: before.id, name: before.name, phone: before.phone, teacherId: before.teacherId, groupId: before.groupId });
      if (r.error) return Response.json({ ok: true, item, warn: r.error, created: r.student ? { email: r.student.email, tempPassword: r.tempPassword } : undefined });
      return Response.json({ ok: true, item, enrolled: { email: r.student!.email, tempPassword: r.tempPassword, added: r.added } });
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
