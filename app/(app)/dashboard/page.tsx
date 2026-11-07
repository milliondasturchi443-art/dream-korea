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

type ApiCourse = { id: string; title: string; subtitle: string; level: string; lessons: number; color: string };

function DashboardInner() {
  const [role, setRole] = useState("");
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [userName, setUserName] = useState("Talaba");
  const [loading, setLoading] = useState(true);
  const [topikScore, setTopikScore] = useState<number | null>(null);
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
       const sc = localStorage.getItem("dk_topik_score");
       if (sc !== null) queueMicrotask(() => setTopikScore(Number(sc)));
    } catch {}
    fetch("/api/courses")
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.courses)) setCourses(d.courses);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [searchParams, router]);

  const totalLessons = courses.reduce((s, c) => s + c.lessons, 0);
  const totalDone = courses.reduce((s, c) => s + getCompleted(c.id).length, 0);

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 p-4 lg:p-6">
      <div className="anim-fade-up rounded-[28px] border border-blue-300/40 bg-gradient-to-br from-[#132e68] via-[#1d4ed8] to-[#2563eb] p-5 text-white shadow-[0_18px_44px_-24px_rgba(37,99,235,.7)] sm:p-7">
        <h1 className="text-[24px] font-extrabold tracking-tight sm:text-[30px]">
          Assalomu alaykum, {userName}! 👋
        </h1>
        <p className="mt-1 text-sm text-blue-100 sm:text-base">Bugungi o‘qish rejangizni davom ettiring</p>
      </div>

      {/* real progress over all courses */}
      <div className="anim-fade-up" style={{ animationDelay: "0.05s" }}>
        <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50 p-5 shadow-[0_18px_44px_-24px_rgba(37,99,235,.35)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-lg font-extrabold text-slate-900">Umumiy progress</div>
              <div className="mt-1 text-xs text-slate-500">
                {loading ? "Yuklanmoqda…" : `${totalDone} / ${totalLessons} dars yakunlandi`}
              </div>
              <Progress
                value={totalLessons ? Math.round(totalDone / totalLessons * 100) : 0}
                className="mt-3 w-[280px] max-w-full bg-blue-100 [&>div]:bg-[#2563eb]"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="grid h-16 w-16 place-items-center rounded-full border-[6px] border-blue-100 border-t-[#2563eb] text-sm font-extrabold text-[#2563eb]">
                {totalLessons ? Math.round(totalDone / totalLessons * 100) : 0}%
              </div>
              {courses[0] && (
                <Link href={`/courses/${courses[0].id}`}>
                  <Button size="sm">Davom etish</Button>
                </Link>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
             <div className="rounded-2xl bg-blue-50 p-3">
               <div className="text-xs text-slate-500">Kurslar</div>
              <div className="font-bold">{courses.length}</div>
            </div>
             <div className="rounded-2xl bg-emerald-50 p-3">
               <div className="text-xs text-slate-500">Yakunlangan darslar</div>
              <div className="font-bold">{totalDone}</div>
            </div>
             <div className="rounded-2xl bg-violet-50 p-3">
               <div className="text-xs text-slate-500">TOPIK oxirgi ball</div>
              <div className="font-bold">{topikScore !== null ? topikScore : "—"}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* quick actions */}
      <div>
         <h2 className="text-lg font-extrabold text-slate-900">⚡ Tezkor amallar</h2>
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {quickActions.map(a => (
            <Link key={a.label} href={a.href} className="group">
               <Card className="flex h-full flex-col items-center gap-2 rounded-2xl border-blue-100 bg-white p-4 text-center transition hover:border-blue-300 hover:shadow-md">
                 <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#2563eb] transition-colors group-hover:bg-[#2563eb] group-hover:text-white">
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
