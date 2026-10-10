"use client";
import { useEffect, useState, useMemo, Suspense, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

type Opt = { key: string; text: string };
type Q = { id: string; text: string; options: Opt[]; correct?: string; explanation?: string };

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
  const [seconds, setSeconds] = useState(40 * 60);
  const [finishing, setFinishing] = useState(false);
  const didAutoFinish = useRef(false);
  const q = questions[idx];

  useEffect(() => {
    setLoading(true);
    const ac = new AbortController();
    fetch(`/api/topik/${encodeURIComponent(testId)}`, { signal: ac.signal })
      .then(async r => { const d = await r.json().catch(() => ({} as Record<string, unknown>)); if (!r.ok) throw new Error(String((d as Record<string, unknown>).error ?? `HTTP ${r.status}`)); return d as { questions: Q[]; title: string; level: string; type: string }; })
      .then(d => {
        if (!Array.isArray(d.questions)) throw new Error("Savollar olinmadi");
        // Без ?solutions=1 correct не приходит — нельзя подсмотреть до завершения
        const withoutLeak = d.questions.map(qq => ({ id: qq.id, text: qq.text, options: qq.options }));
        setQuestions(withoutLeak as Q[]);
        setMeta({ title: d.title ?? String(testId), level: d.level ?? "TOPIK I", type: d.type ?? "Reading" });
        const mins = d.type === "Full" ? 80 : d.level === "TOPIK II" ? 70 : 40;
        setSeconds(mins * 60);
      })
      .catch(e => { if ((e as Error).name !== "AbortError") toast.error(String((e as Error).message ?? e)); })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [testId]);

  useEffect(() => {
    if (loading || !questions.length) return;
    const t = setInterval(() => setSeconds(s => (s <= 1 ? (clearInterval(t), 0) : s - 1)), 1000);
    return () => clearInterval(t);
  }, [loading, questions.length]);

  const selected = q ? answers[q.id] : undefined;
  const allAnswered = useMemo(() => questions.length > 0 && questions.every(x => answers[x.id]), [questions, answers]);

  const finish = useCallback(async () => {
    if (!questions.length || finishing) return;
    setFinishing(true);
    const cur = { ...answers };
    if (q && selected) cur[q.id] = selected;
    try {
      const token = localStorage.getItem("dk_token") || sessionStorage.getItem("dk_token");
      const r = await fetch("/api/topik/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ testId, answers: cur }),
      });
      const d = await r.json().catch(() => ({} as Record<string, unknown>));
      if (!r.ok) throw new Error(String((d as Record<string, unknown>).error ?? "Saqlab bo'lmadi"));
      // Сервер сам посчитал баллы — кладём в результат (не клиентские)
      localStorage.setItem("dk_topik_score", JSON.stringify({ correct: d.score ?? 0, total: d.total ?? questions.length, pct: d.pct ?? 0, answers: cur, testId, at: Date.now(), isSeed: d.isSeed ?? false }));
      router.push("/topik/result");
    } catch (e) {
      toast.error(String((e as Error).message ?? "Xatolik"));
      setFinishing(false);
    }
  }, [questions.length, finishing, answers, q, selected, testId, router]);

  useEffect(() => {
    if (!didAutoFinish.current && !loading && questions.length && seconds === 0) {
      didAutoFinish.current = true;
      toast.info("Vaqt tugadi — yakunlanmoqda…");
      void finish();
    }
  }, [seconds, loading, questions.length, finish]);

  function next() {
    if (idx < questions.length - 1) setIdx(i => i + 1);
    else void finish();
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
        <div className="text-sm font-semibold text-slate-900 truncate">{meta?.title ?? String(testId)} — {idx + 1}/{questions.length}</div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-sm font-medium ${seconds < 300 ? "text-red-600" : "text-[#2563eb]"}`}><Clock className="h-4 w-4" /> {formatTime(seconds)}</span>
          <div className="hidden sm:block w-24"><Progress value={((idx + 1) / questions.length) * 100} /></div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-1.5">
        {questions.map((_, i) => {
          const qid = questions[i].id;
          const answered = !!answers[qid];
          const active = i === idx;
          return (
            <button key={qid} onClick={() => setIdx(i)} className={`h-8 w-8 rounded-lg text-xs font-bold border ${active ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : answered ? "bg-[#eff6ff] text-[#2563eb] border-blue-200" : "bg-white text-slate-500 border-slate-200"}`}>{i + 1}</button>
          );
        })}
        {allAnswered && <span className="ml-2 text-xs text-emerald-600 self-center font-medium">✓ barchasi belgilandi</span>}
      </div>

      <Card className="p-5 lg:p-6">
        <div className="text-[15px] font-medium text-slate-900 leading-relaxed whitespace-pre-wrap">{q.text}</div>
        <div className="mt-5 grid gap-2.5">
          {q.options.map(o => {
            const active = selected === o.key;
            return (
              <button
                key={o.key}
                onClick={() => setAnswers(a => ({ ...a, [q.id]: o.key }))}
                className={`text-left rounded-2xl border-2 p-4 flex gap-3 items-center transition-colors ${active ? "border-[#2563eb] bg-[#eff6ff]" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <span className={`h-8 w-8 rounded-full grid place-items-center text-sm font-bold shrink-0 border ${active ? "bg-[#2563eb] text-white border-[#2563eb]" : "bg-white text-slate-700 border-slate-200"}`}>{o.key}</span>
                <span className="text-sm font-medium text-slate-900">{o.text}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-3">Javob belgilang va keyingi savolga o‘ting. Yakunlagach natija ekrani ochiladi.</p>
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}>Oldingi</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { if (confirm("Testni yakunlab, natijani ko‘rasizmi?")) void finish(); }} disabled={finishing}>{finishing ? "Yakunlanmoqda…" : "Yakunlash"}</Button>
          {idx < questions.length - 1 ? <Button onClick={next} disabled={finishing}>Keyingi <ChevronRight className="h-4 w-4 ml-1" /></Button> : <Button onClick={() => void finish()} disabled={finishing}>Natijani ko‘rish →</Button>}
        </div>
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
