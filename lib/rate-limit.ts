// Oddiy in-memory rate limiter (bitta instans uchun yetarli).
// Bir nechta instans bo'lsa — Redis/Upstash'ga o'tkazing.
type Bucket = { n: number; reset: number };
const hits = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

/** true — ruxsat, false — limit oshdi */
export function rateLimit(key: string, max = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = hits.get(key);
  if (!b || b.reset < now) {
    if (hits.size >= MAX_KEYS) {
      for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
      if (hits.size >= MAX_KEYS) hits.clear();
    }
    hits.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  b.n += 1;
  return b.n <= max;
}

/** Muvaffaqiyatli kirishdan keyin hisoblagichni tozalash */
export function rateLimitReset(key: string) {
  hits.delete(key);
}

export function tooMany(retrySec = 60) {
  return Response.json(
    { error: "Juda ko‘p urinish — birozdan keyin qayta urinib ko‘ring", code: "RATE_LIMIT" },
    { status: 429, headers: { "Retry-After": String(retrySec) } },
  );
}
