import { verify } from "@/lib/token";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const data = verify(token);
  if (!data) return Response.json({ error: "Token yaroqsiz" }, { status: 401 });
  return Response.json({
    email: String(data.email ?? ""),
    name: String(data.name ?? ""),
    role: String(data.role ?? "STUDENT"),
    id: data.id ? String(data.id) : "",
  });
}
