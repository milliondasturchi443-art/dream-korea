"use client";
import { useEffect, useState, useMemo, Suspense, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, ChevronRight, Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { speak, stopSpeak } from "@/lib/tts";

export const dynamic = "force-dynamic";

type Opt = { key: string; text: string };
type Q = { id: string; text: string; audio?: string; options: Opt[]; correct?: string; explanation?: string };

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
  const [playingId, setPlayingId] = useState<string | null>(null);
  // Har bir savol uchun taymer (soniya)
  const [qLimit, setQLimit] = useState(30);
  const [qLeft, setQLeft] = useState(30);
  const [timerOn, setTimerOn] = useState(true);
  const didAutoFinish = useRef(false);
  const qLeftRef = useRef(30); // oxirgi qolgan soniya (stale-state himoyasi)
  const q = questions[idx];

  const isListening = (meta?.type === "Listening") || (q?.text?.includes("[Listening]") ?? false);
  // URL dan ?sec=NN orqali chegarani o'zgartirsa bo'ladi
  const qLimitRef = useRef<number>(30);
  const speakText = q?.audio ?? (q?.text ? q.text.replace(/^\[Listening\]\s*/, "").trim() : "");

  function playAudio(text?: string, qid?: string) {
    const t = String(text || "").trim();
    if (!t) { toast.error("Ovoz matni yo\u2018q"); return; }
    if (playingId === qid) { stopSpeak(); setPlayingId(null); return; }
    stopSpeak();
    setPlayingId(qid ?? "x");
    const ok = speak(t);
    if (!ok) { setPlayingId(null); toast.error("Ovoz chiqarib bo\u2018lmadi"); return; }
    const approx = Math.max(1500, t.length * 130);
    setTimeout(() => setPlayingId(cur => (cur === (qid ?? "x") ? null : cur)), approx + 1500);
  }

  useEffect(() => {
    setLoading(true);
    const ac = new AbortController();
    fetch(`/api/topik/${encodeURIComponent(testId)}`, { signal: ac.signal })
      .then(async r => { const d = await r.json().catch(() => ({} as Record<string, unknown>)); if (!r.ok) throw new Error(String((d as Record<string, unknown>).error ?? `HTTP ${r.status}`)); return d as { questions: Q[]; title: string; level: string; type: string }; })
      .then(d => {
        if (!Array.isArray(d.questions)) throw new Error("Savollar olinmadi");
        const withoutLeak = d.questions.map(qq => ({ id: qq.id, text: qq.text, audio: (qq as { audio?: string }).audio, options: qq.options }));
        setQuestions(withoutLeak as Q[]);
        setMeta({ title: d.title ?? String(testId), level: d.level ?? "TOPIK I", type: d.type ?? "Reading" });
        const mins = d.type === "Full" ? 80 : d.level === "TOPIK II" ? 70 : 40;
        setSeconds(mins * 60);
        // Har savol uchun vaqt: listening ozroq eshitish uchun, reading ko'proq o'qish uchun
        let lim = d.type === "Listening" ? 25 : 30;
        try {
          const sp = new URLSearchParams(window.location.search);
          const custom = Number(sp.get("sec"));
          if (custom && custom > 0 && custom <= 120) lim = custom;
        } catch {}
        qLimitRef.current = lim;
        setQLimit(lim);
        setQLeft(lim);
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
      localStorage.setItem("dk_topik_score", JSON.stringify({ correct: d.score ?? 0, total: d.total ?? questions.length, pct: d.pct ?? 0, answers: cur, testId, at: Date.now(), isSeed: d.isSeed ?? false }));
      router.push("/topik/result");
    } catch (e) {
      toast.error(String((e as Error).message ?? "Xatolik"));
      setFinishing(false);
    }
  }, [questions.length, finishing, answers, q, selected, testId, router]);

  // Savolga o'tganda taymerni tiklash
  useEffect(() => {
    if (!loading && questions.length) { setQLeft(qLimit); qLeftRef.current = qLimit; }
  }, [idx, loading, questions.length, qLimit]);

  // Har savol uchun countdown (faqat kamaytirish — side-effectsiz)
  useEffect(() => {
    if (loading || !questions.length || !timerOn || finishing) return;
    const t = setInterval(() => setQLeft(v => { const n = v <= 0 ? 0 : v - 1; qLeftRef.current = n; return n; }), 1000);
    return () => clearInterval(t);
  }, [loading, questions.length, timerOn, finishing]);

  // Vaqt tugadi -> keyingi savolga o'tish (oxirgi bo'lsa — yakunlash)
  useEffect(() => {
    if (loading || finishing || !questions.length) return;
    if (qLeft !== 0 || qLeftRef.current !== 0) return; // stale-state himoyasi
    if (idx < questions.length - 1) {
      setIdx(i => i + 1);
    } else {
      toast.info("Savollar bo'ylab vaqt tugadi — test yakunlanmoqda");
      void finish();
    }
  }, [qLeft, idx, loading, questions.length, finishing, finish]);


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
          <p className="text-sm text-slate-500 mt-1">Admin hali savol qo‘shmagan</p>
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
          {/* Savolga berilgan vaqt */}
          <span className={`flex items-center gap-1.5 text-sm font-bold px-2.5 py-1 rounded-full border ${qLeft <= 5 ? "bg-red-50 border-red-300 text-red-600 animate-pulse" : qLeft <= 10 ? "bg-amber-50 border-amber-300 text-amber-600" : "bg-blue-50 border-blue-200 text-[#2563eb]"}`}>
            ⏱ {qLeft}s
          </span>
          <span className={`flex items-center gap-1.5 text-sm font-medium ${seconds < 300 ? "text-red-600" : "text-slate-500"}`}><Clock className="h-4 w-4" /> {formatTime(seconds)}</span>
          <div className="hidden sm:block w-24"><Progress value={((idx + 1) / questions.length) * 100} /></div>
        </div>
      </Card>

      {/* Savol taymeri — progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-1000 ease-linear ${qLeft <= 5 ? "bg-red-500" : qLeft <= 10 ? "bg-amber-500" : "bg-[#2563eb]"}`}
            style={{ width: `${qLimit ? Math.max(0, (qLeft / qLimit) * 100) : 0}%` }}
          />
        </div>
        <button
          onClick={() => setTimerOn(t => !t)}
          className={`shrink-0 h-9 px-3 rounded-full text-[11px] font-semibold border ${timerOn ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : "bg-white text-slate-500 border-slate-200"}`}
          title="Savol taymerini to'xtatish / qayta ishga tushirish"
        >
          {timerOn ? "⏸ Pauza" : "▶ Davom"}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {questions.map((_, i) => {
          const qid = questions[i].id;
          const answered = !!answers[qid];
          const active = i === idx;
          return (
            <button key={qid} onClick={() => setIdx(i)} className={`h-10 w-10 rounded-lg text-xs font-bold border ${active ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : answered ? "bg-[#eff6ff] text-[#2563eb] border-blue-200" : "bg-white text-slate-500 border-slate-200"}`}>{i + 1}</button>
          );
        })}
        {allAnswered && <span className="ml-2 text-xs text-emerald-600 self-center font-medium">✓ barchasi belgilandi</span>}
      </div>

      <Card className="p-5 lg:p-6">
        {isListening && (
          <div className="mb-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => playAudio(speakText, q.id)}
                className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-md active:scale-95 transition ${playingId === q.id ? "bg-emerald-600 text-white" : "bg-[#0f1b3d] text-white hover:bg-[#1a2a5a]"}`}
              >
                {playingId === q.id
                  ? <><span className="flex gap-0.5 items-end h-4"><i className="block w-1 h-2 bg-white animate-pulse"/><i className="block w-1 h-4 bg-white animate-pulse"/><i className="block w-1 h-3 bg-white animate-pulse"/></span> To‘xtatish</>
                  : <><Volume2 className="h-5 w-5"/> 🔊 Eshitish</>}
              </button>
              <span className="text-xs text-emerald-700 leading-snug max-w-[280px]">Koreyscha gapni tinglang, so‘ng javobni tanlang. Qayta-qayta bosib eshita olasiz.</span>
            </div>
          </div>
        )}
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

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="ghost" onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}>Oldingi</Button>
        <div className="flex flex-wrap gap-2">
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
