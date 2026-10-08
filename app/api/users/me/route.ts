import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";

export const dynamic = "force-dynamic";

function auth(req: Request) {
  const token = readAuthToken(req);
  const d = verify(token);
  if (!d) return null;
  return { id: String(d.id ?? ""), email: String(d.email ?? ""), role: String(d.role ?? "STUDENT") };
}

// PATCH /api/users/me — o'z profilini yangilash (ism, telefon, topik darajasi)
export async function PATCH(req: Request) {
  const me = auth(req);
  if (!me) return Response.json({ error: "Token yaroqsiz" }, { status: 401 });
  let body: { name?: string; phone?: string; topikLevel?: string } = {};
  try { body = await req.json(); } catch {}
  const data: Record<string, string> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.phone === "string") data.phone = body.phone.trim();
  if (typeof body.topikLevel === "string") data.topikLevel = body.topikLevel;
  if (!Object.keys(data).length) return Response.json({ error: "O'zgarish kiritilmadi" }, { status: 400 });
  try {
    // id bo'lmasa email orqali topamiz (env-admin fallback'da id yo'q)
    const user = me.id
      ? await prisma.user.findUnique({ where: { id: me.id } })
      : await prisma.user.findUnique({ where: { email: me.email } });
    if (!user) return Response.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
    const u = await prisma.user.update({ where: { id: user.id }, data });
    return Response.json({ ok: true, name: u.name, phone: u.phone, topikLevel: u.topikLevel });
  } catch (e) {
    console.error("PATCH /api/users/me", e);
    return Response.json({ error: "Server xatosi" }, { status: 500 });
  }
}
