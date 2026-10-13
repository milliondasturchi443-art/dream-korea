import { prisma } from "@/lib/db";
import { darsUser } from "@/lib/dars-auth";
import { z } from "zod";
export const dynamic = "force-dynamic";

const newsSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(1).max(5000),
  image: z.string().max(1_500_000).optional().nullable(), // data URL, ~1.1MB binary limit
  pinned: z.boolean().optional(),
});

// GET /api/news — hammaga ochiq (oxirgi 30 ta)
export async function GET() {
  try {
    const items = await prisma.news.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
    return Response.json({ items });
  } catch { return Response.json({ items: [] }); }
}

// POST /api/news — faqat ADMIN
export async function POST(req: Request) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const parsed = newsSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Sarlavha va matn majburiy (matn 5000 belgigacha)" }, { status: 400 });
  if (parsed.data.image && !parsed.data.image.startsWith("data:image/")) return Response.json({ error: "Rasm noto'g'ri formatda" }, { status: 400 });
  try {
    const item = await prisma.news.create({ data: { title: parsed.data.title, body: parsed.data.body, image: parsed.data.image ?? null, pinned: parsed.data.pinned ?? false } });
    return Response.json({ ok: true, item }, { status: 201 });
  } catch { return Response.json({ error: "Saqlab bo'lmadi" }, { status: 503 }); }
}

const patchSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i), data: newsSchema.partial() });

// PATCH /api/news — ADMIN tahrirlaydi
export async function PATCH(req: Request) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  try {
    const item = await prisma.news.update({ where: { id: parsed.data.id }, data: parsed.data.data });
    return Response.json({ ok: true, item });
  } catch { return Response.json({ error: "Tahrirlab bo'lmadi" }, { status: 503 }); }
}

// DELETE /api/news?id=
export async function DELETE(req: Request) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const id = (new URL(req.url).searchParams.get("id") || "").trim();
  if (!/^[a-f\d]{24}$/i.test(id)) return Response.json({ error: "Noto'g'ri id" }, { status: 400 });
  try { await prisma.news.delete({ where: { id } }); return Response.json({ ok: true }); }
  catch { return Response.json({ error: "O'chirib bo'lmadi" }, { status: 503 }); }
}
