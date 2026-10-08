import { verify, sign, readAuthToken } from "@/lib/token";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = readAuthToken(req);
  const data = verify(token);
  if (!data) return Response.json({ error: "Token yaroqsiz" }, { status: 401 });
  const payload: Record<string, unknown> = {
    email: String(data.email ?? ""),
    name: String(data.name ?? ""),
    role: String(data.role ?? "STUDENT"),
  };
  if (data.id) payload.id = String(data.id);
  return Response.json({
    email: payload.email,
    name: payload.name,
    role: payload.role,
    id: payload.id ?? "",
    // Cookie orqali keldimi — klient localStorage/sessionStorage uchun taze token olsin
    token: sign(payload),
  });
}
