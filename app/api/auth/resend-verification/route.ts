import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth";
import { sendVerificationCode, generateOtp, emailVerifyEnabled } from "@/lib/email";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { clientIp } from "@/lib/ip";

export const dynamic = "force-dynamic";

// Tasdiqlash KODINI qayta yuborish (OTP)
export async function POST(req: Request) {
  let body: { email?: string } = {};
  try { body = await req.json(); } catch {}
  const email = normalizeEmail(String(body.email ?? "").trim());
  if (!email.includes("@")) return Response.json({ error: "Email noto‘g‘ri" }, { status: 400 });
  // Spam himoyasi: email bo'yicha 3 ta xat / 10 daqiqa, IP bo'yicha 10
  if (!rateLimit(`resend:email:${email}`, 3, 10 * 60_000) || !rateLimit(`resend:ip:${clientIp(req) || "unknown"}`, 10, 10 * 60_000)) {
    return tooMany(10 * 60);
  }
  if (!emailVerifyEnabled()) return Response.json({ ok: true });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // Bor-yo‘qligini oshkor qilmaymiz
    if (!user || user.emailVerified === true) return Response.json({ ok: true });
    const code = generateOtp();
    const exp = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({ where: { email }, data: { verifyCode: code, verifyCodeExp: exp } }).catch(() => {});
    const sent = await sendVerificationCode(email, code);
    return Response.json({ ok: sent.ok, emailSent: sent.ok, error: sent.error });
  } catch {
    return Response.json({ error: "Server xatosi — qayta urinib ko‘ring" }, { status: 500 });
  }
}
