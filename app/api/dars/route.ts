import { prisma } from "@/lib/db";
import { darsUser } from "@/lib/dars-auth";
import { z } from "zod";

export async function GET() {
  try {
    const units = await prisma.darsUnit.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { vocab: true, videos: true, grammars: true, listenings: true, writings: true } } } });
    return Response.json({ units });
  } catch { return Response.json({ error: "Darslar yuklanmadi" }, { status: 503 }); }
}

export async function POST(req: Request) {
  try {
    const user = await darsUser(req);
    if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
    const parsed = z.object({ title: z.string().trim().min(1).max(150), topic: z.string().trim().min(1).max(200), level: z.enum(["TOPIK I", "TOPIK II"]), order: z.number().int().positive(), description: z.string().max(4000).optional() }).safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: "Unit ma’lumotlarini tekshiring" }, { status: 400 });
    const unit = await prisma.darsUnit.create({ data: parsed.data });
    return Response.json({ unit }, { status: 201 });
  } catch { return Response.json({ error: "Unit saqlanmadi; tartib raqami band bo‘lishi mumkin" }, { status: 503 }); }
}
