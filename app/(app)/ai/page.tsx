"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Send, Sparkles, Languages, PenLine, HelpCircle } from "lucide-react";

type Msg = { role: "user"|"assistant"; text: string };

const prompts = [
  "은/는 va 이/가 farqini tushuntir",
  "사랑 so‘zini misollar bilan tushuntir",
  "TOPIK uchun 5 ta mashq tuz",
  "Bu gapni tekshir: 저는 학생입니다",
];

export default function AiPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Assalomu alaykum! Men DREAM KOREA AI yordamchisiman. Koreys grammatikasini tushuntiraman, so‘z tarjima qilaman, mashq tuzaman va TOPIKga tayyorlayman. Savolingizni yozing! 🇰🇷" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  function send(text?: string) {
    const t = (text ?? input).trim();
    if (!t) return;
    setMessages(m => [...m, { role: "user", text: t }]);
    setInput("");
    setLoading(true);
    // Mock AI response (abstraction — keyin OpenAI ulanadi)
    setTimeout(() => {
      const reply =
        t.toLowerCase().includes("은/는") ? "은/는 — mavzu yuklamasi. Oldin tilga olingan yoki umumiy mavzuni bildiradi. 이/가 — yangi axborot, ega urg‘usi. Masalan: 저는 학생입니다 (Men talabaman) — mavzu men. 학생이 왔습니다 — aynan talaba keldi." :
        t.toLowerCase().includes("사랑") ? "사랑 (sarang) — sevgi. Misollar: 사랑해요 — sevaman, 가족 사랑 — oila sevgisi, 첫사랑 — birinchi sevgi." :
        t.toLowerCase().includes("mashq") ? "5 ta mashq:\n1) 빈칸: 저는 ___ 입니다. (학생)\n2) Tarjima: 안녕하세요\n3) 은/는 bilan gap tuzing\n4) Listening: audio matn\n5) Reading: qisqa matn" :
        "Ajoyib savol! Qisqacha: koreys tilida SOV tartibi (ega-obyekt-kesim). Yana misol kerak bo‘lsa ayting, qo‘shimcha mashqlar ham beraman.";
      setMessages(m => [...m, { role: "assistant", text: reply }]);
      setLoading(false);
    }, 700);
  }

  return (
    <div className="mx-auto max-w-[800px] p-4 lg:p-6 flex flex-col h-[calc(100vh-56px-48px)] lg:h-[calc(100vh-56px-24px)]">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#2563eb]"/> AI yordamchi</h1>
        <p className="text-sm text-slate-500">Grammatika, tarjima, mashq va TOPIK bo‘yicha yordam</p>
      </div>

      <div className="mt-3 flex gap-1.5 flex-wrap">
        {prompts.map(p => (
          <button key={p} onClick={()=>send(p)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs hover:bg-slate-50">{p}</button>
        ))}
      </div>

      <Card className="mt-4 flex-1 overflow-hidden flex flex-col min-h-[320px]">
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((m,i) => (
            <div key={i} className={`flex ${m.role==="user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role==="user" ? "bg-[#2563eb] text-white" : "bg-slate-100 text-slate-800"}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-slate-400">Yozmoqda...</div>}
        </div>
        <div className="border-t border-slate-200 p-3 flex gap-2">
          <Textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Savol yozing... masalan, 입니다 ni tushuntir" className="min-h-[44px] flex-1" onKeyDown={e=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); send(); }}} />
          <Button onClick={()=>send()} disabled={loading} className="shrink-0"><Send className="h-4 w-4" /></Button>
        </div>
      </Card>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Card className="p-3 flex items-center gap-2"><Languages className="h-4 w-4 text-blue-600"/> Tarjima</Card>
        <Card className="p-3 flex items-center gap-2"><PenLine className="h-4 w-4 text-emerald-600"/> Mashq tuzish</Card>
        <Card className="p-3 flex items-center gap-2"><HelpCircle className="h-4 w-4 text-violet-600"/> Xatoni tushuntirish</Card>
      </div>
    </div>
  );
}
