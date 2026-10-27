import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { avatarBucket, ObjectId } from "@/lib/gridfs";
import { Readable } from "node:stream";

export const dynamic = "force-dynamic";

const MAX_AVATAR = 5 * 1024 * 1024; // 5 MB — rasm uchun yetarli
const AVATAR_EXT = /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i;

function guessType(name: string): string {
  const e = name.toLowerCase().split(".").pop() || "";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    gif: "image/gif", heic: "image/heic", heif: "image/heif", avif: "image/avif",
  };
  return map[e] || "application/octet-stream";
}

// POST /api/avatar — o'z profil rasmini (avatar) yuklash. Talaba ham, admin ham kira oladi.
// Telefonda galereyadan tanlash yoki kamerada surat olish mumkin (capture).
export async function POST(req: Request) {
  const s = await getSession(req);
  if (!s) return Response.json({ error: "Token yaroqsiz" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") {
    return Response.json({ error: "Rasm fayli yuborilmadi" }, { status: 400 });
  }
  const name = (file.name || "photo.jpg").replace(/[/\\]/g, "_").slice(-120) || "photo.jpg";
  if (file.size === 0) return Response.json({ error: "Fayl bo‘sh" }, { status: 400 });
  if (file.size > MAX_AVATAR) {
    return Response.json({ error: "Rasm juda katta (maksimum 5 MB)" }, { status: 413 });
  }
  const isImage = /^image\//i.test(file.type) || AVATAR_EXT.test(name);
  if (!isImage) return Response.json({ error: "Faqat rasm yuklash mumkin (JPG, PNG, WebP…)" }, { status: 415 });

  try {
    const bucket = await avatarBucket();
    const upload = bucket.openUploadStream(name, {
      metadata: { contentType: file.type || guessType(name), uploadedBy: s.email, uploadedAt: new Date().toISOString() },
    });
    await new Promise<void>((resolve, reject) => {
      const rs = Readable.fromWeb(file.stream() as import("node:stream/web").ReadableStream);
      rs.on("error", reject);
      upload.on("error", reject);
      upload.on("finish", () => resolve());
      rs.pipe(upload);
    });
    const id = String(upload.id);
    const url = `/api/avatar/${id}/file`;

    // Eski avatar faylini o'chirib, yangisini saqlaymiz
    const prev = s.id
      ? await prisma.user.findUnique({ where: { id: s.id }, select: { avatar: true } }).catch(() => null)
      : null;
    if (prev?.avatar) {
      const m = prev.avatar.match(/^\/api\/avatar\/([a-f\d]{24})\/file$/);
      if (m) {
        try { await bucket.delete(new ObjectId(m[1])); } catch {}
      }
    }

    if (s.id) {
      await prisma.user.update({ where: { id: s.id }, data: { avatar: url } }).catch(() => {});
    }
    return Response.json({ ok: true, url }, { status: 201 });
  } catch (e) {
    console.error("avatar upload error", e);
    return Response.json({ error: "Yuklab bo‘lmadi" }, { status: 500 });
  }
}
