import { prisma } from "@/lib/db";
import { darsUser } from "@/lib/dars-auth";
import { z } from "zod";
import { COLOR_KEYS, ICON_KEYS } from "@/lib/topik-cards";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  desc: z.string().trim().max(220).optional(),
  href: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .regex(/^(\/|https?:\/\/)/, "Havola / yoki https:// bilan boshlanishi kerak")
    .optional(),
  icon: z.enum(ICON_KEYS).optional(),
  color: z.enum(COLOR_KEYS).optional(),
  order: z.number().int().min(0).max(999).optional(),
  enabled: z.boolean().optional(),
});

// PATCH /api/topik-cards/[id] — faqat ADMIN
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await darsUser(req);
  if (!user || user.role !== "ADMIN")
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id))
    return Response.json({ error: "Noto'g'ri id" }, { status: 400 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success)
    return Response.json({ error: "Noto'g'ri ma'lumot" }, { status: 400 });
  if (Object.keys(parsed.data).length === 0)
    return Response.json({ error: "O'zgartirish yo'q" }, { status: 400 });

  try {
    const item = await prisma.topikCard.update({ where: { id }, data: parsed.data });
    return Response.json({ ok: true, item });
  } catch {
    return Response.json({ error: "Tahrirlab bo'lmadi" }, { status: 503 });
  }
}

// DELETE /api/topik-cards/[id] — faqat ADMIN
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await darsUser(_req);
  if (!user || user.role !== "ADMIN")
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id))
    return Response.json({ error: "Noto'g'ri id" }, { status: 400 });

  try {
    await prisma.topikCard.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "O'chirib bo'lmadi" }, { status: 503 });
  }
}
