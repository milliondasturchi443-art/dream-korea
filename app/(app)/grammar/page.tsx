"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { grammarList } from "@/lib/mock-data";
import { Search, CheckCircle2, XCircle } from "lucide-react";

type Exercise = { q: string; options: string[]; correct: number };

const exercises: Record<string, Exercise> = {
  "1": { q: "Bo‘sh joyni to‘ldiring: 저는 한국 사람___.", options: ["입니다", "은", "를"], correct: 0 },
  "2": { q: "Bo‘sh joyni to‘ldiring: 저 __ 학생입니다.", options: ["는", "가", "를"], correct: 0 },
  "3": { q: "Bo‘sh joyni to‘ldiring: 물___ 마셔요.", options: ["을", "가", "은"], correct: 0 },
  "4": { q: "Bo‘sh joyni to‘ldiring: 책___ 읽어요.", options: ["를", "는", "가"], correct: 0 },
  "5": { q: "Bo‘sh joyni to‘ldiring: 학교___ 갑니다.", options: ["에", "에서", "하고"], correct: 0 },
  "6": { q: "Bo‘sh joyni to‘ldiring: 카페___ 커피를 마셔요.", options: ["에서", "에", "는"], correct: 0 },
  "7": { q: "Bo‘sh joyni to‘ldiring: 친구___ 영화를 봅니다.", options: ["하고", "에", "를"], correct: 0 },
  "8": { q: "‘그리고’ qaysi ma’noda ishlatiladi?", options: ["Va (bog‘lovchi)", "Lekin", "Shuning uchun"], correct: 0 },
};

export default function GrammarPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string | null>("1");
  const [picked, setPicked] = useState<number | null>(null);
  const filtered = grammarList.filter(g => g.title.includes(q) || g.desc.toLowerCase().includes(q.toLowerCase()));

  function selectGrammar(id: string) {
    setActive(id);
    setPicked(null);
  }

  function answer(i: number) {
    if (picked !== null) return; // faqat bir marta javob beriladi
    setPicked(i);
  }

  const ex = active ? exercises[active] : undefined;

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Grammatika</h1>
        <p className="text-sm text-slate-500">Asosiy qo‘shimchalar va ularning qo‘llanishi</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Qidirish — masalan, 입니다" className="pl-9" value={q} onChange={e=>setQ(e.target.value)} />
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-4">
        <div className="space-y-2">
          {filtered.map(g => (
            <button key={g.id} onClick={()=>selectGrammar(g.id)} className={`w-full text-left rounded-2xl border p-4 flex items-center justify-between ${active===g.id ? "bg-[#eff6ff] border-blue-200" : "bg-white border-slate-200 hover:border-slate-300"}`}>
              <div>
                <div className="font-bold text-slate-900">{g.title}</div>
                <div className="text-xs text-slate-500">{g.desc}</div>
              </div>
              <Badge className="bg-white border border-slate-200 text-slate-600 text-[11px] shrink-0 ml-2">{g.level}</Badge>
            </button>
          ))}
        </div>

        <Card className="p-5 lg:p-6">
          {(() => {
            const g = grammarList.find(x => x.id === active);
            if (!g) return <div className="text-sm text-slate-500">Grammatikani tanlang</div>;
            return (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{g.title}</h2>
                  <p className="text-sm text-slate-500">{g.desc} · {g.level}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm leading-relaxed">
                  <div className="font-semibold">Izoh</div>
                  <p className="text-slate-600 mt-1">
                    {g.title === "입니다" && "Ot yoki ot so‘z birikmasidan keyin keladi. Rasmiy uslubda qo‘llanadi. Masalan: 학생입니다 — (U) talaba."}
                    {g.title === "은/는" && "Gap mavzusini bildiradi. Undosh bilan tugasa 은, unli bilan tugasa 는."}
                    {g.title === "이/가" && "Ega yuklamasi. Yangi axborotni ta’kidlash uchun."}
                    {g.title === "을/를" && "To‘ldiruvchi (obyekt) yuklamasi."}
                    {g.title === "에" && "O‘rin va paytni bildiradi: 학교에 갑니다 — Maktabga boraman."}
                    {g.title === "에서" && "Harakat joyi yoki kelib chiqish: 학교에서 공부합니다."}
                    {g.title === "하고" && "Va / bilan: 친구하고 영화 봅니다."}
                    {g.title === "그리고" && "Gaplarni bog‘laydi: 그리고, 내일 만납시다."}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="font-semibold text-sm">Misollar</div>
                  <div className="rounded-xl border border-slate-200 p-3 text-sm"><span className="font-medium">저는 학생입니다.</span><span className="text-slate-500"> — Men talabaman.</span></div>
                  <div className="rounded-xl border border-slate-200 p-3 text-sm"><span className="font-medium">이것은 책입니다.</span><span className="text-slate-500"> — Bu kitob.</span></div>
                </div>
                <div className="rounded-xl bg-[#eff6ff] border border-blue-200 p-4">
                  <div className="font-semibold text-sm text-[#0f1b3d]">Mashq</div>
                  {ex ? (
                    <>
                      <p className="text-sm text-slate-700 mt-1">{ex.q}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ex.options.map((opt, i) => {
                          const isCorrect = ex.correct === i;
                          const chosen = picked === i;
                          let cls = "bg-white border-slate-200 text-slate-800 hover:border-blue-300";
                          if (picked !== null) {
                            if (isCorrect) cls = "bg-emerald-50 border-emerald-300 text-emerald-700";
                            else if (chosen) cls = "bg-red-50 border-red-300 text-red-600";
                            else cls = "bg-white border-slate-200 text-slate-400";
                          }
                          return (
                            <Button key={i} size="sm" variant="outline" className={cls} onClick={() => answer(i)}>
                              {opt}
                              {picked !== null && isCorrect && <CheckCircle2 className="h-4 w-4 ml-1" />}
                              {picked !== null && chosen && !isCorrect && <XCircle className="h-4 w-4 ml-1" />}
                            </Button>
                          );
                        })}
                      </div>
                      {picked !== null && (
                        <p className={`text-sm mt-2 font-medium ${picked === ex.correct ? "text-emerald-600" : "text-red-600"}`}>
                          {picked === ex.correct ? "To‘g‘ri! ✓" : `Noto‘g‘ri. To‘g‘ri javob: ${ex.options[ex.correct]}`}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-500 mt-1">Mashq topilmadi</p>
                  )}
                </div>
              </div>
            );
          })()}
        </Card>
      </div>
    </div>
  );
}
