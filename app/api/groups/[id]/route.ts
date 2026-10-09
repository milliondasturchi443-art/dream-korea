import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { normalizeEmail, isAdminEmail } from "@/lib/auth";
export const dynamic = "force-dynamic";

async function getAuth(req: Request) {
  const token = readAuthToken(req);
  const d = verify(token);
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

// PATCH /api/groups/[id] — admin changes name/teacher
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(req);
  if (!auth || !(auth.role === "ADMIN" && isAdminEmail(auth.email))) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  let body: { name?: string; teacherId?: string | null } = {};
  try { body = await req.json(); } catch {}
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if ("teacherId" in body) {
    const tid = body.teacherId ? String(body.teacherId).trim() : null;
    if (tid) {
      const t = await prisma.user.findUnique({ where: { id: tid }, select: { role: true } });
      if (!t || String(t.role) !== "TEACHER") return Response.json({ error: "Ustoz topilmadi" }, { status: 400 });
      data.teacherId = tid;
    } else data.teacherId = null;
  }
  if (!Object.keys(data).length) return Response.json({ error: "O'zgarish yo'q" }, { status: 400 });
  try {
    const g = await prisma.group.update({ where: { id }, data });
    return Response.json({ ok: true, group: g });
  } catch (e) { console.error("PATCH group", e); return Response.json({ error: "Saqlab bo'lmadi" }, { status: 500 }); }
}

// DELETE /api/groups/[id] — admin deletes group
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(req);
  if (!auth || !(auth.role === "ADMIN" && isAdminEmail(auth.email))) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  try {
    await prisma.groupMember.deleteMany({ where: { groupId: id } });
    await prisma.attendance.deleteMany({ where: { groupId: id } });
    await prisma.homework.deleteMany({ where: { groupId: id } });
    await prisma.group.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) { console.error("DELETE group", e); return Response.json({ error: "O'chirib bo'lmadi" }, { status: 500 }); }
}
