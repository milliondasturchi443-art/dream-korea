"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WRITING_PROMPTS, promptById } from "@/lib/topik-writing";
import { darsRequest } from "@/lib/dars-client";
import { PenLine, Clock, Send, History } from "lucide-react";

type Attempt = { id: string; promptId: string; text: string; score: number | null; feedback: string | null; createdAt: string };

export default function TopikWritingPage() {
  const [selected, setSelected] = useState(WRITING_PROMPTS[0].id);
  const [text, setText] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Attempt | null>(null);
  const [error, setError] = useState("");
  const [left, setLeft] = useState(WRITING_PROMPTS[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const prompt = promptById(selected)!;

  useEffect(() => {
    darsRequest<{ attempts: Attempt[] }>("/api/topik/writing").then(d => setAttempts(d.attempts)).catch(() => {});
  }, []);

  useEffect(() => {
    setLeft(prompt.minutes * 60);
    setRunning(false);
    setResult(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [prompt]);

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => setLeft(l => {
      if (l <= 1) { setRunning(false); return 0; }
      return l - 1;
    }), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  async function submit() {
    setBusy(true); setError(""); setResult(null);
    try {
      const d = await darsRequest<{ attempt: Attempt }>("/api/topik/writing", { promptId: selected, text });
      setResult(d.attempt);
      setAttempts(prev => [d.attempt, ...prev].slice(0, 30));
      setRunning(false);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const mm = Math.floor(left / 60), ss = left % 60;
  const timeLow = left <= 120;

  return (
    <div className="mx-auto max-w-[1000px] p-4 lg:p-6 space-y-5">
      <div>
        <Link href="/topik" className="text-sm text-blue-600">← TOPIK</Link>
        <h1 className="text-[22px] font-bold text-slate-900 mt-1">Yozish mashqlari · 쓰기</h1>
        <p className="text-sm text-slate-500">Rasmiy 51/53/54 uslubidagi original topshiriqlar. Taymer bilan yozing — avtomatik baholash.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {WRITING_PROMPTS.map(p => (
          <button key={p.id} onClick={() => setSelected(p.id)}
            className={`rounded-xl border p-3 text-left transition-colors ${selected === p.id ? "border-blue-500 bg-blue-50" : "bg-white hover:bg-slate-50"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700">#{p.no}</span>
              <Badge className="bg-slate-100 text-slate-600 text-[10px]">{p.level}</Badge>
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900 line-clamp-2">{p.title}</div>
            <div className="mt-1 text-[11px] text-slate-500">{p.minutes} daq · {p.minChars}+ 자</div>
          </button>
        ))}
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900">#{prompt.no} · {prompt.title}</h2>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{prompt.promptKo}</p>
            <p className="mt-2 text-xs text-slate-500 whitespace-pre-line">{prompt.promptUz}</p>
          </div>
          <div className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-bold ${timeLow ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-700"}`}>
            <Clock className="h-4 w-4" /> {mm}:{String(ss).padStart(2, "0")}
          </div>
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={10}
          placeholder="여기에 한국어로 답안을 쓰십시오…"
          className="w-full rounded-xl border border-slate-200 p-3 text-base sm:text-sm focus:border-blue-500 focus:outline-none" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`text-xs ${text.length < prompt.minChars ? "text-slate-500" : "text-emerald-600 font-semibold"}`}>
            {text.length} / {prompt.minChars}+ 자
          </span>
          <div className="flex gap-2">
            {!running && left > 0 && left < prompt.minutes * 60 && (
              <Button variant="outline" onClick={() => setRunning(true)}>Davom etish</Button>
            )}
            {running && <Button variant="outline" onClick={() => setRunning(false)}>Pauza</Button>}
            {!running && left === prompt.minutes * 60 && (
              <Button variant="outline" onClick={() => setRunning(true)}>Taymerni boshlash</Button>
            )}
            <Button onClick={submit} disabled={busy || text.trim().length < 10}>
              <Send className="h-4 w-4 mr-1" /> {busy ? "Baholanmoqda…" : "Topshirish"}
            </Button>
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {left === 0 && !result && <p className="text-sm text-red-600">Vaqt tugadi — javobingizni yuborishingiz mumkin.</p>}
      </Card>

      {result && (
        <Card className="p-5 space-y-2" role="status">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Natija</h3>
            <span className={`text-2xl font-extrabold ${(result.score ?? 0) >= 60 ? "text-emerald-600" : "text-amber-600"}`}>{result.score ?? "—"}<span className="text-sm text-slate-400">/100</span></span>
          </div>
          <p className="text-sm text-slate-600">{result.feedback}</p>
          <p className="text-xs text-slate-400">Namuna javob: {prompt.sample}</p>
        </Card>
      )}

      {attempts.length > 0 && (
        <Card className="p-5">
          <h3 className="flex items-center gap-1.5 font-semibold text-slate-900"><History className="h-4 w-4 text-blue-600" /> Tarix</h3>
          <div className="mt-3 space-y-2">
            {attempts.map(a => {
              const p = promptById(a.promptId);
              return (
                <div key={a.id} className="rounded-xl border border-slate-200 p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900">#{p?.no} {p?.title ?? a.promptId}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{a.text}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{new Date(a.createdAt).toLocaleString("uz-UZ")}</div>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2 py-1 text-sm font-bold ${(a.score ?? 0) >= 60 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{a.score ?? "—"}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
