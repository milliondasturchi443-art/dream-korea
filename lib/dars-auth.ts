import { getSession } from "@/lib/session";

// Eski API bilan moslik: { id, role } — ban va tokenVersion lib/session.ts'da tekshiriladi
export async function darsUser(req: Request) {
  const s = await getSession(req);
  if (!s || !s.id) return null;
  return { id: s.id, role: s.role };
}
