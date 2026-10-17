import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";
import { z } from "zod";
export const dynamic = "force-dynamic";

function isAdmin(req: Request) {
  const t = readAuthToken(req);
  const d = verify(t);
  return !!d && d.role === "ADMIN" && isAdminEmail(String(d.email ?? ""));
}

// GET /api/vocabulary — lug'atdagi qo'shilgan so'zlar (hamma uchun) + darslar (unitlar) so'zlari
export async function GET() {
  try {
    const [words, darsUnits] = await Promise.all([
      prisma.vocabulary.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
      prisma.darsUnit.findMany({
        orderBy: { order: "asc" },
        select: {
          order: true,
          title: true,
          level: true,
          vocab: { orderBy: { order: "asc" }, select: { ko: true, uz: true, tr: true } },
        },
      }),
    ]);
    const dars = darsUnits.map(u => ({
      unit: u.order,
      title: u.title,
      words: u.vocab.map(w => ({
        ko: w.ko,
        uz: w.uz,
        tr: w.tr || w.ko,
        level: u.level,
        cat: `unit-${u.order}`,
      })),
    }));
    return Response.json({ words, dars });
  } catch {
    return Response.json({ words: [], dars: [] });
  }
}

// POST /api/vocabulary — yangi so'z qo'shish (faqat admin)
export async function POST(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  let b: { ko?: string; uz?: string; tr?: string; level?: string; cat?: string } = {};
  try { b = await req.json(); } catch {}
  const parsed = z.object({
    ko: z.string().trim().min(1).max(60),
    uz: z.string().trim().min(1).max(120),
    tr: z.string().trim().max(80).optional().or(z.literal("")),
    level: z.enum(["A1", "A2", "B1"]).default("A1"),
    cat: z.string().trim().max(40).default("greeting"),
  }).safeParse(b);
  if (!parsed.success) return Response.json({ error: "So'z ma'lumotlarini tekshiring (ko'p belgi)" }, { status: 400 });
  try {
    const word = await prisma.vocabulary.create({
      data: {
        ko: parsed.data.ko,
        uz: parsed.data.uz,
        tr: parsed.data.tr || parsed.data.ko,
        level: parsed.data.level,
        cat: parsed.data.cat,
      },
    });
    return Response.json({ word }, { status: 201 });
  } catch (e) {
    console.error("POST /api/vocabulary", e);
    return Response.json({ error: "Saqlanmadi" }, { status: 500 });
  }
}

// DELETE /api/vocabulary?id=... — so'zni o'chirish (faqat admin)
export async function DELETE(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id")?.trim() || "";
  if (!id) return Response.json({ error: "id kerak" }, { status: 400 });
  try {
    await prisma.vocabulary.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "O'chirib bo'lmadi" }, { status: 500 });
  }
}
