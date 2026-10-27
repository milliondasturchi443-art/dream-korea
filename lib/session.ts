// Yagona sessiya moduli: token + DB tekshiruvi (ban, tokenVersion, joriy rol).
// Barcha API route'lar shu yerdan foydalanadi — getAuth/requireAdmin nusxalari o'rniga.
import { prisma } from "@/lib/db";
import { readAuth, sign, SESSION_TTL_MS } from "@/lib/token";
import { ADMIN_EMAIL, isAdminEmail, normalizeEmail, type Role } from "@/lib/auth";

export type Session = {
  id: string;            // env-admin DB'da bo'lmasa — ""
  email: string;
  name: string;
  role: Role;
  tokenVersion: number;
  envAdmin: boolean;     // ADMIN_EMAIL egasi
  avatar: string | null; // avatar URL yoki null
};

export type SessionFail = "NO_TOKEN" | "NOT_FOUND" | "BANNED" | "REVOKED" | "DB_ERROR";

const ROLES = new Set<Role>(["STUDENT", "TEACHER", "ADMIN"]);
const asRole = (v: unknown): Role => (ROLES.has(v as Role) ? (v as Role) : "STUDENT");
const OBJECT_ID = /^[a-f\d]{24}$/i;

const userSelect = { id: true, email: true, name: true, role: true, banned: true, tokenVersion: true, avatar: true } as const;

export async function resolveSession(req: Request): Promise<{ session: Session | null; reason?: SessionFail }> {
  const d = readAuth(req);
  if (!d) return { session: null, reason: "NO_TOKEN" };

  const email = typeof d.email === "string" ? normalizeEmail(d.email) : "";
  const id = typeof d.id === "string" && OBJECT_ID.test(d.id) ? d.id : "";
  const tv = typeof d.tv === "number" ? d.tv : 0;
  const claimsEnvAdmin = d.role === "ADMIN" && !!email && isAdminEmail(email);

  let u: { id: string; email: string; name: string; role: string; banned: boolean; tokenVersion: number | null; avatar: string | null } | null = null;
  try {
    if (id) u = await prisma.user.findUnique({ where: { id }, select: userSelect });
    else if (email) u = await prisma.user.findUnique({ where: { email }, select: userSelect });
  } catch (e) {
    console.error("resolveSession DB error", e);
    return { session: null, reason: "DB_ERROR" };
  }

  if (!u) {
    // Env-admin DB'da bo'lmasligi mumkin (seed ishlatilmagan) — token imzosi yetarli
    if (claimsEnvAdmin) {
      return { session: { id: "", email: ADMIN_EMAIL, name: String(d.name ?? "Administrator"), role: "ADMIN", tokenVersion: 0, envAdmin: true, avatar: null } };
    }
    return { session: null, reason: "NOT_FOUND" };
  }
  if (u.banned) return { session: null, reason: "BANNED" };
  if ((u.tokenVersion ?? 0) !== tv) return { session: null, reason: "REVOKED" };

  const envAdmin = isAdminEmail(u.email) && (claimsEnvAdmin || u.role === "ADMIN");
  return {
    session: {
      id: u.id,
      email: u.email,
      name: u.name,
      role: envAdmin ? "ADMIN" : asRole(u.role),
      tokenVersion: u.tokenVersion ?? 0,
      envAdmin,
      avatar: u.avatar,
    },
  };
}

/** Tizimga kirgan, bloklanmagan foydalanuvchi yoki null */
export async function getSession(req: Request): Promise<Session | null> {
  return (await resolveSession(req)).session;
}

/** Berilgan rollardan biri bo'lsa — sessiya, aks holda null */
export async function requireRole(req: Request, ...roles: Role[]): Promise<Session | null> {
  const s = await getSession(req);
  return s && roles.includes(s.role) ? s : null;
}

/** Faqat asosiy admin (ADMIN roli + ADMIN_EMAIL) */
export async function requireAdmin(req: Request): Promise<Session | null> {
  const s = await getSession(req);
  return s && s.role === "ADMIN" && isAdminEmail(s.email) ? s : null;
}

/** Sessiya tokeni (30 kun) — tokenVersion bilan */
export function signSession(u: { id?: string | null; email: string; name: string; role: string; tokenVersion?: number | null; avatar?: string | null }): string {
  const payload: Record<string, unknown> = { email: u.email, name: u.name, role: u.role, tv: u.tokenVersion ?? 0 };
  if (u.id) payload.id = u.id;
  if (u.avatar) payload.avatar = u.avatar;
  return sign(payload, SESSION_TTL_MS);
}

/** Env-admin uchun token: DB'da admin yozuvi bo'lsa — uning id/tokenVersion'i bilan */
export async function signAdminSession(name = "Administrator"): Promise<string> {
  let dbAdmin: { id: string; tokenVersion: number | null } | null = null;
  try {
    dbAdmin = await prisma.user.findUnique({ where: { email: normalizeEmail(ADMIN_EMAIL) }, select: { id: true, tokenVersion: true } });
  } catch {}
  return signSession({ id: dbAdmin?.id, email: ADMIN_EMAIL, name, role: "ADMIN", tokenVersion: dbAdmin?.tokenVersion ?? 0 });
}

/** Foydalanuvchining barcha tokenlarini bekor qilish (logout, ban) */
export async function bumpTokenVersion(userId: string): Promise<void> {
  if (!userId) return;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { tokenVersion: true } });
  if (!u) return;
  await prisma.user.update({ where: { id: userId }, data: { tokenVersion: (u.tokenVersion ?? 0) + 1 } });
}
