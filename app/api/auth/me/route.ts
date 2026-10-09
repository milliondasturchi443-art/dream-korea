import { prisma } from "@/lib/db";
import { verify, sign, readAuthToken } from "@/lib/token";
import { normalizeEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = readAuthToken(req);
  const data = verify(token);
  if (!data) return Response.json({ error: "Token yaroqsiz" }, { status: 401 });
  let email = String(data.email ?? "");
  let name = String(data.name ?? "");
  let role = String(data.role ?? "STUDENT");
  let id = data.id ? String(data.id) : "";

  // Роль из БД — источник правды (исправляет баг когда админ меняет роль)
  try {
    const key = normalizeEmail(email);
    if (key) {
      const u = await prisma.user.findUnique({
        where: { email: key },
        select: { id: true, name: true, role: true, email: true },
      });
      if (u) {
        email = u.email;
        name = u.name;
        role = String(u.role);
        id = u.id;
      }
    } else if (id) {
      const u = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, role: true, email: true },
      });
      if (u) {
        email = u.email;
        name = u.name;
        role = String(u.role);
        id = u.id;
      }
    }
  } catch {}

  const payload: Record<string, unknown> = { email, name, role };
  if (id) payload.id = id;
  return Response.json({
    email: payload.email,
    name: payload.name,
    role: payload.role,
    id: payload.id ?? "",
    // Cookie orqali keldimi — klient localStorage/sessionStorage uchun taze token olsin
    token: sign(payload),
  });
}
