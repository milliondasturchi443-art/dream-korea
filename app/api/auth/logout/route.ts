import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// POST /api/auth/logout — barcha session cookie'larni o'chirish
export async function POST() {
  const cs = await cookies();
  cs.delete("dk_token");
  cs.delete("dk_admin");
  return Response.json({ ok: true });
}
