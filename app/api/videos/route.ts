import { prisma } from "@/lib/db";
import { verify } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

function requireAdmin(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const d = verify(token);
  return !!d && d.role === "ADMIN" && isAdminEmail(String(d.email ?? ""));
}

// GET /api/videos?category= — ochiq ro'yxat (БД)
export async function GET(req: Request) {
  const cat = (new URL(req.url).searchParams.get("category") || "").trim();
  try {
    const videos = await prisma.video.findMany({
      where: cat ? { category: cat } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return Response.json({ videos });
  } catch (e) {
    console.error("GET /api/videos", e);
    return Response.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// POST /api/videos — qo'shish (ADMIN)
export async function POST(req: Request) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  let body: { title?: string; category?: string; duration?: string; videoUrl?: string } = {};
  try { body = await req.json(); } catch {}
  const title = String(body.title ?? "").trim();
  const category = String(body.category ?? "").trim();
  const duration = String(body.duration ?? "").trim();
  if (!title || !category) return Response.json({ error: "Sarlavha va kategoriya majburiy" }, { status: 400 });
  try {
    const v = await prisma.video.create({
      data: { title, category, duration: duration || "—", videoUrl: String(body.videoUrl ?? "").trim() || null },
    });
    return Response.json({ ok: true, video: v });
  } catch (e) {
    console.error("POST /api/videos", e);
    return Response.json({ error: "Qo'shib bo'lmadi" }, { status: 500 });
  }
}
