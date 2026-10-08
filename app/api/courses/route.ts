import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PALETTE = [
  "from-[#1e3a8a] to-[#3b82f6]",
  "from-[#0f766e] to-[#06b6d4]",
  "from-[#7c3aed] to-[#a855f7]",
  "from-[#be123c] to-[#f43f5e]",
  "from-[#0c4a6e] to-[#0284c7]",
  "from-[#14532d] to-[#22c55e]",
];

function requireAdmin(req: Request): boolean {
  const t = readAuthToken(req);
  const d = verify(t) as Record<string, unknown> | null;
  return !!d && d.role === "ADMIN" && isAdminEmail(String(d.email ?? ""));
}

// GET /api/courses — для студентов (все курсы, бесплатные), с количеством уроков
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: { _count: { select: { lessons: true } } },
      orderBy: { createdAt: "asc" },
    });
    return Response.json({
      courses: courses.map((c, i) => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle ?? "",
        level: c.level,
        description: c.description ?? "",
        teacher: c.teacherName ?? "Administrator",
        lessons: c._count.lessons,
        price: "Bepul",
        priceNum: 0,
        color: PALETTE[i % PALETTE.length],
      })),
    });
  } catch (e) {
    console.error("GET /api/courses", e);
    return Response.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// POST /api/courses — создать курс (ADMIN)
export async function POST(req: Request) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  let body: { title?: string; subtitle?: string; level?: string; description?: string; teacherName?: string } = {};
  try { body = await req.json(); } catch {}
  const title = String(body.title ?? "").trim();
  if (!title) return Response.json({ error: "Sarlavha kiriting" }, { status: 400 });
  try {
    const c = await prisma.course.create({
      data: {
        title,
        subtitle: String(body.subtitle ?? "").trim() || null,
        level: String(body.level ?? "A1").trim() || "A1",
        description: String(body.description ?? "").trim() || null,
        teacherName: String(body.teacherName ?? "Administrator").trim() || "Administrator",
        price: 0,
      },
    });
    return Response.json({ id: c.id, ok: true });
  } catch (e) {
    console.error("POST /api/courses", e);
    return Response.json({ error: "Yaratib bo‘lmadi" }, { status: 500 });
  }
}
