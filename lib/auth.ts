// Auth: real login via DB (fallback mock for dev). Admin — отдельный аккаунт из env.
// Единственный админ: dreamkorea@adminstator.kr / ahd@123WHDI
// Исходный запрос содержал недопустимые символы в email (dreamkorea!@#@!@adminstator.kr) — нормализован.
// Login нормализует email: удаляет ! # и лишние символы до @.
export type Role = "STUDENT" | "TEACHER" | "ADMIN";

export const ADMIN_EMAIL = "dreamkorea@adminstator.kr";
export const ADMIN_EMAIL_RAW = "dreamkorea!@#@!@adminstator.kr"; // как запрошено — поддерживается при логине

export function normalizeEmail(input: string): string {
  const t = (input || "").trim().toLowerCase();
  // если есть несколько @ — берём последний как разделитель
  const atIdx = t.lastIndexOf("@");
  if (atIdx === -1) return t.replace(/[!#]/g, "");
  const local = t.slice(0, atIdx).replace(/[!#]/g, "").replace(/[^a-z0-9._%+-]/g, "");
  const domain = t.slice(atIdx + 1).replace(/[!#]/g, "").replace(/[^a-z0-9.-]/g, "");
  return `${local}@${domain}`;
}

// Для демо-режима (если БД недоступна) — только реальные учётки, без демо
export const DEMO_USERS: Record<string, { password: string; role: Role; name: string }> = {
  // Админ — единственный привилегированный аккаунт
  "dreamkorea@adminstator.kr": { password: "ahd@123WHDI", role: "ADMIN", name: "Administrator" },
  // Для совместимости с исходным запросом (нормализуется к тому же)
  "dreamkorea!@#@!@adminstator.kr": { password: "ahd@123WHDI", role: "ADMIN", name: "Administrator" },
};

export function roleHome(role: Role) {
  if (role === "ADMIN") return "/admin";
  if (role === "TEACHER") return "/teacher";
  return "/dashboard";
}

export function isAdminEmail(email: string): boolean {
  return normalizeEmail(email) === ADMIN_EMAIL;
}
