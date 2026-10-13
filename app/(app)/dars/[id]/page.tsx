"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { darsRequest } from "@/lib/dars-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/tts";
import { youtubeEmbedUrl } from "@/lib/youtube";

type Exercise = { q: string; options: string[]; correct: number };
type Unit = {
  title: string; topic: string; level: string;
  vocab: { id: string; ko: string; uz: string; tr?: string; exampleKo?: string; exampleUz?: string }[];
  videos: { id: string; title: string; videoUrl: string }[];
  grammars: { id: string; title: string; explain: string; pattern?: string; examples: { ko: string; uz: string }[]; exercises: Exercise[] }[];
  listenings: { id: string; title: string; audioUrl?: string; audioText?: string; questions: { text: string; options: { key: string; text: string }[] }[] }[];
};
type Result = { score: number; total: number; gained: number; passed: boolean; review: { key: string; correct: number; explanation: string }[] };

export default function UnitPage() {
  const { id } = useParams<{ id: string }>();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { let active = true; darsRequest<Unit>(`/api/dars/${id}`).then(u => { if (active) setUnit(u); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [id]);
  async function submit(section: string) {
    setSaving(true); setError(""); setResult(null);
    try { setResult(await darsRequest<Result>("/api/dars/progress", { unitId: id, section, answers })); }
    catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }
  function choices(key: string, options: string[]) {
    return <fieldset className="mt-3 flex flex-wrap gap-2" aria-label="Javob variantlari">{options.map((option, i) => <label key={i} className={`cursor-pointer rounded-xl border p-3 ${answers[key] === i ? "border-blue-500 bg-blue-50" : "bg-white"}`}><input type="radio" name={key} checked={answers[key] === i} onChange={() => setAnswers(a => ({ ...a, [key]: i }))} className="mr-2" />{option}</label>)}</fieldset>;
  }
  return <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
    <Link href="/dars" className="text-blue-600">← Darslar</Link>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {!unit ? <p>Yuklanmoqda…</p> : <>
      <header><p className="text-sm text-blue-600">{unit.level}</p><h1 className="text-2xl font-bold">{unit.topic}</h1></header>
      <Card className="space-y-4 p-5"><h2 className="text-xl font-bold">📚 Lug‘at</h2>{unit.vocab.map(v => <div key={v.id} className="border-b pb-3"><h3 className="text-lg font-bold">{v.ko} <button aria-label={`${v.ko} talaffuzi`} onClick={() => speak(v.ko)}>🔊</button></h3><p className="text-sm text-slate-500">{v.tr}</p><details><summary>Tarjima va misol</summary><p>{v.uz}</p><p>{v.exampleKo}</p><p>{v.exampleUz}</p></details>{choices(v.id, unit.vocab.map(w => w.uz))}</div>)}<Button disabled={saving || !unit.vocab.length} onClick={() => submit("vocab")}>Tekshirish va saqlash</Button></Card>
      <Card className="space-y-4 p-5"><h2 className="text-xl font-bold">🎬 Video Dars</h2>{!unit.videos.length && <p className="text-slate-500">Bu unitga video hali qo‘shilmagan.</p>}{unit.videos.map(v => <div key={v.id}><h3 className="mb-2 font-bold">{v.title}</h3>{youtubeEmbedUrl(v.videoUrl) ? <iframe title={v.title} src={youtubeEmbedUrl(v.videoUrl)!} className="aspect-video w-full rounded-xl" allowFullScreen /> : <video controls preload="metadata" src={v.videoUrl} className="w-full rounded-xl" />}</div>)}</Card>
      <Card className="space-y-4 p-5"><h2 className="text-xl font-bold">📝 Uy Vazifalar</h2><p>Quyidagi grammatika mashqlarini bajaring va javoblaringizni topshiring.</p><Button disabled={saving || !unit.grammars.length} onClick={() => submit("homework")}>Uy vazifasini topshirish</Button></Card>
      <Card className="space-y-5 p-5"><h2 className="text-xl font-bold">문법 · Grammatika</h2>{unit.grammars.map(g => <section key={g.id} className="space-y-3"><h3 className="font-bold">{g.title}</h3><p className="rounded-xl bg-blue-50 p-3 font-bold">{g.pattern}</p><p>{g.explain}</p>{g.examples.map((e, i) => <p key={i}>{e.ko} — {e.uz}</p>)}{g.exercises.map((e, i) => <div key={i}><p>{e.q}</p>{choices(`${g.id}:${i}`, e.options)}</div>)}</section>)}<Button disabled={saving || !unit.grammars.length} onClick={() => submit("grammar")}>Tekshirish va saqlash</Button></Card>
      <Card className="space-y-5 p-5"><h2 className="text-xl font-bold">듣기 · Tinglash</h2>{unit.listenings.map(l => <section key={l.id}><h3 className="mb-3 font-bold">{l.title}</h3>{l.audioUrl ? <audio controls src={l.audioUrl} className="w-full" /> : l.audioText ? <><Button variant="outline" onClick={() => speak(l.audioText!)}>Eshitish</Button><p className="text-xs text-slate-500">Sintezlangan ovoz (TTS)</p></> : <p>Audio hali qo‘shilmagan.</p>}{l.questions.map((q, i) => <div key={i} className="mt-4"><p>{q.text}</p>{choices(`${l.id}:${i}`, q.options.map(o => o.text))}</div>)}</section>)}<Button disabled={saving || !unit.listenings.length} onClick={() => submit("listening")}>Tekshirish va saqlash</Button></Card>
    </>}
    {result && <Card className="space-y-3 p-5" role="status"><h2 className="text-xl font-bold">{result.score}/{result.total} · +{result.gained} XP</h2><p>{result.passed ? "Yakunlandi!" : "80% natijaga erishish uchun yana mashq qiling."}</p>{result.review.map(r => <p key={r.key}>{answers[r.key] === r.correct ? "✓" : "✗"} {r.explanation}</p>)}</Card>}
  </div>;
}
