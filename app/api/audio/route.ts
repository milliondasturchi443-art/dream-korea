import { requireAdmin } from "@/lib/session";
import { audioBucket } from "@/lib/gridfs";
import { Readable } from "node:stream";

export const dynamic = "force-dynamic";

const MAX_AUDIO = 25 * 1024 * 1024; // 25 MB — ko'p qismli darslar uchun yetarli
const AUDIO_EXT = /\.(mp3|m4a|wav|ogg|oga|aac|opus|webm|flac)$/i;

function guessType(name: string): string {
  const e = name.toLowerCase().split(".").pop() || "";
  const map: Record<string, string> = {
    mp3: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav", ogg: "audio/ogg",
    oga: "audio/ogg", aac: "audio/aac", opus: "audio/opus", webm: "audio/webm", flac: "audio/flac",
  };
  return map[e] || "application/octet-stream";
}

// POST /api/audio — Tinglash uchun ovoz faylini (PK yoki telefon) GridFS'ga yuklash.
// Admin uchun. Javob: { ok, id, url } — url Audio URL maydoniga avtomatik yoziladi.
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") {
    return Response.json({ error: "Fayl yuborilmadi" }, { status: 400 });
  }
  const name = (file.name || "audio.mp3").replace(/[/\\]/g, "_").slice(-120) || "audio.mp3";
  if (file.size === 0) return Response.json({ error: "Fayl bo‘sh" }, { status: 400 });
  if (file.size > MAX_AUDIO) {
    return Response.json({ error: "Fayl juda katta (maksimum 25 MB)" }, { status: 413 });
  }
  const isAudio = /^audio\//i.test(file.type) || AUDIO_EXT.test(name);
  if (!isAudio) return Response.json({ error: "Faqat audio fayl yuklash mumkin (mp3, m4a, wav, ogg…)" }, { status: 415 });

  try {
    const bucket = await audioBucket();
    const upload = bucket.openUploadStream(name, {
      metadata: { contentType: file.type || guessType(name), uploadedBy: admin.email, uploadedAt: new Date().toISOString() },
    });
    // File.stream() → Node stream → GridFS (puffer'siz, katta fayl ham xotiraga tushmaydi)
    await new Promise<void>((resolve, reject) => {
      const rs = Readable.fromWeb(file.stream() as import("node:stream/web").ReadableStream);
      rs.on("error", reject);
      upload.on("error", reject);
      upload.on("finish", () => resolve());
      rs.pipe(upload);
    });
    const id = String(upload.id);
    return Response.json({ ok: true, id, url: `/api/audio/${id}/file`, name, size: file.size }, { status: 201 });
  } catch (e) {
    console.error("audio upload error", e);
    return Response.json({ error: "Yuklab bo‘lmadi" }, { status: 500 });
  }
}

// GET /api/audio — admin uchun yuklangan audio fayllar ro'yxati (tanlash uchun)
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return Response.json({ error: "Ruxsat yo‘q" }, { status: 403 });
  try {
    const bucket = await audioBucket();
    const files = await bucket.find({}, { sort: { uploadDate: -1 }, limit: 200 }).toArray();
    return Response.json({
      items: files.map(f => ({
        id: String(f._id), name: f.filename, size: f.length,
        uploadedAt: f.uploadDate, url: `/api/audio/${String(f._id)}/file`,
      })),
    });
  } catch (e) {
    console.error("audio list error", e);
    return Response.json({ error: "Ro‘yxatni olib bo‘lmadi" }, { status: 500 });
  }
}
