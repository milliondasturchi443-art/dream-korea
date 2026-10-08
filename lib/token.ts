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
