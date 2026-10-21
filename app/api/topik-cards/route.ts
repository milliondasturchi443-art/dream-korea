import { prisma } from "@/lib/db";
import { darsUser } from "@/lib/dars-auth";
import { z } from "zod";
import { COLOR_KEYS, DEFAULT_TOPIK_CARDS, ICON_KEYS } from "@/lib/topik-cards";

export const dynamic = "force-dynamic";

const cardSchema = z.object({
  title: z.string().trim().min(1).max(80),
  desc: z.string().trim().max(220).default(""),
  href: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .regex(/^(\/|https?:\/\/)/, "Havola / yoki https:// bilan boshlanishi kerak"),
  icon: z.enum(ICON_KEYS).optional(),
  color: z.enum(COLOR_KEYS).optional(),
  order: z.number().int().min(0).max(999).optional(),
  enabled: z.boolean().optional(),
});

// GET /api/topik-cards — hammaga ochiq (talabalar /topik sahifasi).
// Bazada kartochka bo'lmasa standart 3 ta kartochka qaytariladi.
export async function GET() {
  try {
    const items = await prisma.topikCard.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    if (items.length) return Response.json({ items, source: "db" });
    return Response.json({ items: DEFAULT_TOPIK_CARDS, source: "default" });
  } catch {
    return Response.json({ items: DEFAULT_TOPIK_CARDS, source: "default" });
  }
}

// POST /api/topik-cards — faqat ADMIN.
// Birinchi qo'shilayotgan bo'lsa avval standart kartochkalar saqlanadi —
// shu bilan sayt hech qachon bo'sh qolmaydi va ular keyin tahrirlanadi.
export async function POST(req: Request) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN")
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const parsed = cardSchema.safeParse(await req.json());
  if (!parsed.success)
    return Response.json({ error: "Noto'g'ri ma'lumot — nom va havola majburiy" }, { status: 400 });

  const d = parsed.data;
  try {
    const count = await prisma.topikCard.count();
    if (count === 0) {
      // id avtomatik beriladi (ObjectId) — shuning uchun faqat maydonlar
      await prisma.topikCard.createMany({
        data: DEFAULT_TOPIK_CARDS.map(c => ({
          title: c.title,
          desc: c.desc,
          href: c.href,
          icon: c.icon,
          color: c.color,
          order: c.order,
          enabled: c.enabled,
        })),
      });
    }
    const item = await prisma.topikCard.create({
      data: {
        title: d.title,
        desc: d.desc,
        href: d.href,
        icon: d.icon ?? "BookOpen",
        color: d.color ?? "blue-600",
        order: d.order ?? count,
        enabled: d.enabled ?? true,
      },
    });
    return Response.json({ ok: true, item, seeded: count === 0 }, { status: 201 });
  } catch {
    return Response.json({ error: "Saqlab bo'lmadi" }, { status: 503 });
  }
}
