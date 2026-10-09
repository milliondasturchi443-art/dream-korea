import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { normalizeEmail, isAdminEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getAuth(req: Request) {
  const token = readAuthToken(req);
  const d = verify(token);
  if (!d) return null;
  let email = String(d.email ?? "");
  let id = d.id ? String(d.id) : "";
  let role = String(d.role ?? "");
  try {
    if (email) {
      const u = await prisma.user.findUnique({ where: { email: normalizeEmail(email) }, select: { id: true, role: true, email: true, name: true } });
      if (u) { id = u.id; role = String(u.role); email = u.email; }
    } else if (id) {
      const u = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, email: true, name: true } });
      if (u) { id = u.id; role = String(u.role); email = u.email; }
    }
  } catch {}
  return { id, email, role };
}

function requireAdmin(a: { role: string; email: string } | null) {
  return !!a && a.role === "ADMIN" && isAdminEmail(a.email);
}

// GET /api/groups — admin: all, teacher: own, student: where member
export async function GET(req: Request) {
  const auth = await getAuth(req);
  if (!auth) return Response.json({ error: "Token yaroqsiz" }, { status: 401 });
  try {
    if (requireAdmin(auth)) {
      const groups = await prisma.group.findMany({
        include: {
          teacher: { select: { id: true, name: true, email: true } },
          members: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return Response.json({ groups });
    }
    if (auth.role === "TEACHER") {
      const groups = await prisma.group.findMany({
        where: { teacherId: auth.id },
        include: {
          teacher: { select: { id: true, name: true, email: true } },
          members: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return Response.json({ groups });
    }
    // STUDENT — guruhlari
    const memberships = await prisma.groupMember.findMany({
      where: { userId: auth.id },
      select: { groupId: true },
    });
    const ids = memberships.map(m => m.groupId);
    const groups = await prisma.group.findMany({
      where: { id: { in: ids } },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ groups });
  } catch (e) {
    console.error("GET /api/groups", e);
    return Response.json({ error: "Guruhlar yuklanmadi" }, { status: 500 });
  }
}

// POST /api/groups — ADMIN creates group, assigns teacher
export async function POST(req: Request) {
  const auth = await getAuth(req);
  if (!requireAdmin(auth!)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  let body: { name?: string; teacherId?: string } = {};
  try { body = await req.json(); } catch {}
  const name = String(body.name ?? "").trim();
  if (!name) return Response.json({ error: "Guruh nomi kiriting" }, { status: 400 });
  let teacherId: string | null = body.teacherId ? String(body.teacherId).trim() : null;
  if (teacherId) {
    try {
      const t = await prisma.user.findUnique({ where: { id: teacherId }, select: { role: true } });
      if (!t || String(t.role) !== "TEACHER") return Response.json({ error: "Ustoz topilmadi (role TEACHER kerak)" }, { status: 400 });
    } catch { return Response.json({ error: "Ustoz tekshirib bo'lmadi" }, { status: 400 }); }
  } else teacherId = null;
  try {
    const g = await prisma.group.create({ data: { name, teacherId } });
    return Response.json({ ok: true, group: g });
  } catch (e) {
    console.error("POST /api/groups", e);
    return Response.json({ error: "Yaratib bo'lmadi" }, { status: 500 });
  }
}
