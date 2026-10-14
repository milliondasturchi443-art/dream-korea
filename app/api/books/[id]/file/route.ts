import { prisma } from "@/lib/db";
import { booksBucket, ObjectId } from "@/lib/gridfs";
import { Readable } from "node:stream";

export const dynamic = "force-dynamic";

// GET /api/books/[id]/file — kitobning GridFS dagi PDF'ini stream qilib berish (iframe / download)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return new Response("Noto'g'ri id", { status: 400 });

  try {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book?.fileId || !/^[a-f\d]{24}$/i.test(book.fileId)) {
      return new Response("Fayl topilmadi", { status: 404 });
    }

    const bucket = await booksBucket();
    const oid = new ObjectId(book.fileId);
    const meta = await bucket.find({ _id: oid }).next();
    if (!meta) return new Response("Fayl topilmadi", { status: 404 });

    const stream = bucket.openDownloadStream(oid);
    const web = Readable.toWeb(stream) as ReadableStream;
    const metaAny = meta.metadata as { contentType?: string } | undefined;
    return new Response(web, {
      headers: {
        "Content-Type": metaAny?.contentType || "application/pdf",
        "Content-Length": String(meta.length),
        "Content-Disposition": `inline; filename="${encodeURIComponent(meta.filename || "kitob.pdf")}"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("books file error", e);
    return new Response("Faylni olib bo'lmadi", { status: 500 });
  }
}
