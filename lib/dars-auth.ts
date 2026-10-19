import { prisma } from "@/lib/db";
import { readAuth } from "@/lib/token";

export async function darsUser(req: Request) {
  const auth = readAuth(req);
  if (!auth || typeof auth.email !== "string") return null;
  const u = await prisma.user.findUnique({
    where: { email: auth.email.trim().toLowerCase() },
    select: { id: true, role: true, banned: true },
  });
  if (!u) return null;
  if (u.banned) return null; // cheklangan hisob — ruxsat yo'q
  return { id: u.id, role: u.role };
}
