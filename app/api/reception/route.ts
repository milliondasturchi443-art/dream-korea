import { prisma } from "@/lib/db";
import { darsUser } from "@/lib/dars-auth";
import { z } from "zod";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(7).max(30),
  days: z.array(z.enum(["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"])).min(1),
  time: z.string().trim().regex(/^\d{2}:\d{2}$/),
  teacherId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  note: z.string().max(500).optional(),
});

export async function GET(req: Request) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  try {
    const items = await prisma.reception.findMany({ include: { teacher: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 200 });
    return Response.json({ items });
  } catch { return Response.json({ error: "Yuklab bo'lmadi" }, { status: 503 }); }
}

export async function POST(req: Request) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Ma'lumotlar noto'g'ri (Ism, telefon, kunlar, vaqt majburiy)" }, { status: 400 });
  const { name, phone, days, time, teacherId, note } = parsed.data;
  if (teacherId) {
    const t = await prisma.user.findUnique({ where: { id: teacherId }, select: { role: true } });
    if (!t || t.role !== "TEACHER") return Response.json({ error: "O'qituvchi topilmadi" }, { status: 404 });
  }
  try {
    const item = await prisma.reception.create({ data: { name, phone, days: days.join(","), time, teacherId: teacherId ?? null, note: note ?? null } });
    return Response.json({ ok: true, item }, { status: 201 });
  } catch { return Response.json({ error: "Saqlab bo'lmadi" }, { status: 503 }); }
}

const patchSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i), status: z.enum(["new", "contacted", "enrolled"]) });

export async function PATCH(req: Request) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  try {
    await prisma.reception.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
    return Response.json({ ok: true });
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
