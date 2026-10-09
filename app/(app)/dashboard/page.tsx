"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Book, FileText, Library, Video, Film, Shuffle, Building2, BookMarked, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import { getCompleted } from "@/lib/lesson-progress";

const quickActions = [
  { label: "Kurslar", icon: Book, href: "/courses" },
  { label: "TOPIK testlar", icon: FileText, href: "/topik" },
  { label: "Grammatika", icon: Library, href: "/grammar" },
  { label: "Lug‘at", icon: Shuffle, href: "/vocabulary" },
  { label: "Kitoblar", icon: BookMarked, href: "/books" },
  { label: "Videodarslar", icon: Video, href: "/videos" },
  { label: "Kinolar & seriallar", icon: Film, href: "/media" },
  { label: "Universitetlar", icon: Building2, href: "/universities" },
  { label: "Qabul", icon: Building2, href: "/admission" },
  { label: "Yordamchi", icon: Headphones, href: "/ai" },
];

type ApiCourse = { id: string; title: string; subtitle: string; level: string; lessons: number; color: string };

export default function DashboardPage() {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [userName, setUserName] = useState("Talaba");
  const [loading, setLoading] = useState(true);
  const [topikScore, setTopikScore] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

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
      if (u.name) setUserName(u.name);
      else {
        fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => {
          if (d?.email) {
            setUserName(d.name || "Foydalanuvchi");
            try { localStorage.setItem("dk_user", JSON.stringify({ email: d.email, name: d.name, role: d.role, id: d.id })); } catch {}
          }
        }).catch(()=>{});
      }
      const sc = localStorage.getItem("dk_topik_score");
      if (sc !== null) setTopikScore(Number(sc));
    } catch {}
    fetch("/api/courses")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.courses)) setCourses(d.courses); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalLessons = courses.reduce((s, c) => s + c.lessons, 0);
  const totalDone = courses.reduce((s, c) => s + getCompleted(c.id).length, 0);

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-[22px] font-bold text-slate-900">Assalomu alaykum, {userName}! 👋</h1>
        <p className="text-sm text-slate-500">Koreys tilida yangi yutuqlarga!</p>
      </motion.div>

      {/* real progress over all courses */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">Umumiy progress</div>
              <div className="text-xs text-slate-500 mt-1">{loading ? "Yuklanmoqda…" : `${totalDone} / ${totalLessons} dars yakunlandi`}</div>
              <Progress value={totalLessons ? Math.round(totalDone / totalLessons * 100) : 0} className="mt-3 w-[280px] max-w-full" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full border-[5px] border-slate-100 border-t-[#2563eb] grid place-items-center text-sm font-bold text-[#2563eb]">
                {totalLessons ? Math.round(totalDone / totalLessons * 100) : 0}%
              </div>
              {courses[0] && <Link href={`/courses/${courses[0].id}`}><Button size="sm">Davom etish</Button></Link>}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-[#eff6ff] p-3"><div className="text-xs text-slate-500">Kurslar</div><div className="font-bold">{courses.length}</div></div>
            <div className="rounded-xl bg-emerald-50 p-3"><div className="text-xs text-slate-500">Yakunlangan darslar</div><div className="font-bold">{totalDone}</div></div>
            <div className="rounded-xl bg-violet-50 p-3">
              <div className="text-xs text-slate-500">TOPIK oxirgi ball</div>
              <div className="font-bold">{topikScore !== null ? topikScore : "—"}</div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* quick actions */}
      <div>
        <h2 className="font-semibold text-slate-900">Tezkor amallar</h2>
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {quickActions.map(a => (
            <Link key={a.label} href={a.href} className="group">
              <Card className="p-4 flex flex-col items-center gap-2 text-center hover:shadow-md hover:border-[#bfdbfe] transition-all h-full">
                <div className="h-10 w-10 rounded-xl bg-[#eff6ff] group-hover:bg-[#2563eb] text-[#2563eb] group-hover:text-white grid place-items-center transition-colors">
                  <a.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-700 leading-tight">{a.label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* my courses — real from DB */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Mening kurslarim</h2>
          <Link href="/courses" className="text-sm text-[#2563eb] font-medium">Barchasi →</Link>
        </div>
        {loading ? (
          <Card className="mt-3 p-6 text-center text-sm text-slate-500">Yuklanmoqda…</Card>
        ) : courses.length === 0 ? (
          <Card className="mt-3 p-6 text-center text-sm text-slate-500">Hali kurs yo‘q — administrator qo‘shadi</Card>
        ) : (
          <div className="mt-3 grid md:grid-cols-3 gap-4">
            {courses.map(c => {
              const done = getCompleted(c.id).length;
              const prog = c.lessons ? Math.round(done / c.lessons * 100) : 0;
              return (
                <Card key={c.id} className="p-4">
                  <div className="text-sm font-semibold text-slate-900 line-clamp-2">{c.title}</div>
                  <div className="text-xs text-slate-500">{c.level} · {done}/{c.lessons} dars</div>
                  <Progress value={prog} className="mt-3" />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{prog}%</span>
                    <Link href={`/courses/${c.id}`} className="text-[#2563eb] font-medium">Kirish →</Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
