import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth";
import { sign } from "@/lib/token";
import { cookies } from "next/headers";
import * as bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { name?: string; email?: string; password?: string; phone?: string } = {};
  try { body = await req.json(); } catch {}
  const name = String(body.name ?? "").trim();
  const emailRaw = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  const phone = String(body.phone ?? "").trim();
  if (!name || !emailRaw || !password) return Response.json({ error: "Barcha maydonlarni to‘ldiring" }, { status: 400 });
  if (password.length < 6) return Response.json({ error: "Parol kamida 6 ta belgi" }, { status: 400 });
  const email = normalizeEmail(emailRaw);
  if (!email.includes("@")) return Response.json({ error: "Email noto‘g‘ri" }, { status: 400 });
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return Response.json({ error: "Bu email allaqachon ro‘yxatda" }, { status: 409 });
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, password: hash, phone: phone || undefined, role: "STUDENT" } });
    const token = sign({ email: user.email, name: user.name, role: user.role, id: user.id });
    const cs = await cookies();
    cs.set("dk_token", token, { httpOnly: true, path: "/", maxAge: 30 * 24 * 3600, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    return Response.json({ token, email: user.email, name: user.name, role: user.role, id: user.id });
  } catch (e) {
    console.error("register error", e);
    return Response.json({ error: "Server xatosi — qayta urinib ko‘ring" }, { status: 500 });
  }
}
