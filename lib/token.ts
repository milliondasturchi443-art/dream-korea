// Yengil HMAC token — session uchun (JWTsiz, cookie'siz, localStorage bilan)
import crypto from "node:crypto";

const SECRET = process.env.AUTH_SECRET || "dreamkorea-dev-secret-change-me";

export function sign(payload: Record<string, unknown>, ttlMs = 7 * 24 * 3600 * 1000): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlMs })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verify(token?: string | null): Record<string, unknown> | null {
  if (!token || typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expect = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
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
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const data = verify(token);
  if (!data || data.role !== "ADMIN") return null;
  return { email: String(data.email ?? ""), role: "ADMIN" };
}
