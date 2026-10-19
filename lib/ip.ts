// Mijoz IP manzilini olish (Render/Reverse-proxy orqali).
// Faqat kuzatish uchun — ban qilishda ishlatilmaydi (IP o'zgaruvchan).
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0].trim();
  if (first) return first.slice(0, 64);
  const real = (req.headers.get("x-real-ip") || "").trim();
  if (real) return real.slice(0, 64);
  const cf = (req.headers.get("cf-connecting-ip") || "").trim();
  if (cf) return cf.slice(0, 64);
  return "";
}
