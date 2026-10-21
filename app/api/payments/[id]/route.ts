import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { normalizeEmail } from "@/lib/auth";
export const dynamic = "force-dynamic";

async function getAuth(req: Request) {
  const t = readAuthToken(req);
  const d = verify(t);
  if (!d) return null;
  let email = String(d.email ?? ""), id = d.id ? String(d.id) : "", role = String(d.role ?? "");
  try {
    if (email) {
      const u = await prisma.user.findUnique({ where: { email: normalizeEmail(email) }, select: { id: true, role: true, email: true } });
      if (u) { id = u.id; role = String(u.role); email = u.email; }
    } else if (id) {
      const u = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, email: true } });
      if (u) { id = u.id; role = String(u.role); email = u.email; }
    }
  } catch {}
  return { id, email, role };
}

// DELETE /api/payments/[id] — to'lovni o'chirish (faqat ADMIN, moliyaviy yozuv)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(req);
  if (!auth || auth.role !== "ADMIN") return Response.json({ error: "Faqat admin" }, { status: 403 });
  const { id } = await params;
  if (!id) return Response.json({ error: "id kerak" }, { status: 400 });
  try {
    const p = await prisma.payment.findUnique({ where: { id }, select: { id: true } });
    if (!p) return Response.json({ error: "To'lov topilmadi" }, { status: 404 });
    await prisma.payment.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE payment", e);
    return Response.json({ error: "O'chirib bo'lmadi" }, { status: 500 });
  }
}
