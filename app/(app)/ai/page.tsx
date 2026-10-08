"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Send, Sparkles, BookOpen } from "lucide-react";

type Msg = { role: "user" | "assistant"; text: string; source?: "openai" | "reference" | "none" };

const prompts = [
  "은/는 va 이/가 farqini tushuntir",
  "사랑 so‘zini misollar bilan tushuntir",
  "TOPIK uchun maslahat ber",
  "Bu gapni tekshir: 저는 학생입니다",
];

export default function AiPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Assalomu alaykum! Savolingizni yozing — yordamchi grammatika, lug‘at va TOPIK bo‘yicha javob beradi. 🇰🇷", source: "reference" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text?: string) {
    const t = (text ?? input).trim();
    if (!t || loading) return;
    const next = [...messages, { role: "user" as const, text: t }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(m => ({ role: m.role, text: m.text })) }),
      });
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
    <div className="mx-auto max-w-[800px] p-4 lg:p-6 flex flex-col h-[calc(100vh-56px-48px)] lg:h-[calc(100vh-56px-24px)]">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#2563eb]"/> Yordamchi</h1>
        <p className="text-sm text-slate-500">OPENAI_API_KEY sozlangan bo‘lsa — AI; aks holda grammatika ma’lumotnomasidan halol javob.</p>
      </div>

      <div className="mt-3 flex gap-1.5 flex-wrap">
        {prompts.map(p => (
          <button key={p} onClick={() => send(p)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs hover:bg-slate-50">{p}</button>
        ))}
      </div>

      <Card className="mt-4 flex-1 overflow-hidden flex flex-col min-h-[320px]">
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-[#2563eb] text-white" : "bg-slate-100 text-slate-800"}`}>
                {m.role === "assistant" && m.source && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold mb-1.5 px-1.5 py-0.5 rounded-full ${m.source === "openai" ? "bg-blue-100 text-blue-700" : m.source === "reference" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {m.source === "openai" ? <><Sparkles className="h-3 w-3" /> AI</> : m.source === "reference" ? <><BookOpen className="h-3 w-3" /> Ma’lumotnoma</> : "Ogohlantirish"}
                  </span>
                )}
                <div>{m.text}</div>
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-slate-400">Javob tayyorlanmoqda…</div>}
        </div>
        <div className="border-t border-slate-200 p-3 flex gap-2">
          <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Savol yozing… masalan, 입니다 ni tushuntir" className="min-h-[44px] flex-1" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <Button onClick={() => send()} disabled={loading} className="shrink-0"><Send className="h-4 w-4" /></Button>
        </div>
      </Card>
    </div>
  );
}
