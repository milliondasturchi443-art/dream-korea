import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { decryptPassword } from "@/lib/vault";
import { verifyVaultCode } from "@/lib/vault";
import { rateLimit, tooMany } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";

// "Cluster EMRK danniylar" ombori — faqat ADMIN + himoya kodi.
// Kiritilgan kod noto'g'ri bo'lsa — 403; 1 daqiqada 5 urinish limiti.
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return Response.json({ error: "Ruxsat yo'q" }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`vault:${ip}`, 5, 60_000)) return tooMany();

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!verifyVaultCode(code)) return Response.json({ error: "Himoya kodi noto'g'ri" }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, phone: true, email: true, vaultPassword: true, createdAt: true },
      orderBy: { createdAt: "desc" as const },
    });
    const rows = users.map(u => ({
      id: u.id,
      name: u.name,
      phone: u.phone ?? "",
      email: u.email,
      password: decryptPassword(u.vaultPassword) ?? "",
      createdAt: u.createdAt,
    }));
    // Faqat email-prefix (dreamkoreastudent…) bilan yaratilgan hisoblarni qoldiramizmi?
    // Yo'q — barcha STUDENT'lar "shu yerda ro'yxatdan o'tgan" deb ko'rsatiladi.
    return Response.json({ items: rows });
  } catch {
    return Response.json({ error: "Yuklab bo'lmadi" }, { status: 503 });
  }
}
