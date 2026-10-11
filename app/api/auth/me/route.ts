import { prisma } from "@/lib/db";
import { verify, sign, readAuthToken } from "@/lib/token";
import { normalizeEmail } from "@/lib/auth";
import { cookies } from "next/headers";

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
  const freshToken = sign(payload);
  // Cookie'ni yangilaymiz — admin rol o'zgartirsa, cookie-auth ham yangi rolni ko'rsin
  try {
    const cs = await cookies();
    const cur = cs.get("dk_token")?.value || "";
    const curRole = cur ? String(verify(cur)?.role ?? "") : "";
    if (cur && curRole !== role) {
      const isEnvAdmin = email === "dreamkorea@adminstator.kr";
      cs.set("dk_token", freshToken, {
        httpOnly: true,
        path: "/",
        ...(isEnvAdmin ? {} : { maxAge: 30 * 24 * 3600 }),
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
  } catch {}
  return Response.json({
    email: payload.email,
    name: payload.name,
    role: payload.role,
    id: payload.id ?? "",
    // Cookie orqali keldimi — klient localStorage/sessionStorage uchun taze token olsin
    token: freshToken,
  });
}
