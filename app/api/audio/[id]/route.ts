import { requireAdmin } from "@/lib/session";
import { audioBucket, ObjectId } from "@/lib/gridfs";

export const dynamic = "force-dynamic";

// DELETE /api/audio/[id] — admin uchun audio faylni o'chirish (GridFS)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return Response.json({ error: "Noto‘g‘ri id" }, { status: 400 });
  try {
    const bucket = await audioBucket();
    await bucket.delete(new ObjectId(id));
    return Response.json({ ok: true });
  } catch (e) {
    // GridFS delete — fayl bo'lmasa ham xato beradi
    console.error("audio delete error", e);
    return Response.json({ error: "O‘chirib bo‘lmadi (fayl topilmadi)" }, { status: 404 });
  }
}
