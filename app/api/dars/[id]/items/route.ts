import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";
import { youtubeId } from "@/lib/youtube";
import { z } from "zod";
export const dynamic = "force-dynamic";

const MAX_VOCAB = 35;
type Kind = "vocab" | "video" | "grammar" | "listening" | "writing";
const KINDS: Kind[] = ["vocab", "video", "grammar", "listening", "writing"];

function requireAdmin(req: Request) {
  const t = readAuthToken(req);
  const d = verify(t) as Record<string, unknown> | null;
  return !!d && d.role === "ADMIN" && isAdminEmail(String(d.email ?? ""));
}

const vocabSchema = z.object({
  ko: z.string().trim().min(1).max(60),
  uz: z.string().trim().min(1).max(120),
  tr: z.string().trim().max(80).optional().or(z.literal("")),
  exampleKo: z.string().trim().max(200).optional().or(z.literal("")),
  exampleUz: z.string().trim().max(200).optional().or(z.literal("")),
});

const videoSchema = z.object({
  title: z.string().trim().min(1).max(150),
  videoUrl: z.string().trim().min(1).max(400),
  duration: z.string().trim().max(20).optional().or(z.literal("")),
});

const grammarSchema = z.object({
  title: z.string().trim().min(1).max(150),
  pattern: z.string().trim().max(300).optional().or(z.literal("")),
  explain: z.string().trim().min(1).max(8000),
  examples: z.array(z.object({ ko: z.string().max(300), uz: z.string().max(300) })).max(30).default([]),
  exercises: z.array(z.object({ q: z.string().max(500), options: z.array(z.string().max(200)).min(2).max(6), correct: z.number().int().min(0).max(5), hint: z.string().max(300).optional() })).max(30).default([]),
});

const listeningSchema = z.object({
  title: z.string().trim().min(1).max(150),
  audioUrl: z.string().trim().max(500).optional().or(z.literal("")),
  audioText: z.string().trim().max(1000).optional().or(z.literal("")),
  transcript: z.string().trim().max(4000).optional().or(z.literal("")),
  questions: z.array(z.object({
    text: z.string().max(500),
    options: z.array(z.object({ key: z.string().max(5), text: z.string().max(300) })).min(2).max(6),
    correct: z.string().max(5),
    explanation: z.string().max(500).optional(),
  })).max(20).default([]),
});

const writingSchema = z.object({
  title: z.string().trim().min(1).max(150),
  prompt: z.string().trim().min(1).max(4000),
  criteria: z.string().trim().max(2000).optional().or(z.literal("")),
  sampleAnswer: z.string().trim().max(4000).optional().or(z.literal("")),
});

const schemas = { vocab: vocabSchema, video: videoSchema, grammar: grammarSchema, listening: listeningSchema, writing: writingSchema };

// Prisma modellari turli generic imzo oladi — umumiy delegate sifatida ishlatamiz
/* eslint-disable @typescript-eslint/no-explicit-any */
type ItemDelegate = {
  findFirst: (args: any) => Promise<any>;
  findMany: (args?: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
  count: (args: any) => Promise<number>;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

function modelFor(kind: Kind): ItemDelegate {
  switch (kind) {
    case "vocab": return prisma.darsVocab;
    case "video": return prisma.darsVideo;
    case "grammar": return prisma.darsGrammar;
    case "listening": return prisma.darsListening;
    case "writing": return prisma.darsWriting;
  }
}

function clean(data: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    if (typeof v === "string") out[k] = v.trim();
    else out[k] = v;
  }
  return out;
}

// POST /api/dars/[id]/items — yangi bo'lim elementi (faqat admin)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  let b: { kind?: string; data?: Record<string, unknown> } = {};
  try { b = await req.json(); } catch {}
  const kind = String(b.kind ?? "") as Kind;
  if (!KINDS.includes(kind)) return Response.json({ error: "Noto'g'ri bo'lim turi" }, { status: 400 });
  const unit = await prisma.darsUnit.findUnique({ where: { id }, select: { id: true } });
  if (!unit) return Response.json({ error: "Unit topilmadi" }, { status: 404 });

  if (kind === "vocab") {
    const count = await prisma.darsVocab.count({ where: { unitId: id } });
    if (count >= MAX_VOCAB) return Response.json({ error: `Bir unitda ko'pi bilan ${MAX_VOCAB} ta so'z bo'lishi mumkin` }, { status: 400 });
  }

  const parsed = schemas[kind].safeParse(b.data ?? {});
  if (!parsed.success) return Response.json({ error: "Ma'lumotlarni tekshiring" }, { status: 400 });

  if (kind === "video") {
    const url = String((parsed.data as { videoUrl: string }).videoUrl);
    if (!youtubeId(url) && !/^https?:\/\//i.test(url)) return Response.json({ error: "YouTube havolasi yoki https:// manzil kiriting" }, { status: 400 });
  }

  try {
    const last = await modelFor(kind).findFirst({ where: { unitId: id }, orderBy: { order: "desc" } });
    const item = await modelFor(kind).create({ data: { ...clean(parsed.data as Record<string, unknown>), unitId: id, order: (Number(last?.order) || -1) + 1 } });
    return Response.json({ item }, { status: 201 });
  } catch (e) {
    console.error("POST items", e);
    return Response.json({ error: "Saqlanmadi" }, { status: 500 });
  }
}

// PATCH /api/dars/[id]/items — elementni tahrirlash (faqat admin)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  let b: { kind?: string; itemId?: string; data?: Record<string, unknown> } = {};
  try { b = await req.json(); } catch {}
  const kind = String(b.kind ?? "") as Kind;
  const itemId = String(b.itemId ?? "").trim();
  if (!KINDS.includes(kind) || !itemId) return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  const parsed = schemas[kind].safeParse(b.data ?? {});
  if (!parsed.success) return Response.json({ error: "Ma'lumotlarni tekshiring" }, { status: 400 });
  if (kind === "video") {
    const url = String((parsed.data as { videoUrl: string }).videoUrl);
    if (!youtubeId(url) && !/^https?:\/\//i.test(url)) return Response.json({ error: "YouTube havolasi yoki https:// manzil kiriting" }, { status: 400 });
  }
  try {
    const own = await modelFor(kind).findFirst({ where: { id: itemId, unitId: id } });
    if (!own) return Response.json({ error: "Element topilmadi" }, { status: 404 });
    const item = await modelFor(kind).update({ where: { id: itemId }, data: clean(parsed.data as Record<string, unknown>) });
    return Response.json({ ok: true, item });
  } catch (e) {
    console.error("PATCH items", e);
    return Response.json({ error: "Saqlanmadi" }, { status: 500 });
  }
}

// DELETE /api/dars/[id]/items?kind=&itemId= — o'chirish (faqat admin)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  const sp = new URL(req.url).searchParams;
  const kind = String(sp.get("kind") ?? "") as Kind;
  const itemId = String(sp.get("itemId") ?? "").trim();
  if (!KINDS.includes(kind) || !itemId) return Response.json({ error: "Noto'g'ri so'rov" }, { status: 400 });
  try {
    const own = await modelFor(kind).findFirst({ where: { id: itemId, unitId: id } });
    if (!own) return Response.json({ error: "Element topilmadi" }, { status: 404 });
    await modelFor(kind).delete({ where: { id: itemId } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE items", e);
    return Response.json({ error: "O'chirib bo'lmadi" }, { status: 500 });
  }
}
