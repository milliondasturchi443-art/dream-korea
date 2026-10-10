import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

function requireAdmin(req: Request) {
  const token = readAuthToken(req);
  const d = verify(token);
  if (!d || d.role !== "ADMIN" || !isAdminEmail(String(d.email ?? ""))) return null;
  return d;
}

// GET /api/users?q= — ro'yxat (ADMIN o'qiydi, TEACHER faqat o'qiydi)
export async function GET(req: Request) {
  const token = readAuthToken(req);
  const d = verify(token);
  const role = d ? String(d.role ?? "") : "";
  const emailOk = d ? isAdminEmail(String(d.email ?? "")) : false;
  // TEACHER: o'qish uchun (to'lov qo'shishda o'quvchi qidiradi) — email talab qilinmaydi
  // ADMIN: faqat env-aman email
  if (!d || (role !== "TEACHER" && !(role === "ADMIN" && emailOk))) {
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }
  const q = (new URL(req.url).searchParams.get("q") || "").trim().toLowerCase();
  try {
    // TEACHER — faqat o'zi dars beradigan guruhlar a'zolarini ko'ra oladi
    let scopedIds: Set<string> | null = null;
    if (role === "TEACHER") {
      let resolvedId = String((d as Record<string, unknown>).id ?? "");
      try {
        const em = String((d as Record<string, unknown>).email ?? "").trim();
        if (em) {
          const { normalizeEmail } = await import("@/lib/auth");
          const u = await prisma.user.findUnique({ where: { email: normalizeEmail(em) }, select: { id: true } });
          if (u) resolvedId = u.id;
        }
      } catch {}
      const own = await prisma.group.findMany({ where: { teacherId: resolvedId }, select: { id: true } }).catch(() => []);
      const gids = (own as { id: string }[]).map(g => g.id);
      if (gids.length === 0) return Response.json({ users: [] });
      const mems = await prisma.groupMember.findMany({ where: { groupId: { in: gids } }, select: { userId: true } }).catch(() => []);
      const ids = (mems as { userId: string }[]).map(m => m.userId);
      if (ids.length === 0) return Response.json({ users: [] });
      scopedIds = new Set(ids);
    }
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, phone: true, role: true, topikLevel: true, createdAt: true,
        _count: { select: { lessonProgress: true, testAttempts: true, enrollments: true } },
      },
      where: scopedIds ? { id: { in: [...scopedIds] } } : undefined,
      orderBy: { createdAt: "desc" },
      take: scopedIds ? 300 : 300,
    });
    const filtered = q
      ? users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || "").includes(q))
      : users;
    return Response.json({ users: filtered });
  } catch (e) {
    console.error("GET /api/users", e);
    return Response.json({ error: "Server xatosi — foydalanuvchilar yuklanmadi" }, { status: 500 });
  }
}
