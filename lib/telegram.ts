// Telegram Login Widget auth tekshiruvi (HMAC-SHA256)
import crypto from "node:crypto";

export type TelegramAuthPayload = {
  id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number | string;
  hash: string;
};

export function telegramBotToken(): string {
  return (process.env.TELEGRAM_BOT_TOKEN || "").trim();
}
export function telegramBotUsername(): string {
  return (process.env.TELEGRAM_BOT_USERNAME || "").trim().replace(/^@/, "");
}

// Hash tekshiruvi + auth_date eskirishini tekshirish (maks. 1 soat)
export function verifyTelegramAuth(p: TelegramAuthPayload, botToken: string): boolean {
  try {
    const hash = String(p.hash || "");
    const authDate = Number(p.auth_date);
    if (!hash || !authDate) return false;
    if (Math.abs(Date.now() / 1000 - authDate) > 3600) return false;
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(p)) {
      if (k === "hash" || v === undefined || v === null) continue;
      data[k] = String(v);
    }
    const dataCheckString = Object.keys(data).sort().map(k => `${k}=${data[k]}`).join("\n");
    const secretKey = crypto.createHash("sha256").update(botToken).digest();
    const expect = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
    const a = Buffer.from(expect, "hex");
    const b = Buffer.from(hash, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
