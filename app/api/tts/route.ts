import { NextRequest } from "next/server";
import { readAuth } from "@/lib/token";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { clientIp } from "@/lib/ip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory cache — har bir so'z uchun 1 marta Google'ga so'rov ketadi.
const CACHE = new Map<string, { buf: Buffer; ts: number }>();
const CACHE_TTL = 24 * 3600 * 1000;
const CACHE_MAX = 1000;

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchGoogleTts(text: string): Promise<Buffer | null> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ko&q=${encodeURIComponent(text)}`;
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Referer: "https://translate.google.com/",
        Accept: "audio/mpeg, audio/*;q=0.9, */*;q=0.5",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    // Haqiqiy audio kelganini tekshir (403 sahifasi HTML bo'lishi mumkin)
    if (buf.length < 500) return null;
    return buf;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const text = (req.nextUrl.searchParams.get("text") || "").trim().slice(0, 200);
  if (!text) return new Response("Bad Request", { status: 400 });
  // Ochiq proksi bo'lmasligi uchun: faqat tizimga kirganlar + so'rov limiti
  const auth = readAuth(req);
  if (!auth) return new Response("Unauthorized", { status: 401 });
  const who = String(auth.id ?? auth.email ?? clientIp(req) ?? "anon");

  const cached = CACHE.get(text);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return new Response(new Uint8Array(cached.buf), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  }

  if (!rateLimit(`tts:${who}`, 60, 60_000)) return tooMany(60);
  const buf = await fetchGoogleTts(text);
  if (!buf) return new Response("TTS failed", { status: 502 });

  if (CACHE.size >= CACHE_MAX) {
    const oldest = CACHE.keys().next().value;
    if (oldest !== undefined) CACHE.delete(oldest);
  }
  CACHE.set(text, { buf, ts: Date.now() });

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
