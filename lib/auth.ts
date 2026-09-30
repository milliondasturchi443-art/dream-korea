// Simple mock auth using localStorage (client) + helper for role routing
export type Role = "STUDENT" | "TEACHER" | "ADMIN";
export const DEMO_USERS: Record<string, { password: string; role: Role; name: string }> = {
  "student@dreamkorea.uz": { password: "password123", role: "STUDENT", name: "Bobur" },
  "teacher@dreamkorea.uz": { password: "password123", role: "TEACHER", name: "Kim Ji-Hoon" },
  "admin@dreamkorea.uz": { password: "password123", role: "ADMIN", name: "Admin" },
};
export function roleHome(role: Role) {
  if (role === "ADMIN") return "/admin";
  if (role === "TEACHER") return "/teacher";
  return "/dashboard";
}
