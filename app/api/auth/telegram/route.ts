import { prisma } from "@/lib/db";
import { sign } from "@/lib/token";
import { cookies } from "next/headers";
import { verifyTelegramAuth, telegramBotToken, telegramBotUsername, type TelegramAuthPayload } from "@/lib/telegram";
import * as bcrypt from "bcryptjs";
export const dynamic = "force-dynamic";

const DAY30 = 30 * 24 * 3600;

// GET /api/auth/telegram — widget uchun bot username + bot id (ochiq ma'lumot)
export async function GET() {
  const username = telegramBotUsername();
  const token = telegramBotToken();
  if (!username || !token) return Response.json({ enabled: false });
  const botId = token.split(":")[0] || "";
  return Response.json({ enabled: true, username, botId });
}

// POST /api/auth/telegram — widget'dan kelgan ma'lumotni tekshirib, session beradi
export async function POST(req: Request) {
  const botToken = telegramBotToken();
  if (!botToken) return Response.json({ error: "Telegram kirish sozlanmagan" }, { status: 503 });
  let body: Partial<TelegramAuthPayload> = {};
  try { body = await req.json(); } catch {}
  if (!body.id || !body.hash || !body.auth_date) return Response.json({ error: "Telegram ma'lumoti to'liq emas" }, { status: 400 });
  if (!verifyTelegramAuth(body as TelegramAuthPayload, botToken)) {
    return Response.json({ error: "Telegram tekshiruvi failed — qayta urinib ko'ring" }, { status: 401 });
  }
  const tgId = String(body.id);
  const name = [body.first_name, body.last_name].filter(Boolean).join(" ").trim() || body.username || "Telegram foydalanuvchi";
  try {
    let user = await prisma.user.findFirst({ where: { telegramId: tgId } });
    if (!user) {
      // Yangi akkaunt: unikal email (Telegram id asosida), tasodifiy parol (foydalanuvchi bilmaydi)
      const email = `tg${tgId}@telegram.dk`;
      const password = await bcrypt.hash(Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2), 10);
      user = await prisma.user.create({
        data: {
          email, name, password, role: "STUDENT", emailVerified: true,
          telegramId: tgId, telegramUsername: body.username ?? null,
          avatar: body.photo_url ?? null,
        },
      });
    } else if (body.username || body.photo_url) {
      // Profil ma'lumotini yangilab turamiz
      user = await prisma.user.update({
        where: { id: user.id },
        data: { telegramUsername: body.username ?? user.telegramUsername, avatar: body.photo_url ?? user.avatar },
      });
    }
    const token = sign({ email: user.email, name: user.name, role: user.role, id: user.id });
    const cs = await cookies();
    cs.set("dk_token", token, { httpOnly: true, path: "/", maxAge: DAY30, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    return Response.json({ token, email: user.email, name: user.name, role: user.role, id: user.id });
  } catch (e) {
    console.error("telegram auth", e);
    return Response.json({ error: "Server xatosi — qayta urinib ko'ring" }, { status: 500 });
  }
}
