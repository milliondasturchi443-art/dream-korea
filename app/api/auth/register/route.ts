import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth";
import { signSession } from "@/lib/session";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { sendVerificationCode, generateOtp, emailVerifyEnabled } from "@/lib/email";
import { cookies } from "next/headers";
import { phoneKey as toPhoneKey } from "@/lib/phone";
import { clientIp } from "@/lib/ip";
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
  const verifyOn = emailVerifyEnabled();
  // Spam-ro'yxatdan o'tish himoyasi: IP bo'yicha 5 ta / soat
  if (!rateLimit(`register:${clientIp(req) || "unknown"}`, 5, 3600_000)) return tooMany(3600);
  const pKey = phone ? toPhoneKey(phone) : "";
  try {
    // Band raqam bilan ro'yxatdan o'tish mumkin emas (indekslangan phoneKey bo'yicha)
    if (pKey) {
      const taken = await prisma.user.findFirst({ where: { phoneKey: pKey }, select: { id: true } });
      if (taken) return Response.json({ error: "Bu telefon raqam allaqachon ro‘yxatda" }, { status: 409 });
    }
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return Response.json({ error: "Bu email allaqachon ro‘yxatda" }, { status: 409 });
    const hash = await bcrypt.hash(password, 10);
    const ip = clientIp(req);
    const user = await prisma.user.create({ data: { name, email, password: hash, phone: phone || undefined, phoneKey: pKey || undefined, role: "STUDENT", emailVerified: verifyOn ? false : true, regIp: ip || undefined, lastIp: ip || undefined, lastIpAt: ip ? new Date() : undefined } });
    if (!verifyOn) {
      // Tasdiqlash vaqtincha o'chirilgan — darhol session
      const token = signSession(user);
      const cs = await cookies();
      cs.set("dk_token", token, { httpOnly: true, path: "/", maxAge: 30 * 24 * 3600, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
      return Response.json({ token, email: user.email, name: user.name, role: user.role, id: user.id });
    }
    // OTP kod generatsiya qilish + saqlash (10 daqiqa)
    const code = generateOtp();
    const exp = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({ where: { email: user.email }, data: { verifyCode: code, verifyCodeExp: exp } }).catch(() => {});
    const sent = await sendVerificationCode(user.email, code);
    return Response.json({ requiresVerification: true, email: user.email, emailSent: sent.ok, emailError: sent.ok ? undefined : sent.error });
  } catch (e) {
    console.error("register error", e);
    return Response.json({ error: "Server xatosi — qayta urinib ko‘ring" }, { status: 500 });
  }
}
