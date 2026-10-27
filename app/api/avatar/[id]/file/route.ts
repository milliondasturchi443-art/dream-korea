import { avatarBucket, ObjectId } from "@/lib/gridfs";
import { Readable } from "node:stream";

export const dynamic = "force-dynamic";

// GET /api/avatar/[id]/file — profil rasmini beradi (odiy <img> uchun, auth kerak emas).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return new Response("Noto'g'ri id", { status: 400 });

  try {
    const bucket = await avatarBucket();
    const oid = new ObjectId(id);
    const meta = await bucket.find({ _id: oid }).next();
    if (!meta) return new Response("Rasm topilmadi", { status: 404 });

    const total = Number(meta.length);
    const metaAny = meta.metadata as { contentType?: string } | undefined;
    const base: Record<string, string> = {
      "Content-Type": metaAny?.contentType || "image/jpeg",
      "Content-Disposition": `inline; filename="${encodeURIComponent(meta.filename || "photo.jpg")}"`,
      "Cache-Control": "public, max-age=604800",
    };

    const stream = bucket.openDownloadStream(oid);
    const web = Readable.toWeb(stream) as ReadableStream;
    return new Response(web, { headers: { ...base, "Content-Length": String(total) } });
  } catch (e) {
    console.error("avatar file error", e);
    return new Response("Faylni olib bo'lmadi", { status: 500 });
  }
}
