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

function isAdmin(a: { role: string; email: string } | null) { return !!a && a.role === "ADMIN" && isAdminEmail(a.email); }

// POST /api/groups/[id]/members — admin adds student(s): { userIds: string[] } or { userId }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(req);
  if (!isAdmin(auth)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id: groupId } = await params;
  let body: { userId?: string; userIds?: string[]; email?: string } = {};
  try { body = await req.json(); } catch {}
  let ids: string[] = [];
  if (Array.isArray(body.userIds)) ids = body.userIds.map(s => String(s).trim()).filter(Boolean);
  else if (body.userId) ids = [String(body.userId).trim()];
  else if (body.email) {
    const u = await prisma.user.findUnique({ where: { email: normalizeEmail(String(body.email)) }, select: { id: true } });
    if (u?.id) ids = [u.id];
  }
  if (ids.length === 0) return Response.json({ error: "O'quvchi tanlang" }, { status: 400 });
  try {
    let added = 0;
    for (const userId of ids) {
      try {
        await prisma.groupMember.create({ data: { groupId, userId } });
        added++;
      } catch {}
    }
    return Response.json({ ok: true, added });
  } catch (e) { console.error("add members", e); return Response.json({ error: "Qo'shib bo'lmadi" }, { status: 500 }); }
}

// DELETE /api/groups/[id]/members?userId= — admin removes student
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(req);
  if (!isAdmin(auth)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id: groupId } = await params;
  const userId = new URL(req.url).searchParams.get("userId")?.trim() || "";
  if (!userId) return Response.json({ error: "userId kerak" }, { status: 400 });
  try {
    await prisma.groupMember.deleteMany({ where: { groupId, userId } });
    return Response.json({ ok: true });
  } catch (e) { console.error("del member", e); return Response.json({ error: "O'chirib bo'lmadi" }, { status: 500 }); }
}
