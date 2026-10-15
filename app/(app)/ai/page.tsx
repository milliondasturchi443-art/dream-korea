"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Send, Sparkles, BookOpen, ImagePlus, X } from "lucide-react";

type Msg = { role: "user" | "assistant"; text: string; images?: string[]; source?: "openrouter" | "openai" | "reference" | "none" };

const prompts = [
  "은/는 va 이/가 farqini tushuntir",
  "사랑 so‘zini misollar bilan tushuntir",
  "TOPIK uchun maslahat ber",
  "Bu gapni tekshir: 저는 학생입니다",
];
const MAX_IMAGES = 3;
const MAX_SIDE = 1024;

// Faylni canvas orqali kichraytirib, JPEG data URLga aylantiramiz (server yengil qabul qilsin)
async function fileToDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function AiPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Assalomu alaykum! Men Axrorbek AI — koreys tili yordamchisiman. Grammatika, lug‘at, tarjima yoki TOPIK bo‘yicha istalgan savol bering. Rasm (koreys yozuvi, savol varaqasi) yuborsangiz — tushuntiraman. 🇰🇷", source: "openrouter" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [draftImages, setDraftImages] = useState<string[]>([]);
  const [imgError, setImgError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function pickImages(files: FileList | null) {
    if (!files?.length) return;
    setImgError("");
    const room = MAX_IMAGES - draftImages.length;
    if (room <= 0) { setImgError(`Ko'pi bilta ${MAX_IMAGES} ta rasm`); return; }
    try {
      const picked: string[] = [];
      for (const f of [...files].slice(0, room)) {
        if (!f.type.startsWith("image/")) continue;
        picked.push(await fileToDataUrl(f));
      }
      if (!picked.length) { setImgError("Faqat rasm fayllari (JPG/PNG)"); return; }
      setDraftImages(prev => [...prev, ...picked].slice(0, MAX_IMAGES));
    } catch {
      setImgError("Rasmni o'qib bo'lmadi — boshqa rasm tanlang");
    }
  }

  async function send(text?: string) {
    const t = (text ?? input).trim();
    const imgs = draftImages;
    if ((!t && !imgs.length) || loading) return;
    const next: Msg[] = [...messages, { role: "user" as const, text: t, images: imgs.length ? imgs : undefined }];
    setMessages(next);
    setInput("");
    setDraftImages([]);
    setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const tok = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token");
        if (tok) headers.Authorization = `Bearer ${tok}`;
      } catch {}
      const r = await fetch("/api/ai", {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: next.map(m => ({ role: m.role, text: m.text, images: m.images })) }),
      });
      if (r.status === 401) { router.push("/login?next=/ai"); return; }
      const d = await r.json().catch(() => ({}));
      const reply = d.reply || "Server bilan bog‘lanib bo‘lmadi. Administratorga murojaat qiling: +998 94 328 05 13.";
      setMessages(m => [...m, { role: "assistant", text: reply, source: d.source ?? "none" }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "Server bilan bog‘lanib bo‘lmadi.", source: "none" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[800px] p-4 lg:p-6 flex flex-col" style={{ height: "calc(100dvh - var(--dk-bottom-nav) - 72px)" }}>
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#2563eb]"/> Axrorbek AI</h1>
        <p className="text-sm text-slate-500">Koreys tili bo‘yicha AI yordamchi: grammatika, lug‘at, tarjima, TOPIK — savol yozing yoki rasm yuboring.</p>
      </div>

      <div className="mt-3 flex gap-1.5 flex-wrap">
        {prompts.map(p => (
          <button key={p} onClick={() => send(p)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs min-h-[32px] hover:bg-slate-50">{p}</button>
        ))}
      </div>

      <Card className="mt-4 flex-1 overflow-hidden flex flex-col min-h-[320px]">
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-[#2563eb] text-white" : "bg-slate-100 text-slate-800"}`}>
                {m.role === "assistant" && m.source && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold mb-1.5 px-1.5 py-0.5 rounded-full ${m.source === "openrouter" ? "bg-[#eff6ff] text-[#2563eb]" : m.source === "openai" ? "bg-blue-100 text-blue-700" : m.source === "reference" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {m.source === "openrouter" ? <><Sparkles className="h-3 w-3" /> Axrorbek AI</> : m.source === "openai" ? <><Sparkles className="h-3 w-3" /> AI</> : m.source === "reference" ? <><BookOpen className="h-3 w-3" /> Ma’lumotnoma</> : "Ogohlantirish"}
                  </span>
                )}
                {m.images?.length ? (
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    {m.images.map((src, j) => <img key={j} src={src} alt={`rasm ${j + 1}`} className="max-h-40 rounded-xl border border-white/40 object-contain" />)}
                  </div>
                ) : null}
                <div>{m.text}</div>
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-slate-400">Javob tayyorlanmoqda…</div>}
        </div>
        {draftImages.length > 0 && (
          <div className="flex gap-2 border-t border-slate-100 px-3 pt-2">
            {draftImages.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} alt={`tanlangan ${i + 1}`} className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                <button aria-label="Rasmni o'chirish" onClick={() => setDraftImages(prev => prev.filter((_, j) => j !== i))} className="absolute -right-1.5 -top-1.5 rounded-full bg-slate-700 p-0.5 text-white"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}
        {imgError && <p className="px-3 pt-2 text-xs text-red-500">{imgError}</p>}
        <div className="border-t border-slate-200 p-3 flex gap-2 items-end">
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { pickImages(e.target.files); e.target.value = ""; }} />
          <Button variant="outline" size="icon" aria-label="Rasm yuklash" title={`Rasm yuklash (max ${MAX_IMAGES})`} onClick={() => fileRef.current?.click()} disabled={loading || draftImages.length >= MAX_IMAGES} className="shrink-0"><ImagePlus className="h-4 w-4" /></Button>
          <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Savol yozing yoki rasm tanlang…" className="min-h-[44px] flex-1" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <Button onClick={() => send()} disabled={loading} className="shrink-0"><Send className="h-4 w-4" /></Button>
        </div>
      </Card>
    </div>
  );
}
