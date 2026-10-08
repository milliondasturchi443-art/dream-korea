import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth";
import { sign } from "@/lib/token";
import { sendVerificationEmail, verificationUrl, emailVerifyEnabled } from "@/lib/email";

export const dynamic = "force-dynamic";

// Tasdiqlash xatini qayta yuborish
export async function POST(req: Request) {
  let body: { email?: string } = {};
  try { body = await req.json(); } catch {}
  const email = normalizeEmail(String(body.email ?? "").trim());
  if (!email.includes("@")) return Response.json({ error: "Email noto‘g‘ri" }, { status: 400 });
  if (!emailVerifyEnabled()) return Response.json({ ok: true });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // Bor-yo‘qligini oshkor qilmaymiz
    if (!user || user.emailVerified === true) return Response.json({ ok: true });
    const token = sign({ email, purpose: "verify" }, 24 * 3600 * 1000);
    const sent = await sendVerificationEmail(email, verificationUrl(token));
    return Response.json({ ok: sent.ok, emailSent: sent.ok, error: sent.error });
  } catch {
    return Response.json({ error: "Server xatosi — qayta urinib ko‘ring" }, { status: 500 });
  }
}
