import { prisma } from "@/lib/db";
import { normalizeEmail, ADMIN_EMAIL } from "@/lib/auth";
import { sign } from "@/lib/token";
import { cookies } from "next/headers";
import * as bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const DAY30 = 30 * 24 * 3600;

async function setSessionCookie(token: string, role: string) {
  const cs = await cookies();
  if (role === "ADMIN") {
    // Admin — session cookie (brauzer yopilsa qayta so'raymiz — "har doim so'raysin")
    cs.set("dk_token", token, { httpOnly: true, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  } else {
    // O'quvchi/ustoz — 30 kun saqlanadi
    cs.set("dk_token", token, { httpOnly: true, path: "/", maxAge: DAY30, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  }
}

export async function POST(req: Request) {
  let body: { email?: string; password?: string } = {};
  try { body = await req.json(); } catch {}
  const emailRaw = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  if (!emailRaw || !password) return Response.json({ error: "Email va parol kiriting" }, { status: 400 });
  const email = normalizeEmail(emailRaw);

  const envAdmin = normalizeEmail(process.env.ADMIN_EMAIL || ADMIN_EMAIL);
  const envPass = process.env.ADMIN_PASSWORD || "Woosuk0047@";

  // Fallback без БД (если Mongo недоступен) — берём env-админа сразу
  if (email === envAdmin && password === envPass) {
    const token = sign({ email, name: "Administrator", role: "ADMIN" });
    await setSessionCookie(token, "ADMIN");
    return Response.json({ token, email, name: "Administrator", role: "ADMIN" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return Response.json({ error: "Email yoki parol noto‘g‘ri" }, { status: 401 });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return Response.json({ error: "Email yoki parol noto‘g‘ri" }, { status: 401 });
    const role = user.role as string;
    const token = sign({ email: user.email, name: user.name, role, id: user.id });
    await setSessionCookie(token, role);
    return Response.json({ token, email: user.email, name: user.name, role, id: user.id });
  } catch (e) {
    console.error("login DB error", e);
    // БД легла — пробуем env-admin ещё раз как fallback
    if (email === envAdmin && password === envPass) {
      const token = sign({ email, name: "Administrator", role: "ADMIN" });
      await setSessionCookie(token, "ADMIN");
      return Response.json({ token, email, name: "Administrator", role: "ADMIN" });
    }
    return Response.json({ error: "Server xatosi — qayta urinib ko‘ring" }, { status: 500 });
  }
}
