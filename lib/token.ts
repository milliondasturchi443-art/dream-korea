// Yengil HMAC token — session uchun (JWTsiz, cookie'siz, localStorage bilan)
import crypto from "node:crypto";

// Production'da AUTH_SECRET majburiy (kamida 32 belgi) — aks holda token soxtalashtirilishi mumkin.
// Tekshiruv chaqiruv paytida (lazy), build vaqtida emas.
const DEV_SECRET = "dev-only-secret-not-for-production-use-000000";
function secret(): string {
  const s = process.env.AUTH_SECRET || "";
  if (s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is missing or shorter than 32 chars");
  }
  return DEV_SECRET;
}

export const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;

// AES-256-GCM — klient o'qiy olmaydigan shifrlangan token (masalan, imtihon javoblari uchun)
function encKey(): Buffer {
  return crypto.createHash("sha256").update("enc:" + secret()).digest();
}

export function sealData(payload: Record<string, unknown>, ttlMs: number): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", encKey(), iv);
  const data = Buffer.concat([c.update(JSON.stringify({ ...payload, exp: Date.now() + ttlMs }), "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map(b => b.toString("base64url")).join(".");
}

export function openData(token?: string | null): Record<string, unknown> | null {
  if (!token || typeof token !== "string") return null;
  try {
    const [iv, tag, data] = token.split(".").map(s => Buffer.from(s, "base64url"));
    if (!iv || !tag || !data) return null;
    const d = crypto.createDecipheriv("aes-256-gcm", encKey(), iv);
    d.setAuthTag(tag);
    const out = JSON.parse(Buffer.concat([d.update(data), d.final()]).toString("utf8"));
    if (typeof out.exp === "number" && out.exp < Date.now()) return null;
    return out;
  } catch {
    return null;
  }
}

export function sign(payload: Record<string, unknown>, ttlMs = 7 * 24 * 3600 * 1000): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlMs })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verify(token?: string | null): Record<string, unknown> | null {
  if (!token || typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expect = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof data.exp === "number" && data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function adminFromRequest(req: Request): { email: string; role: string } | null {
  const data = readAuth(req);
  if (!data || data.role !== "ADMIN") return null;
  return { email: String(data.email ?? ""), role: "ADMIN" };
}

export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

// Tokenni Bearer header yoki cookie'dan o'qiydi (dk_admin > dk_token)
export function readAuth(req: Request): Record<string, unknown> | null {
  const header = req.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (bearer) {
    const d = verify(bearer);
    if (d) return d;
  }
  const ck = parseCookies(req.headers.get("cookie"));
  const fromCookie = ck["dk_admin"] || ck["dk_token"] || "";
  if (fromCookie) return verify(fromCookie);
  return null;
}

export function readAuthToken(req: Request): string {
  const header = req.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (bearer && verify(bearer)) return bearer;
  const ck = parseCookies(req.headers.get("cookie"));
  const fromCookie = ck["dk_admin"] || ck["dk_token"] || "";
  if (fromCookie && verify(fromCookie)) return fromCookie;
  return bearer;
}
