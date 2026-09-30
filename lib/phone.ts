// UZ telefon: +998 XX XXX XX XX  (masalan +998 90 123 45 67)
// Saqlash formati: E.164 (+998901234567). Ko'rsatish: chiroyli.
// Qo'llab: KR (+82) va RU (+7) ixtiyoriy

export function digitsOnly(s: string) {
  return (s || "").replace(/\D/g, "");
}

// +998 ni avtomatik qo'shadi, 9 xonani formatlaydi
export function formatUZ(input: string): string {
  let d = digitsOnly(input);
  // agar 998 bilan boshlansa — saqlaymiz
  if (d.startsWith("998")) d = d.slice(3);
  // O'zbekistonda 9 xona: XX XXX XX XX
  // agar 0 bilan boshlansa olib tashlaymiz (mas 091234567 -> 911234567)
  if (d.startsWith("0") && d.length === 10) d = d.slice(1);
  d = d.slice(0, 9);
  if (!d) return "";
  // formatlash
  let out = "+998";
  if (d.length > 0) out += " " + d.slice(0, 2);
  if (d.length > 2) out += " " + d.slice(2, 5);
  if (d.length > 5) out += " " + d.slice(5, 7);
  if (d.length > 7) out += " " + d.slice(7, 9);
  return out;
}

export function toE164(input: string): string {
  const d = digitsOnly(input);
  if (!d) return "";
  if (d.startsWith("998") && d.length >= 12) return "+" + d.slice(0, 12);
  if (d.length === 9) return "+998" + d;
  if (d.length === 12 && d.startsWith("998")) return "+" + d;
  // KR
  if (d.startsWith("82")) return "+" + d;
  return "+" + d;
}

export function isValidUZ(input: string): boolean {
  const d = digitsOnly(input);
  const core = d.startsWith("998") ? d.slice(3) : d.startsWith("0") ? d.slice(1) : d;
  return core.length === 9;
}

export function telHref(input: string): string {
  return `tel:${toE164(input)}`;
}

export function whatsappHref(input: string, text?: string): string {
  const e164 = toE164(input).replace("+", "");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${e164}${q}`;
}

export function displayPhone(input: string): string {
  const d = digitsOnly(input);
  if (d.startsWith("998") || d.length === 9 || d.length === 12) return formatUZ(input);
  if (d.startsWith("82")) return `+82 ${d.slice(2)}`;
  return input;
}
