"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { topikQuestions } from "@/lib/mock-data";
import { useRouter } from "next/navigation";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function TopikExamPage() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [seconds, setSeconds] = useState(28 * 60 + 34);
  const q = topikQuestions[idx];

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const selected = answers[q.id];
  const isCorrect = selected === q.correct;

  function next() {
    setChecked(false);
    if (idx < topikQuestions.length - 1) setIdx(i => i + 1);
    else {
      // compute score
      const correct = Object.entries(answers).filter(([k, v]) => {
        const qq = topikQuestions.find(x => String(x.id) === k);
        return qq && v === qq.correct;
      }).length + (selected === q.correct ? 1 : 0) - (answers[q.id] ? 0 : 0); // careful: q not yet counted if not in answers
      // Simpler: include current
      const all = { ...answers, [q.id]: selected };
      const c = topikQuestions.filter(x => all[x.id] === x.correct).length;
      localStorage.setItem("dk_topik_score", JSON.stringify({ correct: c, total: topikQuestions.length, answers: all }));
      router.push("/topik/result");
    }
  }

  return (
    <div className="mx-auto max-w-[820px] p-4 lg:p-6 space-y-4">
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">TOPIK I — {idx + 1}-savol / {topikQuestions.length}</div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#2563eb]"><Clock className="h-4 w-4"/> {formatTime(seconds)}</span>
          <div className="hidden sm:block w-24"><Progress value={((idx+1)/topikQuestions.length)*100} /></div>
        </div>
      </Card>

      <Card className="p-5 lg:p-6">
        <div className="text-[15px] font-medium text-slate-900 leading-relaxed">{q.text}</div>
        {q.image !== undefined && (
          <div className="mt-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 h-36 grid place-items-center text-slate-400 text-sm">🖼️ Rasm / Listening audio (mock)</div>
        )}
        <div className="mt-5 grid gap-2.5">
          {q.options.map(o => {
            const active = selected === o.key;
            const showResult = checked;
            const correct = o.key === q.correct;
            return (
              <button
                key={o.key}
                onClick={() => !checked && setAnswers(a => ({ ...a, [q.id]: o.key }))}
                className={`text-left rounded-2xl border-2 p-4 flex gap-3 items-center transition-colors
                  ${!showResult && active ? "border-[#2563eb] bg-[#eff6ff]" : !showResult ? "border-slate-200 bg-white hover:border-slate-300" : ""}
                  ${showResult && correct ? "border-emerald-400 bg-emerald-50" : ""}
                  ${showResult && active && !correct ? "border-red-300 bg-red-50" : ""}
                `}
              >
                <span className={`h-8 w-8 rounded-full grid place-items-center text-sm font-bold shrink-0 border ${active ? "bg-[#2563eb] text-white border-[#2563eb]" : "bg-white text-slate-700 border-slate-200"}`}>{o.key}</span>
                <span className="text-sm font-medium text-slate-900">{o.text}</span>
              </button>
            );
          })}
        </div>

        {!checked ? (
          <Button className="w-full mt-5" disabled={!selected} onClick={() => setChecked(true)}>Javobni tekshirish</Button>
        ) : (
          <div className="mt-5 space-y-3">
            <div className={`rounded-xl p-3 text-sm font-medium ${isCorrect ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {isCorrect ? "To‘g‘ri! 🎉" : `Noto‘g‘ri. To‘g‘ri javob: ${q.correct}`} — {q.explanation}
            </div>
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setChecked(false)}><ChevronLeft className="h-4 w-4 mr-1"/> Qayta</Button>
              <Button onClick={next}>{idx === topikQuestions.length - 1 ? "Natijani ko‘rish" : "Keyingi"} <ChevronRight className="h-4 w-4 ml-1"/></Button>
            </div>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-1.5">
        {topikQuestions.map((_, i) => (
          <button key={i} onClick={() => { setIdx(i); setChecked(false); }} className={`h-8 w-8 rounded-lg text-xs font-bold border ${i===idx ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : answers[topikQuestions[i].id] ? "bg-[#eff6ff] text-[#2563eb] border-blue-200" : "bg-white text-slate-500 border-slate-200"}`}>{i+1}</button>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setIdx(i => Math.max(0, i-1))} disabled={idx===0}>Oldingi</Button>
        <Button variant="outline" onClick={() => { if(confirm("Testni yakunlaysizmi?")) router.push("/topik/result"); }}>Yakunlash</Button>
      </div>
    </div>
  );
}
