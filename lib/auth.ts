// Auth: login faqat DB orqali. Admin — alohida akkaunt, email/parol faqat env'dan (ADMIN_EMAIL / ADMIN_PASSWORD).
export type Role = "STUDENT" | "TEACHER" | "ADMIN";

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "dreamkorea@adminstator.kr").trim().toLowerCase();

export function normalizeEmail(input: string): string {
  const t = (input || "").trim().toLowerCase();
  // если есть несколько @ — берём последний как разделитель
  const atIdx = t.lastIndexOf("@");
  if (atIdx === -1) return t.replace(/[!#]/g, "");
  const local = t.slice(0, atIdx).replace(/[!#]/g, "").replace(/[^a-z0-9._%+-]/g, "");
  const domain = t.slice(atIdx + 1).replace(/[!#]/g, "").replace(/[^a-z0-9.-]/g, "");
  return `${local}@${domain}`;
}

export function roleHome(role: Role) {
  if (role === "ADMIN") return "/adminstrationpanelofdreamkorea";
  if (role === "TEACHER") return "/teacher";
  return "/dashboard";
}

export function isAdminEmail(email: string): boolean {
  return normalizeEmail(email) === normalizeEmail(ADMIN_EMAIL);
}
