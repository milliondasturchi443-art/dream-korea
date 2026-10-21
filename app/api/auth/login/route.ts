import { prisma } from "@/lib/db";
import { normalizeEmail, ADMIN_EMAIL } from "@/lib/auth";
import { emailVerifyEnabled } from "@/lib/email";
import { signSession, signAdminSession } from "@/lib/session";
import { clientIp } from "@/lib/ip";
import { rateLimit, rateLimitReset, tooMany } from "@/lib/rate-limit";
import { safeEqual } from "@/lib/secure-compare";
import { cookies } from "next/headers";
import * as bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const DAY30 = 30 * 24 * 3600;

async function setSessionCookie(token: string) {
  const cs = await cookies();
  // Barcha rollar — 30 kun saqlanadi (token ham 30 kunlik): APK qayta ochilsa kirish yo'qolmaydi.
  cs.set("dk_token", token, { httpOnly: true, path: "/", maxAge: DAY30, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
}

export async function POST(req: Request) {
  let body: { email?: string; password?: string } = {};
  try { body = await req.json(); } catch {}
  const emailRaw = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  if (!emailRaw || !password) return Response.json({ error: "Email va parol kiriting" }, { status: 400 });
  const email = normalizeEmail(emailRaw);

  // Brute-force himoyasi: IP bo'yicha 20/15daq, email bo'yicha 5/15daq
  const ip = clientIp(req) || "unknown";
  const emailKey = `login:email:${email}`;
  if (!rateLimit(`login:ip:${ip}`, 20, 15 * 60_000) || !rateLimit(emailKey, 5, 15 * 60_000)) {
    return tooMany(15 * 60);
  }

  const envAdmin = normalizeEmail(process.env.ADMIN_EMAIL || ADMIN_EMAIL);
  const envPass = process.env.ADMIN_PASSWORD || "";

  // Admin faqat env-parol orqali kiradi. ADMIN_PASSWORD o'rnatilmagan bo'lsa — admin kirishi o'chiq.
  if (email === envAdmin) {
    if (!envPass || envPass.length < 8) {
      console.error("ADMIN_PASSWORD is not set (or too short) — admin login disabled");
      return Response.json({ error: "Server sozlanmagan" }, { status: 500 });
    }
    if (!safeEqual(password, envPass)) {
      return Response.json({ error: "Email yoki parol noto‘g‘ri" }, { status: 401 });
    }
    rateLimitReset(emailKey);
    const token = await signAdminSession();
    await setSessionCookie(token);
    return Response.json({ token, email, name: "Administrator", role: "ADMIN" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return Response.json({ error: "Email yoki parol noto‘g‘ri" }, { status: 401 });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return Response.json({ error: "Email yoki parol noto‘g‘ri" }, { status: 401 });
    if (emailVerifyEnabled() && user.emailVerified === false) {
      return Response.json({ error: "Email tasdiqlanmagan — pochtangizdagi havolani bosing", code: "EMAIL_NOT_VERIFIED" }, { status: 403 });
    }
    // Ban tekshiruvi — cheklangan hisob kira olmaydi
    if (user.banned) {
      return Response.json({ error: "Hisobingiz cheklangan. Administratorga murojaat qiling.", code: "BANNED" }, { status: 403 });
    }
    rateLimitReset(emailKey);
    // Kirish IP'sini yozamiz (klonlarni kuzatish uchun) — xato kirishni to'xtatmaydi
    try {
      if (ip && ip !== "unknown") await prisma.user.update({ where: { id: user.id }, data: { lastIp: ip, lastIpAt: new Date() } });
    } catch {}
    const role = user.role as string;
    const token = signSession(user);
    await setSessionCookie(token);
    return Response.json({ token, email: user.email, name: user.name, role, id: user.id });
  } catch (e) {
    console.error("login DB error", e);
    return Response.json({ error: "Server xatosi — qayta urinib ko‘ring" }, { status: 500 });
  }
}
