// Email yuborish — Resend API (resend.com)
const API = "https://api.resend.com/emails";

export function verificationUrl(token: string): string {
  const base = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

export async function sendVerificationEmail(to: string, url: string): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY sozlanmagan" };
  const from = process.env.RESEND_FROM || "DREAM KOREA <onboarding@resend.dev>";

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
          © 2026 DREAM KOREA · Toshkent ko‘chasi yoki Namangan · +998 94 328 05 13
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const r = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "DREAM KOREA — hisobingizni tasdiqlang",
        html,
        text: `DREAM KOREA — hisobingizni tasdiqlang: ${url} (24 soat amal qiladi)`,
      }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({} as Record<string, string>));
      return { ok: false, error: (d as { message?: string }).message ?? `Pochta xatosi (${r.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Pochta xizmatiga ulanib bo‘lmadi" };
  }
}
