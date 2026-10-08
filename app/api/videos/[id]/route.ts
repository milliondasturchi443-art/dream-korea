import { prisma } from "@/lib/db";
import { verify } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

function requireAdmin(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const d = verify(token);
  return !!d && d.role === "ADMIN" && isAdminEmail(String(d.email ?? ""));
}

// DELETE /api/videos/[id] — o'chirish (ADMIN)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  try {
    await prisma.video.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/videos/[id]", e);
    return Response.json({ error: "O'chirib bo'lmadi" }, { status: 500 });
  }
}
