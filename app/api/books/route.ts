import { prisma } from "@/lib/db";
import { darsUser } from "@/lib/dars-auth";
import { booksBucket, ObjectId } from "@/lib/gridfs";
import { BOOK_COLORS, booksData } from "@/lib/books-data";
import { Readable } from "node:stream";
import { z } from "zod";

export const dynamic = "force-dynamic";

const MAX_PDF = 90_000_000; // 90MB — Render chegarasidan past

const metaSchema = z.object({
  title: z.string().trim().min(2).max(200),
  subtitle: z.string().trim().max(200).optional().default(""),
  category: z.enum(["TOPIK", "Darslik", "Ishchi daftar", "O'qish"]),
  level: z.string().trim().max(60).optional().default("Boshlang'ich"),
  pages: z.coerce.number().int().min(0).max(20000).optional().default(0),
  code: z.string().trim().max(10).optional().default(""),
  description: z.string().trim().max(1000).optional().default(""),
  color: z.string().trim().max(80).optional().default(BOOK_COLORS[0]),
  fileUrl: z.string().trim().max(500).optional().default(""),
});

type ClientBook = {
  id: string; title: string; subtitle: string; category: string; level: string;
  pages: number; sizeMb: number; color: string; code: string; description: string;
  file: string; source: "static" | "db"; createdAt?: string;
};

function staticBooks(): ClientBook[] {
  return booksData.map(b => ({ ...b, source: "static" as const }));
}

// GET /api/books — ochiq: DB kitoblari + ichki (public/books) kitoblar
export async function GET() {
  try {
    const rows = await prisma.book.findMany({ orderBy: { createdAt: "desc" } });
    const seen = new Set(rows.map(b => b.title.trim().toLowerCase()));
    const fromDb: ClientBook[] = rows.map(b => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      category: b.category,
      level: b.level,
      pages: b.pages,
      sizeMb: b.sizeMb,
      color: BOOK_COLORS.includes(b.color) ? b.color : BOOK_COLORS[0],
      code: b.code,
      description: b.description,
      file: b.fileId ? `/api/books/${b.id}/file` : (b.file || ""),
      source: "db",
      createdAt: b.createdAt.toISOString(),
    }));
    const builtIn = staticBooks().filter(b => !seen.has(b.title.trim().toLowerCase()));
    return Response.json({ items: [...fromDb, ...builtIn] });
  } catch {
    return Response.json({ items: staticBooks() });
  }
}

// POST /api/books — faqat ADMIN: PDF fayl (GridFS) yoki tashqi manzil bilan kitob qo'shish
export async function POST(req: Request) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

  let fd: FormData;
  try { fd = await req.formData(); } catch {
    return Response.json({ error: "Noto'g'ri so'rov (FormData kutilgan)" }, { status: 400 });
  }

  // FormData'da yo'q maydon null bo'ladi — zod optional uchun undefined qilamiz
  const val = (k: string): string | undefined => {
    const v = fd.get(k);
    return v === null || v instanceof File ? undefined : v;
  };
  const parsed = metaSchema.safeParse({
    title: val("title"),
    subtitle: val("subtitle"),
    category: val("category"),
    level: val("level"),
    pages: val("pages"),
    code: val("code"),
    description: val("description"),
    color: val("color"),
    fileUrl: val("fileUrl"),
  });
  if (!parsed.success) {
    return Response.json({ error: "Sarlavha, kategoriya va maydonlar noto'g'ri to'ldirilgan" }, { status: 400 });
  }
  const m = parsed.data;
  if (m.color && !BOOK_COLORS.includes(m.color)) m.color = BOOK_COLORS[0];
  if (m.fileUrl && !m.fileUrl.startsWith("/") && !/^https?:\/\//i.test(m.fileUrl)) {
    return Response.json({ error: "Manzil / yoki https:// bilan boshlanishi kerak" }, { status: 400 });
  }

  const file = fd.get("file");
  const hasFile = file instanceof File && file.size > 0;
  if (!hasFile && !m.fileUrl) {
    return Response.json({ error: "PDF fayl yuklang yoki manzil kiriting" }, { status: 400 });
  }

  let fileId: string | null = null;
  try {
    let sizeMb = 0;
    if (hasFile) {
      const f = file as File;
      const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name || "");
      if (!isPdf) return Response.json({ error: "Faqat PDF fayl yuklash mumkin" }, { status: 400 });
      if (f.size > MAX_PDF) return Response.json({ error: "Fayl juda katta (90 MB gacha)" }, { status: 400 });

      const bucket = await booksBucket();
      const safeName = (f.name || "kitob.pdf").replace(/[^\w.\-]+/g, "_").slice(-120);
      const upload = bucket.openUploadStream(safeName, { metadata: { title: m.title, contentType: "application/pdf" } });
      const src = Readable.fromWeb(f.stream() as unknown as import("node:stream/web").ReadableStream);
      await new Promise<void>((resolve, reject) => {
        src.on("error", reject);
        upload.on("error", reject);
        upload.on("finish", resolve);
        src.pipe(upload);
      });
      fileId = upload.id.toString();
      sizeMb = Math.round((f.size / 1024 / 1024) * 10) / 10;
    }

    const item = await prisma.book.create({
      data: {
        title: m.title, subtitle: m.subtitle, category: m.category, level: m.level,
        pages: m.pages, sizeMb, color: m.color, code: m.code, description: m.description,
        file: hasFile ? null : m.fileUrl,
        fileId,
      },
    });

    const clientBook: ClientBook = {
      id: item.id, title: item.title, subtitle: item.subtitle, category: item.category,
      level: item.level, pages: item.pages, sizeMb: item.sizeMb, color: item.color,
      code: item.code, description: item.description,
      file: fileId ? `/api/books/${item.id}/file` : (item.file || ""),
      source: "db", createdAt: item.createdAt.toISOString(),
    };
    return Response.json({ ok: true, book: clientBook }, { status: 201 });
  } catch (e) {
    // yarim yuklangan faylni tozalash
    if (fileId) { try { await (await booksBucket()).delete(new ObjectId(fileId)); } catch {} }
    console.error("books post error", e);
    return Response.json({ error: "Saqlab bo'lmadi" }, { status: 503 });
  }
}
