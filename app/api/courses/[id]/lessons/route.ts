import { prisma } from "@/lib/db";
import { verify } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";
export const dynamic = "force-dynamic";

function requireAdmin(req: Request) {
  const t = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/, "");
  const d = verify(t) as Record<string, unknown> | null;
  return !!d && d.role === "ADMIN" && isAdminEmail(String(d.email ?? ""));
}

// POST /api/courses/[id]/lessons — добавить урок в конец (ADMIN, sequential order)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  const { id: courseId } = await params;
  let b: { title?: string; duration?: string; videoUrl?: string; content?: string } = {};
  try { b = await req.json(); } catch {}
  const title = String(b.title ?? "").trim();
  if (!title) return Response.json({ error: "Dars nomi kiriting" }, { status: 400 });
  try {
    const last = await prisma.lesson.findFirst({ where: { courseId }, orderBy: { order: "desc" } });
    const order = (last?.order ?? 0) + 1;
    const l = await prisma.lesson.create({ data: { courseId, order, title, duration: String(b.duration ?? "15 daq").trim() || "15 daq", videoUrl: b.videoUrl ? String(b.videoUrl).trim() : null, content: b.content ? String(b.content).trim() : null } });
    return Response.json({ id: l.id, order: l.order, ok: true });
  } catch (e) {
    console.error("POST lessons", e);
    return Response.json({ error: "Qo‘shib bo‘lmadi" }, { status: 500 });
  }
}

// DELETE ?lessonId= — удалить урок (ADMIN)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  const { id: courseId } = await params;
  const url = new URL(req.url);
  const lessonId = url.searchParams.get("lessonId") ?? "";
  if (!lessonId) return Response.json({ error: "lessonId kerak" }, { status: 400 });
  try {
    await prisma.lesson.delete({ where: { id: lessonId } });
    // перенумеровать order
    const lessons = await prisma.lesson.findMany({ where: { courseId }, orderBy: { order: "asc" } });
    for (let i = 0; i < lessons.length; i++) {
      if (lessons[i].order !== i + 1) await prisma.lesson.update({ where: { id: lessons[i].id }, data: { order: i + 1 } });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE lesson", e);
    return Response.json({ error: "O‘chirib bo‘lmadi" }, { status: 500 });
  }
}
