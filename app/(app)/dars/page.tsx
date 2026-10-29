"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { darsRequest } from "@/lib/dars-client";
import { Card } from "@/components/ui/card";
import { Star, Coins, Lock, Check, ClipboardCheck, Award, Sparkles, BookOpen, ChevronRight, Loader2 } from "lucide-react";

type Unit = { id: string; title: string; topic: string; level: string; order: number; videos?: { id: string }[] };
type ProgressRow = { unitId: string; stars: number; vocabDone: boolean; grammarDone: boolean; listeningDone: boolean; videoDone: boolean; homeworkDone: boolean };
type ExamBest = { from: number; to: number; score: number; total: number; attempts: number };

const BLOCK = 4;

function percentOf(unit: Unit, p?: ProgressRow) {
  if (!p) return 0;
  const total = (unit.videos?.length ?? 0) > 0 ? 4 : 3;
  const done = [...[p.vocabDone, p.grammarDone, p.listeningDone], ...((unit.videos?.length ?? 0) > 0 ? [p.videoDone] : [])].filter(Boolean).length;
  return Math.round(done / total * 100);
}

// TOPIK I — ko'k, TOPIK II — binafsha palitrasi
const LEVEL_STYLE: Record<string, { badge: string; circle: string; ring: string; bar: string }> = {
  "TOPIK I": { badge: "bg-blue-50 text-blue-700 border-blue-200", circle: "from-blue-500 to-indigo-600", ring: "ring-blue-100", bar: "from-blue-400 to-indigo-500" },
  "TOPIK II": { badge: "bg-violet-50 text-violet-700 border-violet-200", circle: "from-violet-500 to-fuchsia-600", ring: "ring-violet-100", bar: "from-violet-400 to-fuchsia-500" },
};
const FALLBACK_STYLE = { badge: "bg-slate-50 text-slate-700 border-slate-200", circle: "from-slate-500 to-slate-700", ring: "ring-slate-100", bar: "from-slate-400 to-slate-600" };

