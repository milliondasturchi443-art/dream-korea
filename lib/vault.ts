// "Cluster EMRK danniylar" ombori: talaba parollari AES-256-GCM bilan shifrlanadi.
// Kirish — alohida himoya kodi (AUTH_SECRET'dan chiqariladi), taqqoslash timing-safe.
import crypto from "node:crypto";
import { safeEqual } from "@/lib/secure-compare";

// Kalit AUTH_SECRET'dan olinadi — .env o'zgartirilsa parolni ochib bo'lmaydi.
function vaultKey(): Buffer {
  return crypto.createHash("sha256").update("vault:" + (process.env.AUTH_SECRET || "dev-secret-not-for-prod")).digest();
}

/** Parolni shifrlangan holga keltiradi (klient'ga hech qachon ochiq xolda berilmaydi) */
export function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", vaultKey(), iv);
  const data = Buffer.concat([c.update(password, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map(b => b.toString("base64url")).join(".");
}

/** Shifrlangan parolni ochadi — noto'g'ri xolatda null (parol topilmasa "—" ko'rsatiladi) */
export function decryptPassword(sealed: string | null | undefined): string | null {
  if (!sealed) return null;
  try {
    const [iv, tag, data] = sealed.split(".").map(s => Buffer.from(s, "base64url"));
    if (!iv || !tag || !data) return null;
    const d = crypto.createDecipheriv("aes-256-gcm", vaultKey(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(data), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Himoya kodi — AUTH_SECRET'dan determinativ chiqariladi (admin biladi). */
export function vaultCode(): string {
  const h = crypto.createHash("sha256").update("vault-code:" + (process.env.AUTH_SECRET || "")).digest("hex");
  // 10 ta raqam — oson yozib olinadi, lekin taxmin qilish deyarli imkonsiz (10^10 variatsiya)
  return parseInt(h.slice(0, 12), 16).toString().slice(0, 10).padStart(10, "0");
}

/** Kiritilgan kodni tekshiradi (timing-safe) */
export function verifyVaultCode(code: string): boolean {
  return safeEqual(code, vaultCode());
}
