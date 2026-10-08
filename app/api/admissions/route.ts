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

// POST /api/admissions — qabul arizasi (ochiq, validatsiya bilan)
export async function POST(req: Request) {
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch {}
  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const email = String(body.email ?? "").trim();
  if (!name || !phone || !email) return Response.json({ error: "Ism, telefon va email majburiy" }, { status: 400 });
  if (!/^\+?[\d\s()-]{7,20}$/.test(phone)) return Response.json({ error: "Telefon formati noto'g'ri" }, { status: 400 });
  if (!email.includes("@")) return Response.json({ error: "Email noto'g'ri" }, { status: 400 });
  try {
    await prisma.admission.create({
      data: {
        name, phone, email,
        birth: String(body.birth ?? "").trim() || null,
        edu: String(body.edu ?? "").trim() || null,
        topik: String(body.topik ?? "").trim() || null,
        uni: String(body.uni ?? "").trim() || null,
        comment: String(body.comment ?? "").trim() || null,
      },
    });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("POST /api/admissions", e);
    return Response.json({ error: "Arizani yuborib bo'lmadi — keyinroq urinib ko'ring" }, { status: 500 });
  }
}

// GET /api/admissions — barcha arizalar (ADMIN)
export async function GET(req: Request) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  try {
    const items = await prisma.admission.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return Response.json({ items });
  } catch (e) {
    console.error("GET /api/admissions", e);
    return Response.json({ error: "Arizalar yuklanmadi" }, { status: 500 });
  }
}
