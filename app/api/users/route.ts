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

// GET /api/users?q= — ro'yxat (ADMIN o'qiydi, TEACHER faqat o'qiydi)
export async function GET(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const d = verify(token);
  const role = d ? String(d.role ?? "") : "";
  const emailOk = d ? isAdminEmail(String(d.email ?? "")) : false;
  if (!d || !emailOk || (role !== "ADMIN" && role !== "TEACHER")) {
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }
  const q = (new URL(req.url).searchParams.get("q") || "").trim().toLowerCase();
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, phone: true, role: true, topikLevel: true, createdAt: true,
        _count: { select: { lessonProgress: true, testAttempts: true, enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
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
