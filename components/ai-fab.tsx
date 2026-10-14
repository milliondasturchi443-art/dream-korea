"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Send, Sparkles, X, BookOpen, Bot } from "lucide-react";

type Msg = { role: "user" | "assistant"; text: string; source?: "openrouter" | "openai" | "reference" | "none" };

const prompts = [
  "은/는 va 이/가 farqini tushuntir",
  "TOPIK uchun maslahat ber",
];

// Axrorbek AI — o'ng pastki burchakdagi tugma, bosilganda chat ochiladi
export function AiFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Assalomu alaykum! Men Axrorbek AI — koreys tili yordamchisiman. Grammatika, lug'at, tarjima yoki TOPIK bo'yicha savol bering.", source: "openrouter" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // /ai sahifasida FAB kerak emas (o'z chati bor) — ikkita tugma ustma-ust kelmasin
  const hide = pathname === "/ai" || pathname?.startsWith("/ai?");

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading, open]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(text?: string) {
    const t = (text ?? input).trim();
    if (!t || loading) return;
    const next = [...messages, { role: "user" as const, text: t }];
    setMessages(next);
    setInput("");
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
        body: JSON.stringify({ messages: next.map(m => ({ role: m.role, text: m.text })) }),
      });
      if (r.status === 401) { window.location.href = "/login?next=/dashboard"; return; }
      const d = await r.json().catch(() => ({}));
      const reply = d.reply || "Server bilan bog'lanib bo'lmadi.";
      setMessages(m => [...m, { role: "assistant", text: reply, source: d.source ?? "none" }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "Server bilan bog'lanib bo'lmadi.", source: "none" }]);
    } finally { setLoading(false); }
  }

  if (hide) return null;

  return (
    <>
      {/* FAB — o'ng pastki burchak (mobil nav ustida, safe-area bilan) */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? "AI yopish" : "Axrorbek AI ochish"}
        className="fixed right-4 z-40 h-14 w-14 rounded-full bg-[#2563eb] text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,.55)] grid place-items-center active:scale-90 transition-transform hover:bg-[#1d4ed8]"
        style={{ bottom: "var(--dk-fab-bottom)" }}
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {/* Chat panel — keyboard-aware via dvh */}
      {open && (
        <div
          className="fixed right-3 z-40 w-[calc(100vw-24px)] max-w-[400px] rounded-2xl bg-white border border-slate-200 shadow-[0_16px_48px_-12px_rgba(15,27,61,.35)] flex flex-col overflow-hidden animate-in"
          style={{
            bottom: "var(--dk-chat-bottom)",
            height: "min(520px, calc(100dvh - 220px))",
          }}
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
                  <div>{m.text}</div>
                </div>
              </div>
            ))}
            {loading && <div className="text-[11px] text-slate-400">Javob tayyorlanmoqda…</div>}
          </div>

          <div className="border-t border-slate-200 p-2 flex gap-2 shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Savol yozing…"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-base sm:text-[13px] focus:border-blue-500 focus:outline-none max-h-24"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()} aria-label="Yuborish" className="shrink-0 h-10 w-10 rounded-xl bg-[#2563eb] text-white grid place-items-center hover:bg-[#1d4ed8] disabled:opacity-40 transition-colors">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
