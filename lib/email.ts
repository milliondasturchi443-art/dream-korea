// Email yuborish — Gmail SMTP (asosiy, domen cheklovisiz) + Resend (zaxira)
import nodemailer from "nodemailer";

const API = "https://api.resend.com/emails";

export function verificationUrl(token: string): string {
  const base = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

type SendResult = { ok: boolean; error?: string; via?: string };

// Email tasdiqlash faqat EMAIL_VERIFY_ENABLED="true" bo'lganda majburiy
export function emailVerifyEnabled(): boolean {
  return process.env.EMAIL_VERIFY_ENABLED === "true";
}

export async function sendVerificationEmail(to: string, url: string): Promise<SendResult> {
  const subject = "DREAM KOREA — hisobingizni tasdiqlang";
  const text = `DREAM KOREA — hisobingizni tasdiqlang: ${url} (24 soat amal qiladi)`;
  const html = `<!doctype html>
<html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="width" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="background:#0f1b3d;padding:22px 28px;">
          <div style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:1px;">DREAM KOREA</div>
          <div style="color:#93c5fd;font-size:11px;letter-spacing:3px;margin-top:4px;">KOREAN LANGUAGE CENTER</div>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:20px;color:#0f1b3d;">Hisobingizni tasdiqlang</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
            Salom! DREAM KOREA platformasida ro‘yxatdan o‘tdingiz. Hisobni faollashtirish uchun quyidagi tugmani bosing.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;">
            <tr><td style="background:#2563eb;border-radius:10px;">
              <a href="${url}" style="display:inline-block;padding:13px 26px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">Tasdiqlash</a>
            </td></tr>
          </table>
          <p style="margin:0 0 6px;font-size:13px;color:#64748b;">Havola 24 soat amal qiladi. Agar tugma ishlamasa, linkni brauzerga nusxalang:</p>
          <p style="margin:0;font-size:12px;word-break:break-all;"><a href="${url}" style="color:#2563eb;">${url}</a></p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 28px;font-size:12px;color:#94a3b8;">
          © 2026 DREAM KOREA · Namangan · +998 94 328 05 13
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  // 1) Brevo API — bepul, istalgan manzilga (sender gmail tekshirilgan bo'lishi kerak)
  const brevoKey = process.env.BREVO_API_KEY;
  if (brevoKey) {
    try {
      const r = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json", "api-key": brevoKey },
        body: JSON.stringify({
          sender: { name: "DREAM KOREA", email: process.env.BREVO_FROM || "noreply@gmail.com" },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });
      if (r.ok) return { ok: true, via: "brevo" };
      const d = await r.json().catch(() => ({} as Record<string, string>));
      console.error("brevo error", (d as { message?: string }).message ?? r.status);
    } catch (e) {
      console.error("brevo error", e instanceof Error ? e.message : e);
    }
  }

  // 2) Gmail SMTP — agar App Password bo'lsa
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
  if (gmailUser && gmailPass) {
    try {
      const t = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });
      await t.sendMail({ from: `"DREAM KOREA" <${gmailUser}>`, to, subject, html, text });
      return { ok: true, via: "gmail" };
    } catch (e) {
      console.error("gmail smtp error", e instanceof Error ? e.message : e);
      // Resend'ga o'tamiz
    }
  }

  // 3) Resend — domen tasdiqlanmaguncha faqat Resend akkaunt emailiga
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const from = process.env.RESEND_FROM || "DREAM KOREA <onboarding@resend.dev>";
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject, html, text }),
      });
      if (r.ok) return { ok: true, via: "resend" };
      const d = await r.json().catch(() => ({} as Record<string, string>));
      return { ok: false, error: (d as { message?: string }).message ?? `Pochta xatosi (${r.status})` };
    } catch {
      return { ok: false, error: "Pochta xizmatiga ulanib bo‘lmadi" };
    }
  }
  return { ok: false, error: "Email xizmati sozlanmagan (Brevo/Gmail/Resend)" };
}
