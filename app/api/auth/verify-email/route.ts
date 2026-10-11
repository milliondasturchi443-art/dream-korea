import { verify, sign } from "@/lib/token";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/auth/verify-email — kirgan 6 xonali kodni tekshirish (OTP)
export async function POST(req: Request) {
  let body: { email?: string; code?: string } = {};
  try { body = await req.json(); } catch {}
  const email = normalizeEmail(String(body.email ?? "").trim());
  const code = String(body.code ?? "").trim();
  if (!email || !code) return Response.json({ error: "Email va kod kiriting" }, { status: 400 });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return Response.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
    if (user.emailVerified === true) {
      // allaqachon tasdiqlangan — darhol kirish
      const token = sign({ email: user.email, name: user.name, role: String(user.role), id: user.id });
      return Response.json({ ok: true, token, email: user.email, name: user.name, role: String(user.role), id: user.id });
    }
    if (!user.verifyCode || !user.verifyCodeExp) return Response.json({ error: "Kod yuborilmagan — qayta yuboring" }, { status: 400 });
    if (new Date(user.verifyCodeExp).getTime() < Date.now()) return Response.json({ error: "Kod muddati o‘tgan — qayta yuboring" }, { status: 400 });
    if (user.verifyCode !== code) return Response.json({ error: "Kod noto‘g‘ri" }, { status: 400 });
    await prisma.user.update({ where: { email }, data: { emailVerified: true, verifyCode: null, verifyCodeExp: null } });
    const token = sign({ email: user.email, name: user.name, role: String(user.role), id: user.id });
    return Response.json({ ok: true, token, email: user.email, name: user.name, role: String(user.role), id: user.id });
  } catch (e) {
    console.error("verify-email POST", e);
    return Response.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// Emaildan keladigan GET havola: token → emailVerified=true + avtomatik kirish
export async function GET(req: Request) {
  const url = new URL(req.url);
  // Render proxysida req.url ichki host bo'ladi — tashqi origin kerak
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const origin = host && !host.startsWith("localhost") && !host.startsWith("127.")
    ? `${proto}://${host}`
    : (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
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
    const session = sign({ email: user.email, name: user.name, role: String(user.role), id: user.id });
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
