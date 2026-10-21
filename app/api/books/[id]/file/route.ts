import { prisma } from "@/lib/db";
import { booksBucket, ObjectId } from "@/lib/gridfs";
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

type ParsedRange = { start: number; end: number } | null | "unsatisfiable";

// RFC 7233 bo'yicha yagona "bytes" diapazonini yechadi:
//   bytes=0-99 | bytes=100- | bytes=-500
// null → diapazon yo'q/qo'llab-quvvatlanmaydi (200 bilan javob beramiz)
// "unsatisfiable" → 416
function parseRange(header: string | null, total: number): ParsedRange {
  if (!header || !Number.isFinite(total) || total <= 0) return null;
  const m = /^bytes\s*=\s*(.+)$/i.exec(header.trim());
  if (!m) return null;
  const parts = m[1].split(",");
  if (parts.length !== 1) return null; // ko'p qismli so'rov — 200 bilan o'tkazib yuboramiz
  const spec = /^(\d*)-(\d*)$/.exec(parts[0].trim());
  if (!spec) return "unsatisfiable";
  const [, sRaw, eRaw] = spec;
  if (!sRaw && !eRaw) return "unsatisfiable";

  let start: number;
  let end: number;
  if (!sRaw) {
    // oxiridan N bayt (bytes=-500)
    const suffix = Number(eRaw);
    if (!Number.isFinite(suffix) || suffix <= 0) return "unsatisfiable";
    start = Math.max(0, total - suffix);
    end = total - 1;
  } else {
    start = Number(sRaw);
    if (!Number.isFinite(start) || start >= total) return "unsatisfiable";
    end = eRaw ? Number(eRaw) : total - 1;
    if (!Number.isFinite(end) || end < start) return "unsatisfiable";
    if (end > total - 1) end = total - 1;
  }
  return { start, end };
}
