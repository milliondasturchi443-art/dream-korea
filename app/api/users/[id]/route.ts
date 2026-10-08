import { prisma } from "@/lib/db";
import { verify } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

function requireAdmin(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const d = verify(token);
  if (!d || d.role !== "ADMIN" || !isAdminEmail(String(d.email ?? ""))) return null;
  return d;
}

// PATCH /api/users/[id] — rolni/nomni o'zgartirish (ADMIN)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(req);
  if (!admin) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  let body: { name?: string; role?: string; phone?: string; topikLevel?: string } = {};
  try { body = await req.json(); } catch {}
  const data: Record<string, string> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.role && ["STUDENT", "TEACHER", "ADMIN"].includes(body.role)) data.role = body.role;
  if (typeof body.phone === "string") data.phone = body.phone.trim();
  if (typeof body.topikLevel === "string") data.topikLevel = body.topikLevel;
  if (!Object.keys(data).length) return Response.json({ error: "O'zgarish kiritilmadi" }, { status: 400 });
  try {
    const u = await prisma.user.update({ where: { id }, data });
    return Response.json({ ok: true, user: { id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone } });
  } catch (e) {
    console.error("PATCH /api/users/[id]", e);
    return Response.json({ error: "Saqlab bo'lmadi" }, { status: 500 });
  }
}

// DELETE /api/users/[id] — foydalanuvchini o'chirish (ADMIN, o'zini o'chirish taqiqlanadi)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(req);
  if (!admin) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  if (admin.id && String(admin.id) === id) return Response.json({ error: "O'z hisobingizni o'chirib bo'lmaydi" }, { status: 400 });
  try {
    // bog'liq yozuvlarni avval tozalash (MongoDB)
    await prisma.enrollment.deleteMany({ where: { userId: id } });
    await prisma.lessonProgress.deleteMany({ where: { userId: id } });
    await prisma.testAttempt.deleteMany({ where: { userId: id } });
    await prisma.notification.deleteMany({ where: { userId: id } });
    await prisma.achievement.deleteMany({ where: { userId: id } });
    await prisma.certificate.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/users/[id]", e);
    return Response.json({ error: "O'chirib bo'lmadi" }, { status: 500 });
  }
}
