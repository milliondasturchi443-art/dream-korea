import { prisma } from "@/lib/db";
import { darsUser } from "@/lib/dars-auth";
import { booksBucket, ObjectId } from "@/lib/gridfs";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/books/[id] — faqat ADMIN: kitob + GridFS dagi PDF'ni o'chirish
export async function DELETE(_req: Request, { params }: Params) {
  const user = await darsUser(_req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return Response.json({ error: "Noto'g'ri id" }, { status: 400 });

  try {
    const item = await prisma.book.findUnique({ where: { id } });
    if (!item) return Response.json({ error: "Kitob topilmadi" }, { status: 404 });
    await prisma.book.delete({ where: { id } });
    if (item.fileId && /^[a-f\d]{24}$/i.test(item.fileId)) {
      try { await (await booksBucket()).delete(new ObjectId(item.fileId)); } catch {}
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "O'chirib bo'lmadi" }, { status: 503 });
  }
}
