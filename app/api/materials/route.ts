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

// GET /api/materials — ochiq ro'yxat (БД)
export async function GET() {
  try {
    const items = await prisma.material.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return Response.json({ items });
  } catch (e) {
    console.error("GET /api/materials", e);
    return Response.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// POST /api/materials — qo'shish (ADMIN)
export async function POST(req: Request) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  let body: { title?: string; kind?: string; url?: string } = {};
  try { body = await req.json(); } catch {}
  const title = String(body.title ?? "").trim();
  if (!title) return Response.json({ error: "Sarlavha kiriting" }, { status: 400 });
  try {
    const m = await prisma.material.create({
      data: { title, kind: String(body.kind ?? "PDF").trim() || "PDF", url: String(body.url ?? "").trim() || null },
    });
    return Response.json({ ok: true, material: m });
  } catch (e) {
    console.error("POST /api/materials", e);
    return Response.json({ error: "Qo'shib bo'lmadi" }, { status: 500 });
  }
}
