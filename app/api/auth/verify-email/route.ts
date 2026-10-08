import { verify, sign } from "@/lib/token";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Emaildan keladigan GET havola: token → emailVerified=true + avtomatik kirish
export async function GET(req: Request) {
  const url = new URL(req.url);
  const fail = () => NextResponse.redirect(new URL("/verify-email?error=invalid", url.origin), 302);

  const token = url.searchParams.get("token") || "";
  const data = verify(token);
  if (!data || data.purpose !== "verify" || !data.email) return fail();
  const email = String(data.email);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return fail();
    if (user.emailVerified !== true) {
      await prisma.user.update({ where: { email }, data: { emailVerified: true } });
    }
    const session = sign({ email: user.email, name: user.name, role: String(user.role), id: user.id });
    const res = NextResponse.redirect(new URL("/dashboard?verified=1", url.origin), 302);
    res.cookies.set("dk_token", session, {
      httpOnly: true,
      path: "/",
      maxAge: 30 * 24 * 3600,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch {
    return fail();
  }
}
