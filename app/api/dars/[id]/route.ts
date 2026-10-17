import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";
import { youtubeId } from "@/lib/youtube";
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
    const unit = await prisma.darsUnit.findUnique({ where: { id } });
    if (!unit) return Response.json({ error: "Topilmadi" }, { status: 404 });

    // Unit maydonlari — faqat berilganlari yangilanadi
    const fields: Record<string, string | null> = {};
    if (b.title) fields.title = String(b.title).trim();
    if (b.topic) fields.topic = String(b.topic).trim();
    if (b.level) fields.level = String(b.level).trim();
    if (b.description !== undefined) fields.description = String(b.description).trim() || null;
    if (b.cover !== undefined) fields.cover = String(b.cover).trim() || null;
    if (Object.keys(fields).length) await prisma.darsUnit.update({ where: { id }, data: fields });

    // Tartib raqami — o'zgarsa, unit yangi joyga siljiydi (unique buzilmaydi)
    if (b.order !== undefined) {
      const newOrder = Math.round(Number(b.order));
      if (Number.isFinite(newOrder) && newOrder >= 1 && newOrder !== unit.order) {
        const all = await prisma.darsUnit.findMany({ orderBy: { order: "asc" }, select: { id: true } });
        const rest = all.filter(u => u.id !== id).map(u => u.id);
        const idx = Math.min(Math.max(newOrder, 1), rest.length + 1) - 1;
        const orderedIds = [...rest.slice(0, idx), id, ...rest.slice(idx)];
        // 1-faza: vaqtinchalik manfiy raqamlar (kokly uniqueness buzilmaydi)
        for (let i = 0; i < all.length; i++) await prisma.darsUnit.update({ where: { id: all[i].id }, data: { order: -(i + 1) } });
        // 2-faza: yakuniy 1..N
        for (let i = 0; i < orderedIds.length; i++) await prisma.darsUnit.update({ where: { id: orderedIds[i] }, data: { order: i + 1 } });
      }
    }

    // Video: YouTube havolasi yoki to‘g‘ri URL; bo‘sh qiymat — o‘chirish
    if (b.videoUrl !== undefined) {
      const url = String(b.videoUrl).trim();
      if (url && !youtubeId(url) && !/^https?:\/\//i.test(url)) {
        return Response.json({ error: "YouTube havolasi yoki https:// manzil kiriting" }, { status: 400 });
      }
      const existing = await prisma.darsVideo.findMany({ where: { unitId: id }, orderBy: { order: "asc" } });
      if (!url) {
        if (existing.length) await prisma.darsVideo.deleteMany({ where: { unitId: id } });
      } else if (existing.length) {
        await prisma.darsVideo.update({ where: { id: existing[0].id }, data: { videoUrl: url } });
        if (existing.length > 1) await prisma.darsVideo.deleteMany({ where: { id: { in: existing.slice(1).map(v => v.id) } } });
      } else {
        await prisma.darsVideo.create({ data: { unitId: id, title: unit.topic, videoUrl: url, order: 0 } });
      }
    }

    const u = await prisma.darsUnit.findUnique({ where: { id } });
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
