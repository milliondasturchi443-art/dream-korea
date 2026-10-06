"use client";
import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

type Opt = { key: string; text: string };
type Q = { id: string; text: string; options: Opt[]; correct: string; explanation: string };

function formatTime(s: number) {
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

function TopikExamInner() {
  const search = useSearchParams();
  const router = useRouter();
  const testId = search.get("id") ?? "seed_topik1_reading";
  const [questions, setQuestions] = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<{ title: string; level: string; type: string } | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [seconds, setSeconds] = useState(40 * 60);
  const q = questions[idx];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/topik/${encodeURIComponent(testId)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setQuestions(Array.isArray(d.questions) ? d.questions : []);
        setMeta({ title: d.title ?? testId, level: d.level ?? "TOPIK I", type: d.type ?? "Reading" });
        const mins = d.type === "Full" ? 80 : d.level === "TOPIK II" ? 70 : 40;
        setSeconds(mins * 60);
      })
      .catch(e => { toast.error(String(e.message ?? e)); })
      .finally(() => setLoading(false));
  }, [testId]);

  useEffect(() => {
    if (loading || !questions.length) return;
    const t = setInterval(() => setSeconds(s => (s <= 1 ? (clearInterval(t), 0) : s - 1)), 1000);
    return () => clearInterval(t);
  }, [loading, questions.length]);

  const selected = q ? answers[q.id] : undefined;
  const isCorrect = selected === q?.correct;

  const allAnswered = useMemo(() => questions.length > 0 && questions.every(x => answers[x.id]), [questions, answers]);

  async function finish() {
    if (!questions.length) return;
    const cur = { ...answers };
    if (q && selected) cur[q.id] = selected;
    const correct = questions.filter(x => cur[x.id] === x.correct).length;
    const total = questions.length;
    localStorage.setItem("dk_topik_score", JSON.stringify({ correct, total, answers: cur, testId, at: Date.now() }));
    try {
      const token = localStorage.getItem("dk_token");
      await fetch("/api/topik/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ testId, answers: cur, score: correct, total }),
      });
    } catch {}
    router.push("/topik/result");
  }

  function next() {
    setChecked(false);
    if (idx < questions.length - 1) setIdx(i => i + 1);
    else finish();
  }

  if (loading) {
    return <div className="mx-auto max-w-[820px] p-8 flex items-center justify-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda…</div>;
  }
  if (!questions.length || !q) {
    return (
      <div className="mx-auto max-w-[820px] p-4 lg:p-6">
        <Card className="p-8 text-center">
          <p className="font-semibold">Savollar topilmadi</p>
          <p className="text-sm text-slate-500 mt-1">Admin hali savol qo‘shmagan: /admin/content → Testlar</p>
          <Button className="mt-4" onClick={() => router.push("/topik")}>Orqaga</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[820px] p-4 lg:p-6 space-y-4">
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900 truncate">{meta?.title ?? testId} — {idx + 1}/{questions.length}</div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-sm font-medium ${seconds < 300 ? "text-red-600" : "text-[#2563eb]"}`}><Clock className="h-4 w-4"/> {formatTime(seconds)}</span>
          <div className="hidden sm:block w-24"><Progress value={((idx + 1) / questions.length) * 100} /></div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-1.5">
        {questions.map((_, i) => {
          const qid = questions[i].id;
          const answered = !!answers[qid];
          const active = i === idx;
          return (
            <button key={qid} onClick={() => { setIdx(i); setChecked(false); }}
              className={`h-8 w-8 rounded-lg text-xs font-bold border ${active ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : answered ? "bg-[#eff6ff] text-[#2563eb] border-blue-200" : "bg-white text-slate-500 border-slate-200"}`}>{i + 1}</button>
          );
        })}
        {allAnswered && <span className="ml-2 text-xs text-emerald-600 self-center font-medium">✓ barchasi belgilandi</span>}
      </div>

      <Card className="p-5 lg:p-6">
        <div className="text-[15px] font-medium text-slate-900 leading-relaxed whitespace-pre-wrap">{q.text}</div>
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
            <div className={`rounded-xl p-3 text-sm font-medium border ${isCorrect ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
              {isCorrect ? "To‘g‘ri! 🎉" : `Noto‘g‘ri. To‘g‘ri javob: ${q.correct}`} — {q.explanation}
            </div>
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setChecked(false)}><ChevronLeft className="h-4 w-4 mr-1"/> Qayta</Button>
              <Button onClick={next}>{idx === questions.length - 1 ? "Natijani ko‘rish →" : "Keyingi"} <ChevronRight className="h-4 w-4 ml-1"/></Button>
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}>Oldingi</Button>
        <Button variant="outline" onClick={() => { if (confirm("Testni yakunlab, natijani ko‘rasizmi?")) finish(); }}>Yakunlash</Button>
      </div>
    </div>
  );
}

export default function TopikExamPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[820px] p-8 flex items-center justify-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda…</div>}>
      <TopikExamInner />
    </Suspense>
  );
}
