import { cookies } from "next/headers";
import { getSession, bumpTokenVersion } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/auth/logout — cookie'larni o'chirish + barcha qurilmalardagi tokenlarni bekor qilish
// (?all=0 bo'lsa faqat cookie o'chiriladi; standart — hamma joydan chiqish, chunki token stateless)
export async function POST(req: Request) {
  try {
    const s = await getSession(req);
    if (s?.id) await bumpTokenVersion(s.id);
  } catch (e) {
    console.error("logout revoke", e);
  }
  const cs = await cookies();
  cs.delete("dk_token");
  cs.delete("dk_admin");
  return Response.json({ ok: true });
}
