"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Send, Sparkles, X, BookOpen, Bot, ImagePlus } from "lucide-react";
import { filesToDataUrls, MAX_IMAGES } from "@/lib/image-utils";

type Msg = { role: "user" | "assistant"; text: string; images?: string[]; source?: "openrouter" | "openai" | "reference" | "none" };

const prompts = [
  "은/는 va 이/가 farqini tushuntir",
  "TOPIK uchun maslahat ber",
];

const FAB_POS_KEY = "dk_fab_pos";
const FAB_SIZE = 56;
const DRAG_THRESHOLD = 6;

type FabPos = { left: number; top: number };

function clampFab(left: number, top: number): FabPos {
  const vw = typeof window !== "undefined" ? window.innerWidth : 360;
  const vh = typeof window !== "undefined" ? window.innerHeight : 740;
  return {
    left: Math.min(Math.max(left, 8), Math.max(8, vw - FAB_SIZE - 8)),
    top: Math.min(Math.max(top, 8), Math.max(8, vh - FAB_SIZE - 8)),
  };
}

// Axrorbek AI — o'ng pastki burchakdagi tugma, bosilganda chat ochiladi.
// Tugma assistive touch uslubida suriladi (pointer drag), pozitsiya saqlanadi.
export function AiFab() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<FabPos | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ id: number; startX: number; startY: number; baseLeft: number; baseTop: number; moved: boolean } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Assalomu alaykum! Men Axrorbek AI — koreys tili yordamchisiman. Grammatika, lug'at, tarjima yoki TOPIK bo'yicha savol bering.", source: "openrouter" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [draftImages, setDraftImages] = useState<string[]>([]);
  const [imgError, setImgError] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // /ai sahifasida FAB kerak emas (o'z chati bor) — ikkita tugma ustma-ust kelmasin
  const hide = pathname === "/ai" || pathname?.startsWith("/ai?");

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading, open]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Saqlangan pozitsiyani tiklash + oynani o'zgarsa chegarada ushlab turish
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(FAB_POS_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          if (typeof p?.left === "number" && typeof p?.top === "number") setPos(clampFab(p.left, p.top));
        }
      } catch {}
    });
    const onResize = () => setPos(p => (p ? clampFab(p.left, p.top) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const savePos = useCallback((p: FabPos) => {
    try { localStorage.setItem(FAB_POS_KEY, JSON.stringify(p)); } catch {}
  }, []);

  function onFabPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseLeft: rect.left,
      baseTop: rect.top,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onFabPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
    }
    setPos(clampFab(d.baseLeft + dx, d.baseTop + dy));
  }

  function onFabPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const d = dragRef.current;
    dragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    if (!d) return;
    if (!d.moved) {
      // oddiy bosish — chatni och/yop
      setOpen(v => !v);
      return;
    }
    setDragging(false);
    // assistive touch uslubida eng yaqin chegaraga "yopishib qolish"
    setPos(p => {
      if (!p) return p;
      const vw = window.innerWidth;
      const snapped = clampFab(p.left + FAB_SIZE / 2 < vw / 2 ? 8 : vw - FAB_SIZE - 8, p.top);
      savePos(snapped);
      return snapped;
    });
  }

  function onFabPointerCancel() {
    dragRef.current = null;
    setDragging(false);
  }

  async function pickImages(files: FileList | null) {
    setImgError("");
    const { images, error } = await filesToDataUrls(files, draftImages.length);
    if (error) { setImgError(error); return; }
    setDraftImages(prev => [...prev, ...images].slice(0, MAX_IMAGES));
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
      if (r.status === 401) { router.push("/login?next=/dashboard"); return; }
      const d = await r.json().catch(() => ({}));
      const reply = d.reply || "Server bilan bog'lanib bo'lmadi.";
      setMessages(m => [...m, { role: "assistant", text: reply, source: d.source ?? "none" }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "Server bilan bog'lanib bo'lmadi.", source: "none" }]);
    } finally { setLoading(false); }
  }

  if (hide) return null;

  // FAB pozitsiyasi: saqlangan bo'lsa — undan, aks holda o'ng pastki burchak
  const fabStyle: React.CSSProperties = pos
    ? { left: pos.left, top: pos.top, right: "auto", bottom: "auto" }
    : { right: 16, bottom: "var(--dk-fab-bottom)" };

  return (
    <>
      {/* FAB — assistive touch uslubida suriladigan tugma */}
      <button
        onPointerDown={onFabPointerDown}
        onPointerMove={onFabPointerMove}
        onPointerUp={onFabPointerUp}
        onPointerCancel={onFabPointerCancel}
        onClick={e => { if (e.detail === 0) setOpen(v => !v); }}
        aria-label={open ? "AI yopish" : "Axrorbek AI ochish"}
        className={`fixed z-40 h-14 w-14 rounded-full bg-[#2563eb] text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,.55)] grid place-items-center select-none transition-[box-shadow,transform] duration-150 ${dragging ? "cursor-grabbing shadow-[0_12px_32px_-6px_rgba(37,99,235,.7)] scale-110" : "cursor-grab active:scale-95"}`}
        style={{ ...fabStyle, touchAction: "none" }}
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {/* Chat panel — keyboard-aware via dvh; FAB yonida ochiladi */}
      {open && (
        <div
          className="fixed z-40 w-[calc(100vw-24px)] max-w-[400px] rounded-2xl bg-white border border-slate-200 shadow-[0_16px_48px_-12px_rgba(15,27,61,.35)] flex flex-col overflow-hidden animate-in"
          style={
            pos
              ? {
                  left: pos.left + FAB_SIZE / 2 > (typeof window !== "undefined" ? window.innerWidth : 360) / 2
                    ? Math.max(12, pos.left + FAB_SIZE - Math.min(400, (typeof window !== "undefined" ? window.innerWidth : 360) - 24))
                    : pos.left,
                  bottom: Math.max(12, (typeof window !== "undefined" ? window.innerHeight : 740) - pos.top + 12),
                  height: "min(520px, calc(100dvh - 220px))",
                }
              : {
                  right: 12,
                  bottom: "var(--dk-chat-bottom)",
                  height: "min(520px, calc(100dvh - 220px))",
                }
          }
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#0f1b3d] text-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-4 w-4 text-blue-300 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-bold leading-tight">Axrorbek AI</div>
                <div className="text-[10px] text-slate-300 leading-tight">Koreys tili yordamchisi</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Yopish" className="rounded-lg p-2 hover:bg-white/10 transition-colors min-h-[40px] min-w-[40px] grid place-items-center">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-3 pt-2 flex gap-1.5 flex-wrap shrink-0">
            {prompts.map(p => (
              <button key={p} onClick={() => send(p)} disabled={loading} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] min-h-[32px] hover:bg-slate-50 disabled:opacity-50">{p}</button>
            ))}
          </div>

          <div ref={bodyRef} className="flex-1 overflow-auto p-3 space-y-2.5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-[#2563eb] text-white" : "bg-slate-100 text-slate-800"}`}>
                  {m.role === "assistant" && m.source && (
                    <span className={`inline-flex items-center gap-1 text-[9px] font-semibold mb-1 px-1.5 py-0.5 rounded-full ${m.source === "openrouter" || m.source === "openai" ? "bg-[#eff6ff] text-[#2563eb]" : m.source === "reference" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {m.source === "reference" ? <BookOpen className="h-2.5 w-2.5" /> : <Sparkles className="h-2.5 w-2.5" />}
                      {m.source === "reference" ? "Ma'lumotnoma" : "Axrorbek AI"}
                    </span>
                  )}
                  {m.images?.length ? (
                    <div className="mb-1 flex flex-wrap gap-1">
                      {m.images.map((src, j) => <img key={j} src={src} alt={`rasm ${j + 1}`} className="max-h-28 rounded-lg border border-white/40 object-contain" />)}
                    </div>
                  ) : null}
                  <div>{m.text}</div>
                </div>
              </div>
            ))}
            {loading && <div className="text-[11px] text-slate-400">Javob tayyorlanmoqda…</div>}
          </div>

          {draftImages.length > 0 && (
            <div className="flex gap-2 px-3 pt-2 shrink-0">
              {draftImages.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt={`tanlangan ${i + 1}`} className="h-14 w-14 rounded-lg border border-slate-200 object-cover" />
                  <button aria-label="Rasmni o'chirish" onClick={() => setDraftImages(prev => prev.filter((_, j) => j !== i))} className="absolute -right-1.5 -top-1.5 rounded-full bg-slate-700 p-0.5 text-white"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
          {imgError && <p className="px-3 pt-1.5 text-[11px] text-red-500 shrink-0">{imgError}</p>}
          <div className="border-t border-slate-200 p-2 flex gap-2 shrink-0 items-end">
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { pickImages(e.target.files); e.target.value = ""; }} />
            <button onClick={() => fileRef.current?.click()} disabled={loading || draftImages.length >= MAX_IMAGES} aria-label={`Rasm yuklash (max ${MAX_IMAGES})`} title={`Rasm yuklash (max ${MAX_IMAGES})`} className="shrink-0 h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-600 grid place-items-center hover:bg-slate-50 disabled:opacity-40 transition-colors">
              <ImagePlus className="h-4 w-4" />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Savol yozing yoki rasm tanlang…"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-base sm:text-[13px] focus:border-blue-500 focus:outline-none max-h-24"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button onClick={() => send()} disabled={loading || (!input.trim() && !draftImages.length)} aria-label="Yuborish" className="shrink-0 h-10 w-10 rounded-xl bg-[#2563eb] text-white grid place-items-center hover:bg-[#1d4ed8] disabled:opacity-40 transition-colors">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
