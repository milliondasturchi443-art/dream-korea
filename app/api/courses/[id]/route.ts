import { prisma } from "@/lib/db";
import { verify } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";
export const dynamic = "force-dynamic";

function isAdmin(req: Request) {
  const t = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/, "");
  const d = verify(t) as Record<string, unknown> | null;
  return !!d && d.role === "ADMIN" && isAdminEmail(String(d.email ?? ""));
}

// GET /api/courses/[id] — детали + уроки (последовательные)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const c = await prisma.course.findUnique({ where: { id }, include: { lessons: { orderBy: { order: "asc" } } } });
    if (!c) return Response.json({ error: "Topilmadi" }, { status: 404 });
    return Response.json({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle ?? "",
      level: c.level,
      description: c.description ?? "",
      teacher: c.teacherName ?? "Administrator",
      price: "Bepul",
      lessons: c.lessons.map(l => ({ id: l.id, order: l.order, title: l.title, duration: l.duration ?? "—", videoUrl: l.videoUrl ?? "", content: l.content ?? "" })),
    });
  } catch (e) {
    console.error("GET /api/courses/[id]", e);
    return Response.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// PATCH — обновить курс (ADMIN)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  const { id } = await params;
  let b: Record<string, string> = {};
  try { b = await req.json(); } catch {}
  try {
    const c = await prisma.course.update({ where: { id }, data: {
      title: b.title != null ? String(b.title).trim() : undefined,
      subtitle: b.subtitle != null ? String(b.subtitle).trim() || null : undefined,
      level: b.level != null ? String(b.level).trim() : undefined,
      description: b.description != null ? String(b.description).trim() || null : undefined,
      teacherName: b.teacherName != null ? String(b.teacherName).trim() : undefined,
    }});
    return Response.json({ ok: true, id: c.id });
  } catch (e) {
    console.error("PATCH /api/courses/[id]", e);
    return Response.json({ error: "Yangilab bo‘lmadi" }, { status: 500 });
  }
}

// DELETE — удалить курс + уроки (ADMIN)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  const { id } = await params;
  try {
    await prisma.lesson.deleteMany({ where: { courseId: id } });
    await prisma.course.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/courses/[id]", e);
    return Response.json({ error: "O‘chirib bo‘lmadi" }, { status: 500 });
  }
}
