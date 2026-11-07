"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Book, FileText, Library, Video, Film, Shuffle, Building2, BookMarked, Headphones, ClipboardList, BarChart3, CalendarCheck, CreditCard } from "lucide-react";
import { getCompleted } from "@/lib/lesson-progress";
import { darsRequest } from "@/lib/dars-client";

type ApiCourse = { id: string; title: string; subtitle: string; level: string; lessons: number; color: string };
type SkillProgress = { dars: number; reading: number; listening: number; writing: number };
type TopikAttempt = { score: number; total: number; test?: { type?: string } };
type WritingAttempt = { score?: number | null };
type DarsProgress = { stars?: number };

function DashboardInner() {
  const [role, setRole] = useState("");
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [userName, setUserName] = useState("Talaba");
  const [loading, setLoading] = useState(true);
  const [skillProgress, setSkillProgress] = useState<SkillProgress>({ dars: 0, reading: 0, listening: 0, writing: 0 });
  const searchParams = useSearchParams();
  const router = useRouter();

  const quickActions = [
    { label: "Kurslar", icon: Book, href: "/courses" },
    ...(role === "STUDENT"
      ? [
          { label: "Uy vazifalarim", icon: ClipboardList, href: "/homework" },
          { label: "Davomat", icon: CalendarCheck, href: "/attendance" },
          { label: "To'lovlarim", icon: CreditCard, href: "/payment" },
        ]
      : []),
    { label: "Statistika", icon: BarChart3, href: "/statistics" },
    { label: "TOPIK testlar", icon: FileText, href: "/topik" },
    { label: "Grammatika", icon: Library, href: "/grammar" },
    { label: "Lug'at", icon: Shuffle, href: "/vocabulary" },
    { label: "Kitoblar", icon: BookMarked, href: "/books" },
    { label: "Videodarslar", icon: Video, href: "/videos" },
    { label: "Kinolar & seriallar", icon: Film, href: "/media" },
    { label: "Universitetlar", icon: Building2, href: "/universities" },
    { label: "Qabul", icon: Building2, href: "/admission" },
    { label: "Yordamchi", icon: Headphones, href: "/ai" },
  ];

  useEffect(() => {
    // ?verified=1 — после перехода по письму
    const v = searchParams.get("verified");
    if (v === "1") {
      toast.success("Email tasdiqlandi — xush kelibsiz!");
      const q = new URLSearchParams(searchParams.toString());
      q.delete("verified");
      const qs = q.toString();
      router.replace(qs ? `/dashboard?${qs}` : "/dashboard");
    }
    try {
      const u = JSON.parse(localStorage.getItem("dk_user") || "{}");
       queueMicrotask(() => {
         if (u.name) setUserName(u.name);
         if (u.role) setRole(String(u.role));
       });
       if (!u.role) {
        fetch("/api/auth/me")
          .then(r => (r.ok ? r.json() : null))
          .then(d => {
            if (d?.email) {
              setUserName(d.name || "Foydalanuvchi");
              if (d?.role) setRole(String(d.role));
              try {
                localStorage.setItem("dk_user", JSON.stringify({ email: d.email, name: d.name, role: d.role, id: d.id }));
              } catch {}
            }
          })
          .catch(() => {});
      }
    } catch {}
    fetch("/api/courses")
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.courses)) setCourses(d.courses);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const token = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token");
    if (token) {
      const headers = { Authorization: `Bearer ${token}` };
      Promise.all([
        fetch("/api/topik/attempt", { headers }).then(r => r.ok ? r.json() : null),
        fetch("/api/topik/writing", { headers }).then(r => r.ok ? r.json() : null),
        darsRequest<{ units: unknown[] }>("/api/dars").catch(() => null),
        darsRequest<{ progress: DarsProgress[] }>("/api/dars/progress").catch(() => null),
      ]).then(([topik, writing, units, dars]) => {
        const attempts = Array.isArray(topik?.attempts) ? topik.attempts as TopikAttempt[] : [];
        const average = (items: TopikAttempt[]) => items.length ? Math.round(items.reduce((sum, a) => sum + (a.total ? a.score / a.total * 100 : 0), 0) / items.length) : 0;
        const writingAttempts = Array.isArray(writing?.attempts) ? writing.attempts as WritingAttempt[] : [];
        const writingScores = writingAttempts.filter(a => typeof a.score === "number").map(a => Number(a.score));
        const darsRows = Array.isArray(dars?.progress) ? dars.progress : [];
        const darsTotal = Array.isArray(units?.units) ? units.units.length : 0;
        setSkillProgress({
          dars: darsTotal ? Math.round(darsRows.filter(p => (p.stars ?? 0) > 0).length / darsTotal * 100) : 0,
          reading: average(attempts.filter(a => a.test?.type?.toLowerCase() === "reading")),
          listening: average(attempts.filter(a => a.test?.type?.toLowerCase() === "listening")),
          writing: writingScores.length ? Math.round(writingScores.reduce((sum, score) => sum + score, 0) / writingScores.length) : 0,
        });
      }).catch(() => {});
    }
  }, [searchParams, router]);

  const totalLessons = courses.reduce((s, c) => s + c.lessons, 0);
  const totalDone = courses.reduce((s, c) => s + getCompleted(c.id).length, 0);

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 p-4 lg:p-6">
      <div className="anim-fade-up relative isolate overflow-hidden rounded-[32px] border border-white/45 bg-gradient-to-br from-[#0d1f4d]/75 via-[#173b83]/60 to-[#2563eb]/45 p-6 text-white shadow-[0_24px_60px_-24px_rgba(37,99,235,.42)] backdrop-blur-xl sm:p-8">
        <div className="absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-blue-500/18 blur-2xl" />
        <div className="absolute -bottom-32 right-24 -z-10 h-64 w-64 rounded-full bg-cyan-400/12 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute right-5 top-1/2 hidden h-40 w-56 -translate-y-1/2 sm:block">
          <div className="absolute right-5 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full border border-cyan-200/20 bg-cyan-300/10 shadow-[0_0_55px_rgba(103,232,249,.16)]" />
          <div className="absolute right-14 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full border border-white/15" />
          <div className="absolute right-16 top-1/2 -translate-y-[46%] text-[54px] font-black leading-none tracking-[-.16em] text-white/15">한글</div>
          <div className="absolute right-0 top-5 h-px w-32 rotate-[28deg] bg-gradient-to-r from-transparent via-cyan-200/45 to-transparent" />
          <div className="absolute bottom-6 right-2 h-px w-40 -rotate-[18deg] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-200/70 shadow-[0_0_14px_rgba(103,232,249,.9)]" />
        </div>
        <div className="relative max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.18em] text-blue-100">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.9)]" /> Dream Korea
          </div>
          <h1 className="text-[26px] font-extrabold tracking-tight sm:text-[34px]">
            Assalomu alaykum, {userName}! <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-blue-100 sm:text-base">Bugungi o‘qish rejangizni davom ettiring va koreys tilidagi maqsadingizga yana bir qadam yaqinlashing.</p>
        </div>
      </div>

      {/* real progress over all courses */}
      <div className="anim-fade-up" style={{ animationDelay: "0.05s" }}>
        <Card className="relative isolate overflow-hidden border border-white/55 bg-gradient-to-br from-white/88 via-blue-50/72 to-white/58 p-5 text-slate-900 shadow-[0_24px_56px_-24px_rgba(37,99,235,.3)] backdrop-blur-xl sm:p-6">
          <div className="absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full bg-cyan-300/12 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 -z-10 h-24 w-56 rounded-full bg-blue-400/12 blur-2xl" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-lg font-extrabold text-slate-900">Umumiy progress <span className="rounded-full bg-blue-100/80 px-2 py-0.5 text-[10px] font-semibold text-blue-700">LIVE</span></div>
              <div className="mt-1 text-xs text-slate-500">
                {loading ? "Yuklanmoqda…" : `${totalDone} / ${totalLessons} dars yakunlandi`}
              </div>
              <Progress
                value={totalLessons ? Math.round(totalDone / totalLessons * 100) : 0}
                className="mt-4 h-3 w-[320px] max-w-full bg-blue-100/70 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-cyan-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="grid h-[76px] w-[76px] place-items-center rounded-full border-[7px] border-blue-100/80 border-t-blue-500 border-r-cyan-400 text-sm font-extrabold text-blue-700 shadow-[0_0_28px_rgba(37,99,235,.12)]">
                {totalLessons ? Math.round(totalDone / totalLessons * 100) : 0}%
              </div>
              {courses[0] && (
                <Link href={`/courses/${courses[0].id}`}>
                  <Button size="sm" className="rounded-xl border border-white/20 bg-white text-[#153574] shadow-lg hover:bg-blue-50">Davom etish <span className="ml-1">→</span></Button>
                </Link>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
             <div className="rounded-2xl border border-white/65 bg-white/45 p-3 backdrop-blur-sm">
               <div className="text-xs text-slate-500">Darslar</div>
               <div className="font-bold">{skillProgress.dars}%</div>
             </div>
             <div className="rounded-2xl border border-white/65 bg-white/45 p-3 backdrop-blur-sm">
                <div className="text-xs text-slate-500">O‘qish · Reading</div>
               <div className="font-bold">{skillProgress.reading}%</div>
             </div>
             <div className="rounded-2xl border border-white/65 bg-white/45 p-3 backdrop-blur-sm">
                <div className="text-xs text-slate-500">Tinglash · Listening</div>
               <div className="font-bold">{skillProgress.listening}%</div>
             </div>
             <div className="col-span-2 rounded-2xl border border-white/65 bg-white/45 p-3 backdrop-blur-sm sm:col-span-1">
                <div className="text-xs text-slate-500">Yozish · Writing</div>
               <div className="font-bold">{skillProgress.writing}%</div>
             </div>
          </div>
        </Card>
      </div>

      {/* quick actions */}
      <div>
         <div className="flex items-end justify-between gap-3">
           <div>
             <div className="mb-1 text-[11px] font-bold uppercase tracking-[.18em] text-blue-600">Bir tegishda</div>
             <h2 className="text-xl font-extrabold text-slate-900">⚡ Tezkor amallar</h2>
           </div>
           <span className="hidden text-xs text-slate-400 sm:block">O‘qishni boshlash uchun tanlang</span>
         </div>
         <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {quickActions.map(a => (
            <Link key={a.label} href={a.href} className="group">
               <Card className="relative flex h-full flex-col items-center gap-2 overflow-hidden rounded-[22px] border-blue-100 bg-white p-4 text-center shadow-[0_8px_24px_-18px_rgba(37,99,235,.7)] transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_18px_30px_-18px_rgba(37,99,235,.75)]">
                 <div className="absolute inset-x-5 top-0 h-1 rounded-b-full bg-gradient-to-r from-cyan-400 to-blue-600 opacity-0 transition group-hover:opacity-100" />
                 <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#2563eb] transition-all duration-200 group-hover:scale-110 group-hover:bg-[#2563eb] group-hover:text-white">
                  <a.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-700 leading-tight">{a.label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* my courses — real from DB */}
      <div className="anim-fade-up" style={{ animationDelay: "0.08s" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Mening kurslarim</h2>
          <Link href="/courses" className="text-sm text-[#2563eb] font-medium">
            Barchasi →
          </Link>
        </div>
        {loading ? (
          <Card className="mt-3 p-6 text-center text-sm text-slate-500">Yuklanmoqda…</Card>
        ) : courses.length === 0 ? (
          <Card className="mt-3 p-6 text-center text-sm text-slate-500">
            Hali kurs yo`q — administrator qo`shadi
          </Card>
        ) : (
          <div className="mt-3 grid md:grid-cols-3 gap-4">
            {courses.map(c => {
              const done = getCompleted(c.id).length;
              const prog = c.lessons ? Math.round(done / c.lessons * 100) : 0;
              return (
                <Card key={c.id} className="p-4">
                  <div className="text-sm font-semibold text-slate-900 line-clamp-2">{c.title}</div>
                  <div className="text-xs text-slate-500">
                    {c.level} · {done}/{c.lessons} dars
                  </div>
                  <Progress value={prog} className="mt-3" />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{prog}%</span>
                    <Link href={`/courses/${c.id}`} className="text-[#2563eb] font-medium">
                      Kirish →
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Yuklanmoqda…</div>}>
      <DashboardInner />
    </Suspense>
  );
}
