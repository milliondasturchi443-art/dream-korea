"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { darsRequest } from "@/lib/dars-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/tts";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { playWin } from "@/lib/win-sound";
import { Volume2, BookOpen, Video, PenLine, ArrowRight, Check, Circle, Play, RotateCcw, AlignLeft, Headphones } from "lucide-react";

type Exercise = { q: string; options: string[]; correct: number };
type Unit = {
  order: number;
  title: string; topic: string; level: string; description?: string;
  vocab: { id: string; ko: string; uz: string; tr?: string; exampleKo?: string; exampleUz?: string }[];
  videos: { id: string; title: string; videoUrl: string }[];
  grammars: { id: string; title: string; explain: string; pattern?: string; examples: { ko: string; uz: string }[]; exercises: Exercise[] }[];
  listenings: { id: string; title: string; audioUrl?: string; audioText?: string; transcript?: string; questions: { text: string; options: { key: string; text: string }[]; correct: string }[] }[];
  writings: { id: string; title: string; prompt: string; criteria?: string; sampleAnswer?: string }[];
};
type Result = { score: number; total: number; gained: number; passed: boolean; review: { key: string; correct: number; explanation: string }[] };
type WritingAttempt = { id: string; score: number | null; feedback: string | null; createdAt: string };
type UnitRef = { id: string; order: number; topic: string };
type ProgressRow = { unitId: string; stars: number; vocabDone: boolean; grammarDone: boolean; listeningDone: boolean; videoDone: boolean };

const VIDEO_POS = "dk_video_pos";
const MAX_VOCAB = 35;

