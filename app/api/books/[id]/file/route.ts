import { prisma } from "@/lib/db";
import { booksBucket, ObjectId } from "@/lib/gridfs";
import { parseRange } from "@/lib/http-range";
import { Readable } from "node:stream";

export const dynamic = "force-dynamic";

// GET /api/books/[id]/file — kitobning GridFS dagi PDF'ini stream qilib berish (iframe / download)
// Range (206) qo'llab-quvvatlanadi: brauzer PDF'ni qismlab o'qiydi — sahifalar
// orasida yurish/pauza to'g'ri ishlaydi va fayl boshidan emas, kerakli joyidan oqadi.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const total = Number(meta.length);
    const metaAny = meta.metadata as { contentType?: string } | undefined;
    const base: Record<string, string> = {
      "Content-Type": metaAny?.contentType || "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(meta.filename || "kitob.pdf")}"`,
      "Cache-Control": "public, max-age=86400",
      "Accept-Ranges": "bytes",
    };

    const range = parseRange(req.headers.get("Range"), total);
    if (range === "unsatisfiable") {
      return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${total}` } });
    }

    if (range) {
      // GridFS `end` — kirmaydigan offset, HTTP Range'da esa end kiritiladi → +1
      const part = bucket.openDownloadStream(oid, { start: range.start, end: range.end + 1 });
      return new Response(Readable.toWeb(part) as ReadableStream, {
        status: 206,
        headers: {
          ...base,
          "Content-Range": `bytes ${range.start}-${range.end}/${total}`,
          "Content-Length": String(range.end - range.start + 1),
        },
      });
    }

    const stream = bucket.openDownloadStream(oid);
    const web = Readable.toWeb(stream) as ReadableStream;
    return new Response(web, { headers: { ...base, "Content-Length": String(total) } });
  } catch (e) {
    console.error("books file error", e);
    return new Response("Faylni olib bo'lmadi", { status: 500 });
  }
}
