"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { darsRequest } from "@/lib/dars-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ClipboardCheck, Check, X, RotateCcw, Award } from "lucide-react";

type ExamQ = { text: string; options: string[] };
type Review = { correct: number; explain?: string };
type Best = { from: number; to: number; score: number; total: number; attempts: number };

function pct(score: number, total: number) { return total ? Math.round(score / total * 100) : 0; }

function ImtihonInner() {
  const search = useSearchParams();
  const from = Math.max(1, Number(search.get("from")) || 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<ExamQ[]>([]);
  const [examKey, setExamKey] = useState("");
  const [review, setReview] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [best, setBest] = useState<Best | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; total: number; improved: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true); setError(""); setResult(null); setAnswers({}); setReview([]);
    darsRequest<{ from: number; to: number; questions: ExamQ[]; total: number; best: Best | null; key: string }>(`/api/dars/exam?from=${from}`)
      .then(d => { setQuestions(d.questions); setTotal(d.total); setBest(d.best); setExamKey(d.key); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { queueMicrotask(() => load()); }, [from]); // eslint-disable-line react-hooks/exhaustive-deps

  const answered = Object.keys(answers).length;
  async function submit() {
    if (answered < total || submitting) return;
    setSubmitting(true); setError("");
    try {
      const list = questions.map((_, i) => answers[i] ?? -1);
      const d = await darsRequest<{ best: Best; improved: boolean; score: number; total: number; review: Review[] }>("/api/dars/exam", { from, key: examKey, answers: list });
      setBest(d.best);
      setReview(d.review);
      setResult({ score: d.score, total: d.total, improved: d.improved });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { setError((e as Error).message); } finally { setSubmitting(false); }
  }

  if (loading) return <div className="mx-auto max-w-[820px] p-8 flex items-center justify-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Imtihon yuklanmoqda…</div>;
  if (error && !questions.length) return <Card className="m-6 p-6" role="alert">{error} <Link href="/dars" className="text-blue-600">← Darslar</Link></Card>;

  return <div className="mx-auto max-w-[820px] space-y-5 p-4 sm:p-6">
    <header>
      <Link href="/dars" className="inline-flex items-center gap-1 text-sm text-blue-600"><ArrowLeft className="h-4 w-4" /> Darslar</Link>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl"><ClipboardCheck className="h-6 w-6 text-blue-600" /> Imtihon {from}–{from + 3}</h1>
          <p className="mt-1 text-sm text-slate-500">Bu blokning so‘zlari va grammatikasi bo‘yicha {total} savol</p>
        </div>
        {best && !result && <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700"><Award className="h-4 w-4" /> {best.score}/{best.total} ({pct(best.score, best.total)}%)</span>}
      </div>
    </header>

    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

    {result ? (
      <Card className="space-y-4 p-6 text-center">
        <p className="text-5xl font-black text-blue-700">{result.score}/{result.total}</p>
        <p className="text-sm font-medium text-slate-600">{pct(result.score, result.total)}% · {result.score >= Math.ceil(result.total * 0.8) ? "A’lo natija!" : result.score >= Math.ceil(result.total * 0.6) ? "Yaxshi davom eting" : "Yana bir bor urinib ko‘ring"}</p>
        {result.improved && <p className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">Yangi rekord!</p>}
        {best && <p className="text-xs text-slate-500">Eng yaxshisi: {best.score}/{best.total} ({pct(best.score, best.total)}%) · {best.attempts} ta urinish</p>}
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <Button onClick={load}><RotateCcw className="mr-2 h-4 w-4" /> Qayta topshirish</Button>
          <Link href="/dars" className="inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">← Darslar</Link>
        </div>
      </Card>
    ) : null}

    {!result && <div className="space-y-4">
      {questions.map((q, i) => <Card key={i} className="p-4">
        <p className="mb-3 font-semibold">{i + 1}. {q.text}</p>
        <fieldset className="grid gap-2" aria-label={`Savol ${i + 1} variantlari`}>
          {q.options.map((opt, oi) => <label key={oi} className={`cursor-pointer rounded-xl border p-3 text-sm transition-colors ${answers[i] === oi ? "border-blue-500 bg-blue-50 font-medium" : "bg-white hover:border-blue-200"}`}>
            <input type="radio" name={`q${i}`} checked={answers[i] === oi} onChange={() => setAnswers(a => ({ ...a, [i]: oi }))} className="mr-2" />{opt}
          </label>)}
        </fieldset>
      </Card>)}
      <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-2xl bg-white/90 p-3 shadow-lg backdrop-blur">
        <span className="text-sm font-medium text-slate-600">{answered}/{total} javob berildi</span>
        <Button onClick={submit} disabled={answered < total || submitting}>{submitting ? "Tekshirilmoqda…" : "Imtihonni topshirish"}</Button>
      </div>
    </div>}

    {result && <div className="space-y-3">
      <h2 className="text-lg font-bold">Javoblar tahlili</h2>
      {questions.map((q, i) => {
        const rv = review[i];
        const ok = rv !== undefined && answers[i] === rv.correct;
        return <Card key={i} className={`p-4 ${ok ? "border-emerald-200" : "border-red-200"}`}>
          <p className="mb-2 flex items-start gap-2 font-semibold">
            {ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
            {i + 1}. {q.text}
          </p>
          <p className="text-sm text-slate-600">To‘g‘ri javob: <b>{rv ? q.options[rv.correct] : "—"}</b>{!ok && answers[i] !== undefined && <span className="text-red-500"> · siz: {q.options[answers[i]]}</span>}</p>
          {rv?.explain && <p className="mt-1 text-xs text-slate-400">{rv.explain}</p>}
        </Card>;
      })}
      <div className="flex justify-center gap-2 pb-4"><Button onClick={load}><RotateCcw className="mr-2 h-4 w-4" /> Yana bir bor</Button></div>
    </div>}
  </div>;
}

export default function ImtihonPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[820px] p-8 flex items-center justify-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda…</div>}>
      <ImtihonInner />
    </Suspense>
  );
}
