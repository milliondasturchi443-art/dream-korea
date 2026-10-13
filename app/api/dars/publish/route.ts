import { prisma } from "@/lib/db";
import { darsUser } from "@/lib/dars-auth";
import { SEED_UNITS } from "@/lib/dars-units";

export async function POST(req: Request) {
  try {
    const user = await darsUser(req);
    if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
    if (await prisma.darsUnit.count()) return Response.json({ error: "Unitlar allaqachon mavjud" }, { status: 409 });
    for (const unit of SEED_UNITS) {
      await prisma.darsUnit.create({ data: {
        title: unit.title, topic: unit.topic, level: unit.level, order: unit.order, description: unit.description,
        vocab: { create: unit.vocab.map((v, order) => ({ ...v, order })) },
        grammars: { create: unit.grammars.map((g, order) => ({ ...g, order })) },
        listenings: { create: unit.listenings.map((l, order) => ({ ...l, order })) },
      } });
    }
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "Nashr qilinmadi" }, { status: 503 }); }
}
