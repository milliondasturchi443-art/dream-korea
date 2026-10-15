"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { darsRequest } from "@/lib/dars-client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, Coins, Lock, Check } from "lucide-react";

type Unit = { id: string; title: string; topic: string; level: string; order: number };
type ProgressRow = { unitId: string; stars: number; vocabDone: boolean; grammarDone: boolean; listeningDone: boolean; homeworkDone: boolean };

export default function DarsPage() {
  const [data, setData] = useState<{ units: Unit[]; progress: ProgressRow[]; user: { stars: number; coins: number } } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([darsRequest<{ units: Unit[] }>("/api/dars"), darsRequest<{ progress: ProgressRow[]; user: { stars: number; coins: number } }>("/api/dars/progress")])
      .then(([catalog, progress]) => { if (active) setData({ ...catalog, ...progress }); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);
  if (error) return <Card className="m-6 p-6" role="alert">{error} <button onClick={() => location.reload()} className="text-blue-600">Qayta yuklash</button></Card>;
  if (!data) return <p className="p-8" role="status">Darslar yuklanmoqda…</p>;
  const completed = data.units.filter(u => data.progress.some(p => p.unitId === u.id && p.stars > 0)).length;
  return <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
    <header className="flex items-center justify-between"><h1 className="text-3xl font-bold">Darslar</h1><Link href="/profile" className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm"><Star className="h-4 w-4 text-amber-500" /> {data.user?.stars ?? 0} · <Coins className="h-4 w-4 text-amber-600" /> {data.user?.coins ?? 0}</Link></header>
    <Card className="p-5"><p className="mb-3">Har kuni bir qadam — Koreyaga yaqinroq 🇰🇷</p><Progress value={data.units.length ? completed / data.units.length * 100 : 0} /><p className="mt-2 text-sm text-slate-500">{completed}/{data.units.length} unit yakunlandi</p></Card>
    {!data.units.length && <Card className="p-8 text-center">Darslar hali nashr qilinmagan. <Link className="text-blue-600" href="/courses">Mavjud kurslarni ochish →</Link></Card>}
    <ol className="relative space-y-8 py-6">
      {data.units.map((unit, index) => {
        const p = data.progress.find(p => p.unitId === unit.id);
        const unlocked = data.units.slice(0, index).every(u => data.progress.some(p => p.unitId === u.id && p.stars > 0));
        // Uy vazifasi olib tashlandi — progress 3 bo'lim bo'yicha (vocab/grammar/listening)
        const percent = p ? Math.round([p.vocabDone, p.grammarDone, p.listeningDone].filter(Boolean).length / 3 * 100) : 0;
        return <li key={unit.id} className={`relative ${index % 2 ? "ml-8 sm:ml-32" : "mr-8 sm:mr-32"}`}>
          {index > 0 && <svg aria-hidden="true" className="absolute -top-8 left-1/3 h-8 w-32" viewBox="0 0 128 32"><path d="M 0 0 C 0 24 128 8 128 32" fill="none" stroke="#93c5fd" strokeWidth="3" strokeDasharray="5 5" /></svg>}
          <Card className={`flex items-center gap-4 p-5 ${unlocked ? "border-blue-200" : "opacity-60"}`}><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">{percent === 100 ? <Check className="h-6 w-6" /> : unlocked ? unit.order : <Lock className="h-5 w-5" />}</span><div className="min-w-0 flex-1"><p className="text-xs text-slate-500">Unit {unit.order} · {unit.level}</p><h2 className="font-bold">{unit.topic}</h2><Progress value={percent} className="my-2" /><p className="text-xs text-slate-500">{percent}% · {percent === 100 ? "Yakunlandi" : percent ? "Jarayonda" : unlocked ? "Boshlash mumkin" : "Oldingi unitni yakunlang"}</p>{unlocked && <Link href={`/dars/${unit.id}`} className="mt-2 inline-block font-semibold text-blue-600">{percent ? "Davom etish" : "Boshlash"} →</Link>}</div></Card>
        </li>;
      })}
    </ol>
    <Link href="/topik" className="block rounded-2xl bg-blue-600 p-5 text-center font-bold text-white">TOPIK tayyorgarlik →</Link>
  </div>;
}
