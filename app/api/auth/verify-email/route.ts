import { verify } from "@/lib/token";
import { signSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/auth";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { clientIp } from "@/lib/ip";
import { safeEqual } from "@/lib/secure-compare";

export const dynamic = "force-dynamic";

// POST /api/auth/verify-email — kirgan 6 xonali kodni tekshirish (OTP)
export async function POST(req: Request) {
  let body: { email?: string; code?: string } = {};
  try { body = await req.json(); } catch {}
  const email = normalizeEmail(String(body.email ?? "").trim());
  const code = String(body.code ?? "").trim();
  if (!email || !code) return Response.json({ error: "Email va kod kiriting" }, { status: 400 });
  // OTP brute-force: email bo'yicha 5 urinish / 10 daqiqa, IP bo'yicha 30
  if (!rateLimit(`otp:email:${email}`, 5, 10 * 60_000) || !rateLimit(`otp:ip:${clientIp(req) || "unknown"}`, 30, 10 * 60_000)) {
    return tooMany(10 * 60);
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return Response.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
    if (user.emailVerified === true) {
      return Response.json({ ok: true, alreadyVerified: true });
    }
    if (!user.verifyCode || !user.verifyCodeExp) return Response.json({ error: "Kod yuborilmagan — qayta yuboring" }, { status: 400 });
    if (new Date(user.verifyCodeExp).getTime() < Date.now()) return Response.json({ error: "Kod muddati o‘tgan — qayta yuboring" }, { status: 400 });
    if (!safeEqual(String(user.verifyCode), code)) return Response.json({ error: "Kod noto‘g‘ri" }, { status: 400 });
    await prisma.user.update({ where: { email }, data: { emailVerified: true, verifyCode: null, verifyCodeExp: null } });
    const token = signSession(user);
    return Response.json({ ok: true, token, email: user.email, name: user.name, role: String(user.role), id: user.id });
  } catch (e) {
    console.error("verify-email POST", e);
    return Response.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// Emaildan keladigan GET havola: token → emailVerified=true + avtomatik kirish
export async function GET(req: Request) {
  const url = new URL(req.url);
  // Tashqi origin faqat NEXTAUTH_URL'dan (Host/X-Forwarded-Host sarlavhalarini soxtalashtirish mumkin)
  const origin = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  const fail = () => NextResponse.redirect(new URL("/verify-email?error=invalid", origin), 302);

  const token = url.searchParams.get("token") || "";
  const data = verify(token);
  if (!data || data.purpose !== "verify" || !data.email) return fail();
  const email = String(data.email);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return fail();
    if (user.emailVerified !== true) {
      await prisma.user.update({ where: { email }, data: { emailVerified: true } });
    }
    if (user.banned) return fail();
    const session = signSession(user);
    const res = NextResponse.redirect(new URL("/dashboard?verified=1", origin), 302);
    res.cookies.set("dk_token", session, {
      httpOnly: true,
      path: "/",
      maxAge: 30 * 24 * 3600,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch {
    return fail();
  }
}