export default function DarsPage() {
  const [data, setData] = useState<{ units: Unit[]; progress: ProgressRow[]; bests: ExamBest[]; user: { stars: number; coins: number } } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      darsRequest<{ units: Unit[] }>("/api/dars"),
      darsRequest<{ progress: ProgressRow[]; user: { stars: number; coins: number } }>("/api/dars/progress"),
      darsRequest<{ bests: ExamBest[] }>("/api/dars/exam"),
    ])
      .then(([catalog, progress, exams]) => { if (active) setData({ ...catalog, ...progress, bests: exams.bests ?? [] }); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);

  if (error) return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <Card className="p-8 text-center" role="alert">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-500">⚠️</div>
        <p className="font-medium text-slate-700">{error}</p>
        <button onClick={() => location.reload()} className="mt-3 font-semibold text-blue-600 hover:underline">Qayta yuklash</button>
      </Card>
    </div>
  );

  if (!data) return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="h-36 animate-pulse rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100" />
      <div className="h-24 animate-pulse rounded-3xl bg-white/70" />
      {[0, 1, 2].map(i => <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/70" />)}
      <p className="flex items-center justify-center gap-2 text-sm text-slate-500" role="status"><Loader2 className="h-4 w-4 animate-spin" /> Darslar yuklanmoqda…</p>
    </div>
  );

  const completed = data.units.filter(u => data.progress.some(p => p.unitId === u.id && p.stars > 0)).length;
  const percent = data.units.length ? Math.round(completed / data.units.length * 100) : 0;
  const inProgress = data.units.filter(u => {
    const p = data.progress.find(p => p.unitId === u.id);
    return p && percentOf(u, p) > 0 && percentOf(u, p) < 100;
  }).length;

  return <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
    {/* Hero — gradientli fon */}
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#7c3aed] p-6 text-white shadow-lg shadow-blue-500/20 anim-fade-up">
      {/* bezak — yumaloq shovqinlar */}
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute right-6 top-4 text-6xl opacity-20 select-none">한</div>
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-blue-100"><Sparkles className="h-3.5 w-3.5" /> Koreys tilini bosqichma-bosqich o‘rganing</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Darslar</h1>
          <p className="mt-1 text-sm text-blue-100">Har kuni bir qadam — Koreyaga yaqinroq 🇰🇷</p>
        </div>
        <Link href="/profile" className="flex items-center gap-4 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm ring-1 ring-white/20 transition hover:bg-white/25">
          <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-amber-300" /> {data.user?.stars ?? 0}</span>
          <span className="h-4 w-px bg-white/30" />
          <span className="flex items-center gap-1.5"><Coins className="h-4 w-4 text-amber-300" /> {data.user?.coins ?? 0}</span>
        </Link>
      </div>
      {/* umumiy progress */}
      <div className="relative mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-blue-100">
          <span>Umumiy progress</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-400 transition-all duration-700" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-xs text-blue-100">{completed}/{data.units.length} unit yakunlandi {inProgress > 0 && <span className="text-amber-200">· {inProgress} ta jarayonda</span>}</p>
      </div>
    </header>

    {!data.units.length && (
      <Card className="p-10 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-blue-500"><BookOpen className="h-7 w-7" /></div>
        <p className="font-semibold text-slate-700">Darslar hali nashr qilinmagan</p>
        <Link className="mt-2 inline-block font-semibold text-blue-600 hover:underline" href="/courses">Mavjud kurslarni ochish →</Link>
      </Card>
    )}

    <ol className="relative space-y-8 py-2">
      {data.units.map((unit, index) => {
        const p = data.progress.find(p => p.unitId === unit.id);
        const unlocked = data.units.slice(0, index).every(u => data.progress.some(p => p.unitId === u.id && p.stars > 0));
        const percent = percentOf(unit, p);
        const st = LEVEL_STYLE[unit.level] ?? FALLBACK_STYLE;
        const isDone = percent === 100;
        // Blok yakunlangach (har 4 ta unitdan so'ng) — Imtihon kartochkasi
        let examCard: ReactNode = null;
        if (unit.order % BLOCK === 0) {
          const from = unit.order - BLOCK + 1;
          const blockUnits = data.units.filter(u => u.order >= from && u.order <= unit.order);
          if (blockUnits.length === BLOCK) {
            const doneCount = blockUnits.filter(bu => percentOf(bu, data.progress.find(pp => pp.unitId === bu.id)) === 100).length;
            const blockDone = doneCount === BLOCK;
            const best = data.bests.find(b => b.from === from) ?? null;
            examCard = <li key={`imtihon-${unit.order}`} className="relative">
              <Card className={`relative overflow-hidden flex items-center gap-4 p-5 border-0 ${blockDone ? "bg-gradient-to-br from-amber-50 to-orange-50 ring-1 ring-amber-200" : "bg-slate-50 ring-1 ring-slate-200 opacity-70"}`}>
                {blockDone && <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-200/40 blur-2xl" />}
                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${blockDone ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-300/50" : "bg-slate-200 text-slate-500"}`}>{blockDone ? <ClipboardCheck className="h-6 w-6" /> : <Lock className="h-5 w-5" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-amber-700">Imtihon · Unit {from}–{unit.order}</p>
                  <h2 className="font-bold text-slate-900">Imtihon {from}–{unit.order}: so‘z va grammatika</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{doneCount}/{BLOCK} unit yakunlandi</span>
                    {best && <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-semibold text-amber-700 shadow-sm"><Award className="h-3.5 w-3.5" /> Eng yaxshi: {best.score}/{best.total} ({best.total ? Math.round(best.score / best.total * 100) : 0}%)</span>}
                  </p>
                  {blockDone
                    ? <Link href={`/dars/imtihon?from=${from}`} className="mt-2 inline-flex items-center gap-1 font-semibold text-amber-700 hover:gap-2 transition-all">{best ? "Qayta topshirish" : "Imtihonga kirish"} <ChevronRight className="h-4 w-4" /></Link>
                    : <p className="mt-2 text-xs font-medium text-slate-500">Imtihonga kirish uchun barcha {BLOCK} ta unitni yakunlang</p>}
                </div>
              </Card>
            </li>;
          }
        }
        return [
          <li key={unit.id} className={`relative ${index % 2 ? "ml-8 sm:ml-32" : "mr-8 sm:mr-32"}`}>
            {index > 0 && <svg aria-hidden="true" className="absolute -top-8 left-1/3 h-8 w-32" viewBox="0 0 128 32"><path d="M 0 0 C 0 24 128 8 128 32" fill="none" stroke="#93c5fd" strokeWidth="3" strokeDasharray="5 5" /></svg>}
            <Card className={`group relative overflow-hidden flex items-center gap-4 p-5 border-0 ring-1 transition-all duration-200 ${unlocked ? `${st.ring} ring-blue-100 hover:shadow-lg hover:-translate-y-0.5` : "ring-slate-200 opacity-60"}`}>
              <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${isDone ? "from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-300/50" : unlocked ? `${st.circle} text-white shadow-md` : "bg-slate-200 text-slate-500"} text-xl font-bold`}>
                {isDone ? <Check className="h-6 w-6" /> : unlocked ? unit.order : <Lock className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-slate-500">Unit {unit.order}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${st.badge}`}>{unit.level}</span>
                </div>
                <h2 className="font-bold text-slate-900">{unit.topic}</h2>
                <div className="my-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full bg-gradient-to-r ${st.bar} transition-all duration-500`} style={{ width: `${percent}%` }} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">{percent}% · {percent === 100 ? "Yakunlandi ✅" : percent ? "Jarayonda" : unlocked ? "Boshlash mumkin" : "Oldingi unitni yakunlang"}</p>
                  {unlocked && <Link href={`/dars/${unit.id}`} className="inline-flex items-center gap-0.5 text-sm font-semibold text-blue-600 hover:gap-1.5 transition-all">{percent ? "Davom etish" : "Boshlash"} <ChevronRight className="h-4 w-4" /></Link>}
                </div>
              </div>
            </Card>
          </li>,
          examCard,
        ];
      }).flat()}
    </ol>
    <Link href="/topik" className="block overflow-hidden rounded-3xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] p-6 text-center font-bold text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.01]">
      <span className="text-lg">TOPIK tayyorgarlik</span>
      <span className="mt-1 block text-xs font-normal text-blue-100">Testlar va mashqlar bilan bilimingizni sinang →</span>
    </Link>
  </div>;
}
