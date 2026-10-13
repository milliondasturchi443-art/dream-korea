import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";
export const dynamic = "force-dynamic";

function isSeed(id: string) { return id.startsWith("seed-"); }
function requireAdmin(req: Request) {
  const t = readAuthToken(req);
  const d = verify(t) as Record<string, unknown> | null;
  return !!d && d.role === "ADMIN" && isAdminEmail(String(d.email ?? ""));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isSeed(id)) {
    return Response.json({ error: "Unit nashr qilinmagan" }, { status: 404 });
  }
  try {
    const u = await prisma.darsUnit.findUnique({ where: { id } });
    if (!u) return Response.json({ error: "Topilmadi" }, { status: 404 });
    const [vocab, videos, grammars, listenings, writings] = await Promise.all([
      prisma.darsVocab.findMany({ where: { unitId: id }, orderBy: { order: "asc" } }),
      prisma.darsVideo.findMany({ where: { unitId: id }, orderBy: { order: "asc" } }),
      prisma.darsGrammar.findMany({ where: { unitId: id }, orderBy: { order: "asc" } }),
      prisma.darsListening.findMany({ where: { unitId: id }, orderBy: { order: "asc" } }),
      prisma.darsWriting.findMany({ where: { unitId: id }, orderBy: { order: "asc" } }),
    ]);
    return Response.json({
      id: u.id, order: u.order, title: u.title, topic: u.topic, level: u.level, description: u.description, cover: u.cover, seeded: false,
      vocab, videos, grammars, listenings, writings,
    });
  } catch (e) {
    console.error("GET /api/dars/[id]", e);
    return Response.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  const { id } = await params;
  if (isSeed(id)) return Response.json({ error: "Seed unitni tahrirlab bo‘lmaydi" }, { status: 400 });
  let b: Record<string, string> = {};
  try { b = await req.json(); } catch {}
  try {
    const u = await prisma.darsUnit.update({ where: { id }, data: {
      ...(b.title ? { title: String(b.title).trim() } : {}),
      ...(b.topic ? { topic: String(b.topic).trim() } : {}),
      ...(b.level ? { level: String(b.level).trim() } : {}),
      ...(b.description !== undefined ? { description: String(b.description).trim() || null } : {}),
      ...(b.cover !== undefined ? { cover: String(b.cover).trim() || null } : {}),
    }});
    return Response.json({ ok: true, unit: u });
  } catch (e) { console.error("PATCH /api/dars/[id]", e); return Response.json({ error: "Saqlab bo‘lmadi" }, { status: 500 }); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  const { id } = await params;
  if (isSeed(id)) return Response.json({ error: "Seed o‘chirilmaydi" }, { status: 400 });
  try {
    await prisma.darsUnit.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) { console.error("DELETE /api/dars/[id]", e); return Response.json({ error: "O‘chirib bo‘lmadi" }, { status: 500 }); }
}
