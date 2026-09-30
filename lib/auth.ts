// Auth: пока mock (localStorage). В проде замени на NextAuth/JWT + проверка в БД.
// DEMO_USERS — для демо; админ в проде — из ADMIN_EMAIL/ADMIN_PASSWORD (см. prisma/seed.ts)
export type Role = "STUDENT" | "TEACHER" | "ADMIN";
export const DEMO_USERS: Record<string, { password: string; role: Role; name: string }> = {
  "student@dreamkorea.uz": { password: "password123", role: "STUDENT", name: "Bobur" },
  "teacher@dreamkorea.uz": { password: "password123", role: "TEACHER", name: "Kim Ji-Hoon" },
  // Дефолт админ — ОБЯЗАТЕЛЬНО смени в .env: ADMIN_EMAIL / ADMIN_PASSWORD
  "admin@dreamkorea.uz": { password: "DreamKorea2026!Admin", role: "ADMIN", name: "Admin" },

};
export function roleHome(role: Role) {
  if (role === "ADMIN") return "/admin";
  if (role === "TEACHER") return "/teacher";
  return "/dashboard";
}
