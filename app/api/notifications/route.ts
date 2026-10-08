import { prisma } from "@/lib/db";
import { verify } from "@/lib/token";

export const dynamic = "force-dynamic";

function auth(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const d = verify(token);
  if (!d) return null;
  return { id: String(d.id ?? ""), email: String(d.email ?? "") };
}

// GET /api/notifications — o'z bildirishnomalari (login talab qilinadi)
export async function GET(req: Request) {
  const me = auth(req);
  if (!me) return Response.json({ error: "Token yaroqsiz" }, { status: 401 });
  try {
    let userId = me.id;
    if (!userId) {
      const u = await prisma.user.findUnique({ where: { email: me.email }, select: { id: true } });
      userId = u?.id ?? "";
    }
    if (!userId) return Response.json({ items: [] });
    const items = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return Response.json({ items });
  } catch (e) {
    console.error("GET /api/notifications", e);
    return Response.json({ items: [] });
  }
}
