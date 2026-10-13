import { prisma } from "@/lib/db";
import { darsUser } from "@/lib/dars-auth";
import { SEED_UNITS } from "@/lib/dars-units";

export async function POST(req: Request) {
  try {
    const user = await darsUser(req);
    if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
    const existing = await prisma.darsUnit.findMany({ select: { order: true } });
    const have = new Set(existing.map(u => u.order));
    let created = 0;
    for (const unit of SEED_UNITS) {
      if (have.has(unit.order)) continue;
      await prisma.darsUnit.create({ data: {
        title: unit.title, topic: unit.topic, level: unit.level, order: unit.order, description: unit.description,
        vocab: { create: unit.vocab.map((v, order) => ({ ...v, order })) },
        grammars: { create: unit.grammars.map((g, order) => ({ ...g, order })) },
        listenings: { create: unit.listenings.map((l, order) => ({ ...l, order })) },
        writings: { create: unit.writings.map((w, order) => ({ ...w, order })) },
      } });
      created += 1;
    }
    if (!created) return Response.json({ ok: true, created: 0, note: "Barcha unitlar allaqachon mavjud" });
    return Response.json({ ok: true, created });
  } catch { return Response.json({ error: "Nashr qilinmadi" }, { status: 503 }); }
}
