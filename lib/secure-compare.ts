import crypto from "node:crypto";

/** Vaqtga bog'liq bo'lmagan satr solishtirish (timing-attack'dan himoya) */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb) && a.length === b.length;
}
