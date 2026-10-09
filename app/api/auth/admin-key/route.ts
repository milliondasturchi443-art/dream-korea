import { sign, verify } from "@/lib/token";
import { ADMIN_EMAIL } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const DAY30 = 30 * 24 * 3600;

// GET /api/auth/admin-key — dk_admin cookie (kalit kiritilgan) amiqni tekshiramiz.
// amiq bo'lsa yangi token qaytaramiz (client sessionStorage uchun).
export async function GET() {
  const cs = await cookies();
  const tok = cs.get("dk_admin")?.value || "";
  const data = verify(tok);
  if (!data || data.role !== "ADMIN") {
    return Response.json({ ok: false }, { status: 401 });
  }
  const token = sign({ email: ADMIN_EMAIL, name: String(data.name ?? "Administrator"), role: "ADMIN" });
  return Response.json({ ok: true, token, email: String(data.email ?? ADMIN_EMAIL), name: String(data.name ?? "Administrator"), role: "ADMIN" });
}

// POST /api/auth/admin-key — kalit so'raymiz (PC va telefon uchun bir xil).
// Kalit = ADMIN_PASSWORD (env). To'g'ri bo'lsa — 30 kunlik dk_admin cookie (qurilmada eslab qolinadi).
export async function POST(req: Request) {
  let body: { key?: string } = {};
  try { body = await req.json(); } catch {}
  const key = typeof body.key === "string" ? body.key : "";
  const want = process.env.ADMIN_PASSWORD || "";
  if (!key || !want || key !== want) {
    await new Promise((r) => setTimeout(r, 800)); // brute-force sekinlashtirish
    return Response.json({ error: "Kalit noto‘g‘ri" }, { status: 401 });
  }
  const token = sign({ email: ADMIN_EMAIL, name: "Administrator", role: "ADMIN" });
  const cs = await cookies();
  cs.set("dk_admin", token, { httpOnly: true, path: "/", maxAge: DAY30, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return Response.json({ token, email: ADMIN_EMAIL, name: "Administrator", role: "ADMIN" });
}
