import { resolveSession, signSession } from "@/lib/session";
import { verify } from "@/lib/token";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Ban / tokenVersion / joriy rol — barchasi lib/session.ts'da tekshiriladi
  const { session: s, reason } = await resolveSession(req);
  if (!s) {
    if (reason === "BANNED") {
      return Response.json({ error: "Hisobingiz cheklangan.", code: "BANNED" }, { status: 403 });
    }
    if (reason === "DB_ERROR") {
      return Response.json({ error: "Server vaqtincha mavjud emas" }, { status: 503 });
    }
    return Response.json({ error: "Token yaroqsiz", code: reason }, { status: 401 });
  }

  const freshToken = signSession(s);
  // Cookie'ni yangilaymiz — admin rol o'zgartirsa, cookie-auth ham yangi rolni ko'rsin
  try {
    const cs = await cookies();
    const cur = cs.get("dk_token")?.value || "";
    const curRole = cur ? String(verify(cur)?.role ?? "") : "";
    if (cur && curRole !== s.role) {
      cs.set("dk_token", freshToken, {
        httpOnly: true,
        path: "/",
        maxAge: 30 * 24 * 3600,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
  } catch {}
  return Response.json({
    email: s.email,
    name: s.name,
    role: s.role,
    id: s.id,
    // Cookie orqali keldimi — klient localStorage/sessionStorage uchun taze token olsin
    token: freshToken,
  });
}
