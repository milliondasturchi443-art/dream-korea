import { prisma } from "@/lib/db";
import { readAuth } from "@/lib/token";

export async function darsUser(req: Request) {
  const auth = readAuth(req);
  if (!auth || typeof auth.email !== "string") return null;
  return prisma.user.findUnique({ where: { email: auth.email.trim().toLowerCase() }, select: { id: true, role: true } });
}
