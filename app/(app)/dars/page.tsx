"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { darsRequest } from "@/lib/dars-client";
import { Card } from "@/components/ui/card";
import {
  Star, Coins, Lock, ClipboardCheck, Award, ChevronRight, Loader2,
  GraduationCap, Folder, Sprout, MessageCircle, UtensilsCrossed, CalendarDays, Music, Plane,
} from "lucide-react";

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

// "인사 · Salomlashish" ko'rinishi: title (ko'p hollata ikkala til) + topic
function displayTitle(u: Unit) {
  const t = (u.title || "").trim();
  const tp = (u.topic || "").trim();
  if (!t) return tp;
  if (!tp) return t;
  if (t === tp) return t;
  if (t.includes(tp) || tp.includes(t)) return t.length >= tp.length ? t : tp;
  return `${t} · ${tp}`;
}

// Unit mavzusi bo'yicha navbatdagi rangli tema (mac'takdagi kabi)
const THEMES = [
  { icon: Sprout, ico: "from-emerald-400 to-green-600", card: "from-emerald-50 via-green-50 to-white", ring: "ring-emerald-200/70", bar: "from-emerald-400 to-green-500", btn: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200", badge: "text-emerald-700", blob: "bg-emerald-200/40", stroke: "#10b981" },
  { icon: MessageCircle, ico: "from-violet-400 to-purple-600", card: "from-violet-50 via-purple-50 to-white", ring: "ring-violet-200/70", bar: "from-violet-400 to-purple-500", btn: "bg-violet-100 text-violet-800 hover:bg-violet-200", badge: "text-violet-700", blob: "bg-violet-200/40", stroke: "#8b5cf6" },
  { icon: UtensilsCrossed, ico: "from-amber-400 to-orange-500", card: "from-amber-50 via-orange-50 to-white", ring: "ring-amber-200/70", bar: "from-amber-400 to-orange-500", btn: "bg-amber-100 text-amber-800 hover:bg-amber-200", badge: "text-amber-700", blob: "bg-amber-200/40", stroke: "#f59e0b" },
  { icon: CalendarDays, ico: "from-sky-400 to-blue-600", card: "from-sky-50 via-blue-50 to-white", ring: "ring-sky-200/70", bar: "from-sky-400 to-blue-500", btn: "bg-sky-100 text-sky-800 hover:bg-sky-200", badge: "text-sky-700", blob: "bg-sky-200/40", stroke: "#0ea5e9" },
  { icon: Music, ico: "from-rose-400 to-pink-600", card: "from-rose-50 via-pink-50 to-white", ring: "ring-rose-200/70", bar: "from-rose-400 to-pink-500", btn: "bg-rose-100 text-rose-800 hover:bg-rose-200", badge: "text-rose-700", blob: "bg-rose-200/40", stroke: "#f43f5e" },
  { icon: Plane, ico: "from-teal-400 to-cyan-600", card: "from-teal-50 via-cyan-50 to-white", ring: "ring-teal-200/70", bar: "from-teal-400 to-cyan-500", btn: "bg-teal-100 text-teal-800 hover:bg-teal-200", badge: "text-teal-700", blob: "bg-teal-200/40", stroke: "#14b8a6" },
];

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
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <div className="h-56 animate-pulse rounded-3xl bg-gradient-to-br from-[#1e3a8a] to-[#312e81]" />
      {[0, 1, 2, 3].map(i => <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/70" />)}
      <p className="flex items-center justify-center gap-2 text-sm text-slate-500" role="status"><Loader2 className="h-4 w-4 animate-spin" /> Darslar yuklanmoqda…</p>
    </div>
  );

  const completed = data.units.filter(u => data.progress.some(p => p.unitId === u.id && p.stars > 0)).length;
  const percent = data.units.length ? Math.round(completed / data.units.length * 100) : 0;
  const inProgress = data.units.filter(u => {
    const p = data.progress.find(p => p.unitId === u.id);
    const pc = percentOf(u, p);
    return pc > 0 && pc < 100;
  }).length;

  return <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
    {/* Hero — Koreya manzarasi uslubidagi gradient */}
    <header className="anim-fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1a3d] via-[#1e3a8a] to-[#3b1f6e] p-6 text-white shadow-xl shadow-indigo-900/20">
      {/* tog'lar, shamchiroq va sakura bezaklari */}
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-pink-300/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute right-1/3 -top-16 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute right-10 top-4 select-none text-3xl opacity-50 blur-[0.5px]">🌸</span>
      <span aria-hidden className="pointer-events-none absolute right-1/2 top-24 select-none text-xl opacity-40 blur-[0.5px]">🌸</span>
      <span aria-hidden className="pointer-events-none absolute -bottom-2 right-1/4 select-none text-2xl opacity-40 blur-[0.5px]">🌸</span>

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-200"><GraduationCap className="h-4 w-4" /> Koreys tilini o‘rganish</p>
          <h1 className="mt-1.5 text-4xl font-extrabold tracking-tight drop-shadow-sm">Darslar</h1>
          <p className="mt-1 text-sm text-blue-100">Har kuni bir qadam — Koreyaga yaqinroq qadam</p>
        </div>
        <Link href="/profile" className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-2xl bg-[#0b1220]/60 px-4 py-2 text-sm font-semibold ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-[#0b1220]/80"><Star className="h-4 w-4 text-amber-300" /> {data.user?.stars ?? 0}</span>
          <span className="flex items-center gap-1.5 rounded-2xl bg-[#0b1220]/60 px-4 py-2 text-sm font-semibold ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-[#0b1220]/80"><Coins className="h-4 w-4 text-amber-300" /> {data.user?.coins ?? 0}</span>
        </Link>
      </div>

      {/* Umumiy progress — shisha kartochka */}
      <div className="relative mt-5 rounded-2xl bg-[#0b1220]/40 p-4 ring-1 ring-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-xs font-semibold text-blue-100">Umumiy progress</p>
            <div className="h-3 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 transition-all duration-700" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <span className="text-2xl font-extrabold tabular-nums">{percent}%</span>
        </div>
        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-blue-100">
          <Folder className="h-3.5 w-3.5" /> {completed}/{data.units.length} uniti yakunlandi
          {inProgress > 0 && <><span className="text-blue-300">·</span> <span className="text-amber-200">{inProgress} ta jarayonda</span></>}
        </p>
      </div>
    </header>

    {!data.units.length && (
      <Card className="p-10 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-blue-500"><ClipboardCheck className="h-7 w-7" /></div>
        <p className="font-semibold text-slate-700">Darslar hali nashr qilinmagan</p>
        <Link className="mt-2 inline-block font-semibold text-blue-600 hover:underline" href="/courses">Mavjud kurslarni ochish →</Link>
      </Card>
    )}

    <ol className="relative space-y-9 py-2">
      {data.units.map((unit, index) => {
        const p = data.progress.find(p => p.unitId === unit.id);
        const unlocked = data.units.slice(0, index).every(u => data.progress.some(p => p.unitId === u.id && p.stars > 0));
        const percent = percentOf(unit, p);
        const th = THEMES[index % THEMES.length]!;
        const prevTh = THEMES[(index - 1 + THEMES.length) % THEMES.length]!;
        const Icon = th.icon;
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
              <Card className={`relative overflow-hidden flex items-center gap-4 border-0 p-5 ring-1 ${blockDone ? "from-amber-50 via-orange-50 to-white bg-gradient-to-br ring-amber-200/70" : "bg-slate-50 ring-slate-200 opacity-70"}`}>
                {blockDone && <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/40 blur-3xl" />}
                <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${blockDone ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-300/50" : "bg-slate-200 text-slate-500"}`}>{blockDone ? <ClipboardCheck className="h-7 w-7" /> : <Lock className="h-5 w-5" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-amber-700">Imtihon · Unit {from}–{unit.order}</p>
                  <h2 className="font-bold text-slate-900">Imtihon {from}–{unit.order}: so‘z va grammatika</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{doneCount}/{BLOCK} unit yakunlandi</span>
                    {best && <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-semibold text-amber-700 shadow-sm"><Award className="h-3.5 w-3.5" /> Eng yaxshi: {best.score}/{best.total} ({best.total ? Math.round(best.score / best.total * 100) : 0}%)</span>}
                  </p>
                </div>
                {blockDone
                  ? <Link href={`/dars/imtihon?from=${from}`} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-200">{best ? "Qayta topshirish" : "Imtihon"} <ChevronRight className="h-4 w-4" /></Link>
                  : <p className="hidden shrink-0 text-xs font-medium text-slate-500 sm:block">Barcha {BLOCK} ta unitni<br />yakunlang</p>}
              </Card>
            </li>;
          }
        }

        return [
          <li key={unit.id} className={`relative ${unlocked ? "" : "opacity-70"}`}>
            {/* Unitlar orasidagi gradient chiziq (mac'takdagi kabi) */}
            {index > 0 && (
              <svg aria-hidden="true" className="pointer-events-none absolute -top-9 left-0 z-10 h-9 w-16" viewBox="0 0 64 36" fill="none">
                <defs>
                  <linearGradient id={`dk-conn-${index}`} x1="32" y1="0" x2="32" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor={prevTh.stroke} />
                    <stop offset="1" stopColor={th.stroke} />
                  </linearGradient>
                </defs>
                <path d="M48 0 C48 12 8 10 8 18 C8 26 48 24 48 36" stroke={`url(#dk-conn-${index})`} strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="8" cy="18" r="4.5" fill={th.stroke} stroke="white" strokeWidth="2.5" />
              </svg>
            )}
            <Card className={`group relative overflow-hidden border-0 bg-gradient-to-r ${th.card} p-4 ring-1 sm:p-5 ${unlocked ? `${th.ring} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg` : "ring-slate-200"}`}>
              {/* bezak — poyalchalar */}
              <div aria-hidden className={`pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full ${th.blob} blur-2xl`} />
              <div aria-hidden className={`pointer-events-none absolute -bottom-12 right-1/4 h-24 w-24 rounded-full ${th.blob} blur-2xl`} />

              <div className="relative flex items-center gap-4">
                <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${th.ico} text-white shadow-lg`}>
                  {unlocked ? <Icon className="h-7 w-7" /> : <Lock className="h-6 w-6 text-slate-400" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Unit {unit.order}</span>
                    <span className={`rounded-full bg-white px-2 py-0.5 text-[10px] font-bold shadow-sm ${th.badge}`}>{unit.level}</span>
                  </div>
                  <h2 className="mt-0.5 truncate font-bold text-slate-900">{displayTitle(unit)}</h2>
                  <div className="my-2 h-2.5 overflow-hidden rounded-full bg-white/80 ring-1 ring-slate-200/60">
                    <div className={`h-full rounded-full bg-gradient-to-r ${th.bar} transition-all duration-500`} style={{ width: `${percent}%` }} />
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    {percent}% · {isDone ? "Yakunlandi ✅" : percent ? "Jarayonda" : unlocked ? "Boshlash mumkin" : "Oldingi unitni yakunlang"}
                  </p>
                </div>
                {unlocked
                  ? <Link href={`/dars/${unit.id}`} className={`hidden shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition sm:inline-flex ${th.btn}`}>
                      Darsni ochish <ChevronRight className="h-4 w-4" />
                    </Link>
                  : <span className="hidden shrink-0 items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-400 ring-1 ring-slate-200 sm:inline-flex"><Lock className="h-3.5 w-3.5" /></span>}
              </div>
              {/* mobil uchun to'liq kenglikdagi tugma */}
              {unlocked && <Link href={`/dars/${unit.id}`} className={`mt-3 flex items-center justify-center gap-1 rounded-full py-2 text-sm font-semibold sm:hidden ${th.btn}`}>Darsni ochish <ChevronRight className="h-4 w-4" /></Link>}
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