export default function UnitPage() {
  const { id } = useParams<{ id: string }>();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [saving, setSaving] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);
  const [writingText, setWritingText] = useState("");
  const [writingBusy, setWritingBusy] = useState(false);
  const [writingResult, setWritingResult] = useState<WritingAttempt | null>(null);
  const [writingHistory, setWritingHistory] = useState<Record<string, WritingAttempt[]>>({});
  const [units, setUnits] = useState<UnitRef[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  // Yakunlangan bo'limni qayta yechish (Qayta ishlash) — faqat lokal qulf
  const [retry, setRetry] = useState<Record<string, boolean>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { let active = true; darsRequest<Unit>(`/api/dars/${id}`).then(u => { if (active) { setUnit(u); u.writings.forEach(w => loadWritingHistory(w.id)); } }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [id]);

  // Unitlar ro'yxati + progress — "keyingi unit" tugmasi va bo'lim holati uchun
  useEffect(() => {
    darsRequest<{ units: UnitRef[] }>("/api/dars").then(d => setUnits(d.units)).catch(() => {});
    darsRequest<{ progress: ProgressRow[] }>("/api/dars/progress").then(d => setProgress(d.progress)).catch(() => {});
  }, []);

  async function refreshProgress() {
    try { const d = await darsRequest<{ progress: ProgressRow[] }>("/api/dars/progress"); setProgress(d.progress); } catch {}
  }

  // Natija ko'rinmasligi uchun - uni darhol ko'z oldiga aylantiramiz
  useEffect(() => {
    if (result) {
      const t = setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return () => clearTimeout(t);
    }
  }, [result]);

  async function submit(section: string) {
    setSaving(true); setError(""); setResult(null);
    try {
      const res = await darsRequest<Result>("/api/dars/progress", { unitId: id, section, answers });
      setResult(res);
      if (res.passed) playWin();
      setRetry(r => ({ ...r, [section]: false }));
      await refreshProgress();
    }
    catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  // Video "ko'rishni boshlash" — bo'lim sifatida qabul qilinadi
  async function acceptVideo() {
    setVideoBusy(true); setError("");
    try {
      await darsRequest("/api/dars/progress", { unitId: id, section: "video", answers: {} });
      playWin();
      setRetry(r => ({ ...r, video: false }));
      await refreshProgress();
    }
    catch (e) { setError((e as Error).message); }
    finally { setVideoBusy(false); }
  }

  function startRetry(section: string) {
    setRetry(r => ({ ...r, [section]: true }));
    setResult(null);
    setError("");
  }

  async function loadWritingHistory(writingId: string) {
    try {
      const d = await darsRequest<{ attempts: WritingAttempt[] }>(`/api/dars/writing?writingId=${encodeURIComponent(writingId)}`);
      setWritingHistory(prev => ({ ...prev, [writingId]: d.attempts }));
    } catch {}
  }

  async function submitWriting(writingId: string) {
    setWritingBusy(true); setError(""); setWritingResult(null);
    try {
      const d = await darsRequest<{ attempt: WritingAttempt }>("/api/dars/writing", { writingId, text: writingText });
      setWritingResult(d.attempt);
      setWritingText("");
      await loadWritingHistory(writingId);
    } catch (e) { setError((e as Error).message); }
    finally { setWritingBusy(false); }
  }

  function choices(key: string, options: string[], locked = false, correct = -1) {
    if (locked) return <div className="mt-3 flex flex-wrap gap-2" aria-label="Natijalar">{options.map((option, i) => {
      const ok = i === correct;
      const wrong = !ok && answers[key] === i;
      return <span key={i} className={`rounded-xl border p-3 ${ok ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-700" : wrong ? "border-red-300 bg-red-50 text-red-600" : "border-slate-200 bg-slate-50 text-slate-400"}`}>{ok ? "✓ " : wrong ? "✗ " : ""}{option}</span>;
    })}</div>;
    return <fieldset className="mt-3 flex flex-wrap gap-2" aria-label="Javob variantlari">{options.map((option, i) => <label key={i} className={`cursor-pointer rounded-xl border p-3 ${answers[key] === i ? "border-blue-500 bg-blue-50" : "bg-white"}`}><input type="radio" name={key} checked={answers[key] === i} onChange={() => setAnswers(a => ({ ...a, [key]: i }))} className="mr-2" />{option}</label>)}</fieldset>;
  }

  function saveVideoPos(videoId: string, t: number) {
    try { const m = JSON.parse(localStorage.getItem(VIDEO_POS) || "{}"); m[videoId] = t; localStorage.setItem(VIDEO_POS, JSON.stringify(m)); } catch {}
  }

  const me = progress.find(p => p.unitId === id);
  const hasVideo = !!unit && unit.videos.length > 0;
  // server holati (progressda qayd etilgan)
  const secDone = {
    vocab: !!me?.vocabDone,
    grammar: !!me?.grammarDone,
    listening: !!me?.listeningDone,
    video: !!unit && (unit.videos.length === 0 || !!me?.videoDone),
  };
  // qulf: yakunlangan va "Qayta ishlash" bosilmagan bo'lim yechilmaydi
  const locked = {
    vocab: secDone.vocab && !retry.vocab,
    grammar: secDone.grammar && !retry.grammar,
    listening: secDone.listening && !retry.listening,
    video: secDone.video && !retry.video,
  };
  const statusParts = [
    { label: "Video", ok: secDone.video || !hasVideo },
    { label: "Grammatika", ok: secDone.grammar },
    { label: "Tinglash", ok: secDone.listening },
    { label: "Lug‘at", ok: secDone.vocab },
  ];
  function secBadge(ok: boolean) {
    return ok ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Yakunlandi</span> : null;
  }
  // Yakunlangan bo'lim: kulrang holat + "Qayta ishlash" tugmasi bilan qayta yechish mumkin
  function doneFooter(serverDone: boolean, section: string, children: ReactNode) {
    if (serverDone && !retry[section]) return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="inline-flex h-10 items-center rounded-full bg-slate-200 px-5 text-sm font-medium text-slate-500">✓ Yakunlandi</span>
        <Button variant="outline" onClick={() => startRetry(section)}><RotateCcw className="h-4 w-4 mr-1" /> Qayta ishlash</Button>
      </span>
    );
    return children;
  }

  // Sarlavha: "1) Salomlashish" + "1-dars · 인사"
  const topicRaw = (unit?.topic || unit?.title || "").trim();
  const hasSep = topicRaw.includes("·");
  const koPart = hasSep ? topicRaw.split("·")[0].trim() : "";
  const uzPart = hasSep ? topicRaw.split("·").slice(1).join("·").trim() : topicRaw;
  const orderNo = unit?.order ?? 1;

  return <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
    <Link href="/dars" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:gap-2 transition-all">← Darslar</Link>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {!unit ? <div className="space-y-4"><div className="h-32 animate-pulse rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100" /><div className="h-40 animate-pulse rounded-3xl bg-white/70" /><div className="h-40 animate-pulse rounded-3xl bg-white/70" /></div> : <>
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#7c3aed] p-6 text-white shadow-lg shadow-blue-500/20 anim-fade-up">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-14 -left-6 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">{unit.level}</span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{orderNo}) {uzPart || topicRaw}</h1>
          <p className="mt-0.5 text-sm font-medium text-blue-100">{orderNo}-dars{koPart ? ` · ${koPart}` : ""}</p>
          {unit.description && <p className="mt-2 text-sm text-blue-100/90">{unit.description}</p>}
        </div>
      </header>

      {/* a) Video */}
      <Card className={`space-y-4 overflow-hidden p-5 border-0 ring-1 ring-blue-100 ${locked.video ? "opacity-60" : ""}`}><h2 className="flex items-center gap-2 text-xl font-bold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600"><Video className="h-4.5 w-4.5" /></span> a) Video Dars {secBadge(secDone.video)}</h2>{!unit.videos.length && <p className="text-slate-500">Bu unitga video hali qo‘shilmagan.</p>}{hasVideo && doneFooter(secDone.video, "video", <Button disabled={videoBusy} onClick={acceptVideo}><Play className="mr-2 h-4 w-4" />{videoBusy ? "Qabul qilinmoqda…" : "Video ko`rib boldim"}</Button>)}{unit.videos.map(v => <div key={v.id}><h3 className="mb-2 font-bold">{v.title}</h3>{youtubeEmbedUrl(v.videoUrl) ? <iframe title={v.title} src={youtubeEmbedUrl(v.videoUrl)!} className="aspect-video w-full rounded-xl" allowFullScreen /> : <video ref={el => { videoRefs.current[v.id] = el; }} controls preload="metadata" src={v.videoUrl} className="w-full rounded-xl" onLoadedMetadata={e => { try { const m = JSON.parse(localStorage.getItem(VIDEO_POS) || "{}"); const t = Number(m[v.id]); if (t > 0 && e.currentTarget.duration > t) e.currentTarget.currentTime = t; } catch {} }} onTimeUpdate={e => { if (Math.floor(e.currentTarget.currentTime) % 5 === 0) saveVideoPos(v.id, e.currentTarget.currentTime); }} />}</div>)}</Card>

      {/* b) Grammatika */}
      <Card className={`space-y-5 overflow-hidden p-5 border-0 ring-1 ring-violet-100 ${locked.grammar ? "opacity-60" : ""}`}><h2 className="flex items-center gap-2 text-xl font-bold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-50 text-violet-600"><AlignLeft className="h-4.5 w-4.5" /></span> b) 문법 · Grammatika {secBadge(secDone.grammar)}</h2>{unit.grammars.map(g => <section key={g.id} className="space-y-3"><h3 className="font-bold">{g.title}</h3>{g.pattern && <p className="rounded-xl bg-blue-50 p-3 font-bold">{g.pattern}</p>}<p>{g.explain}</p>{g.examples.map((e, i) => <p key={i}>{e.ko} — {e.uz}</p>)}{g.exercises.map((e, i) => <div key={i}><p>{e.q}</p>{choices(`${g.id}:${i}`, e.options, locked.grammar, e.correct)}</div>)}</section>)}{doneFooter(secDone.grammar, "grammar", <Button disabled={saving || !unit.grammars.length} onClick={() => submit("grammar")}>Tekshirish va saqlash</Button>)}</Card>

      {/* c) Tinglash */}
      <Card className={`space-y-5 overflow-hidden p-5 border-0 ring-1 ring-amber-100 ${locked.listening ? "opacity-60" : ""}`}><h2 className="flex items-center gap-2 text-xl font-bold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600"><Headphones className="h-4.5 w-4.5" /></span> c) 듣기 · Tinglash {secBadge(secDone.listening)}</h2>{unit.listenings.map(l => <section key={l.id}><h3 className="mb-3 font-bold">{l.title}</h3>{l.audioUrl ? <audio controls src={l.audioUrl} className="w-full" /> : l.audioText ? <><Button variant="outline" onClick={() => speak(l.audioText!)}>Eshitish</Button><p className="text-xs text-slate-500">Sintezlangan ovoz (TTS)</p></> : <p>Audio hali qo‘shilmagan.</p>}{l.transcript && <details className="mt-2 text-sm text-slate-600"><summary>Transkript</summary>{l.transcript}</details>}{l.questions.map((q, i) => <div key={i} className="mt-4"><p>{q.text}</p>{choices(`${l.id}:${i}`, q.options.map(o => o.text), locked.listening, q.options.findIndex(o => o.key === q.correct))}</div>)}</section>)}{doneFooter(secDone.listening, "listening", <Button disabled={saving || !unit.listenings.length} onClick={() => submit("listening")}>Tekshirish va saqlash</Button>)}</Card>

      {/* d) So'zlar (Lug'at) — 1..35 */}
      <Card className={`space-y-4 overflow-hidden p-5 border-0 ring-1 ring-emerald-100 ${locked.vocab ? "opacity-60" : ""}`}><h2 className="flex items-center gap-2 text-xl font-bold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><BookOpen className="h-4.5 w-4.5" /></span> d) So‘zlar · Lug‘at {secBadge(secDone.vocab)}<span className="ml-auto text-xs font-medium text-slate-400">{unit.vocab.length}/{MAX_VOCAB} so‘z</span></h2>{unit.vocab.map((v, i) => <div key={v.id} className="border-b pb-3"><h3 className="text-lg font-bold"><span className="mr-2 text-sm font-medium text-slate-400">{i + 1}.</span>{v.ko} <button aria-label={`${v.ko} talaffuzi`} onClick={() => speak(v.ko)} className="text-blue-600"><Volume2 className="h-4 w-4" /></button></h3><p className="text-sm text-slate-500">{v.tr}</p><details><summary>Tarjima va misol</summary><p>{v.uz}</p><p>{v.exampleKo}</p><p>{v.exampleUz}</p></details>{choices(v.id, unit.vocab.map(w => w.uz), locked.vocab, i)}</div>)}{doneFooter(secDone.vocab, "vocab", <Button disabled={saving || !unit.vocab.length} onClick={() => submit("vocab")}>Tekshirish va saqlash</Button>)}</Card>

      {/* e) Yozish */}
      {unit.writings.length > 0 && <Card className="space-y-5 overflow-hidden p-5 border-0 ring-1 ring-rose-100"><h2 className="flex items-center gap-2 text-xl font-bold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-50 text-rose-600"><PenLine className="h-4.5 w-4.5" /></span> e) Yozish mashqlari</h2>{unit.writings.map(w => <section key={w.id} className="space-y-3"><h3 className="font-bold">{w.title}</h3><p className="text-sm text-slate-700">{w.prompt}</p>{w.criteria && <p className="text-xs text-slate-500">Meyzonlar: {w.criteria}</p>}<textarea value={writingText} onChange={e => setWritingText(e.target.value)} rows={8} placeholder="Javobingizni koreys tilida yozing…" className="w-full rounded-xl border border-slate-200 p-3 text-base sm:text-sm focus:border-blue-500 focus:outline-none" /><div className="flex items-center justify-between gap-2"><span className="text-xs text-slate-400">{writingText.length} belgi</span><Button onClick={() => submitWriting(w.id)} disabled={writingBusy || writingText.trim().length < 10}>{writingBusy ? "Baholanmoqda…" : "Topshirish"}</Button></div>{writingResult && <div className="rounded-xl bg-emerald-50 p-3 text-sm" role="status"><b>Baho: {writingResult.score ?? "—"}/100</b><p className="mt-1 text-slate-600">{writingResult.feedback}</p></div>}{w.sampleAnswer && <details className="text-sm text-slate-500"><summary>Namuna javob</summary>{w.sampleAnswer}</details>}{(writingHistory[w.id]?.length ?? 0) > 0 && <details className="text-sm text-slate-500"><summary>Oxirgi urinishlar</summary>{writingHistory[w.id]!.map(a => <div key={a.id} className="mt-1 flex justify-between"><span>{new Date(a.createdAt).toLocaleDateString("uz-UZ")}</span><b>{a.score ?? "—"}/100</b></div>)}</details>}</section>)}</Card>}

      {units.length > 0 && (() => {
        const idx = units.findIndex(u => u.id === id);
        const done = (me?.stars ?? 0) > 0;
        const remain = statusParts.filter(p => !p.ok).map(p => p.label);
        const nxt = idx >= 0 ? units[idx + 1] : undefined;
        const nextOpen = !!nxt && units.slice(0, idx + 1).every(u => progress.some(p => p.unitId === u.id && p.stars > 0));
        return <Card className="space-y-3 overflow-hidden border-0 ring-1 ring-slate-200 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Unit holati</span>
            <span className="text-sm text-slate-500">{statusParts.filter(p => p.ok).length}/{statusParts.length} bo&apos;lim</span>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {statusParts.map(p => <span key={p.label} className={`flex items-center gap-1 rounded-full px-3 py-1 font-medium ring-1 ${p.ok ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200"}`}>{p.ok ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}{p.label}</span>)}
          </div>
          {done ? (nxt ? (nextOpen
            ? <Link href={`/dars/${nxt.id}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-md shadow-blue-500/25 hover:gap-3 transition-all">Keyingi unit: {nxt.topic} <ArrowRight className="h-4 w-4" /></Link>
            : <p className="text-sm text-amber-600">Keyingi unit hali ochilmagan — avval boshqa unitlarni yakunlang.</p>)
            : <p className="text-sm font-medium text-emerald-700">Barcha unitlar yakunlandi — zo&apos;r natija!</p>)
            : <p className="text-sm text-slate-600">Unitni yakunlash uchun qoldi: <b>{remain.join(" · ")}</b></p>}
          <Link href="/dars" className="text-sm text-blue-600">← Darslar ro&apos;yxati</Link>
        </Card>;
      })()}
    </>}
    {result && <div ref={resultRef}><Card className={`space-y-3 overflow-hidden border-0 p-5 ${result.passed ? "bg-gradient-to-br from-emerald-50 to-teal-50 ring-1 ring-emerald-200" : "bg-gradient-to-br from-amber-50 to-orange-50 ring-1 ring-amber-200"}`} role="status"><h2 className="text-xl font-bold">{result.passed ? "🎉 " : ""}{result.score}/{result.total} · +{result.gained} XP</h2><p>{result.passed ? "Yakunlandi!" : "80% natijaga erishish uchun yana mashq qiling."}</p>{result.review.map(r => <p key={r.key} className="text-sm">{answers[r.key] === r.correct ? "✓" : "✗"} {r.explanation}</p>)}</Card></div>}
  </div>;
}
