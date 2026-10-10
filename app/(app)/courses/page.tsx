"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getCompleted } from "@/lib/lesson-progress";
import { motion } from "framer-motion";
import { Reveal } from "@/components/reveal";

type ApiCourse = { id: string; title: string; subtitle: string; level: string; lessons: number; color: string };
const tabs = ["Mening darslarim", "Kurslar", "Tugagan"] as const;

export default function CoursesPage() {
  const [tab, setTab] = useState<typeof tabs[number]>("Kurslar");
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/courses", { signal: ac.signal })
      .then(async r => {
        if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`));
        const d = await r.json();
        if (!Array.isArray(d.courses)) setCourses([]);
        else setCourses(d.courses);
        setError(null);
      })
      .catch(e => {
        if ((e as Error).name === "AbortError") return;
        setError("Kurslar yuklanmadi. Qayta urinib ko'ring.");
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (!courses.length) return;
    const m: Record<string, number> = {};
    for (const c of courses) {
      try {
        const done = getCompleted(c.id).length;
        m[c.id] = c.lessons ? Math.round((done / c.lessons) * 100) : 0;
      } catch { m[c.id] = 0; }
    }
    setProgressMap(m);
  }, [courses]);

  const myCourses = courses.filter(c => (progressMap[c.id] ?? 0) > 0 && (progressMap[c.id] ?? 0) < 100);
  const doneCourses = courses.filter(c => (progressMap[c.id] ?? 0) >= 100);
  const list = tab === "Mening darslarim" ? myCourses : tab === "Tugagan" ? doneCourses : courses;

  if (loading) return <div className="mx-auto max-w-[1100px] p-8 text-center text-sm text-slate-500">Yuklanmoqda…</div>;

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-[22px] font-bold text-slate-900">Mening darslarim</h1>
        <p className="text-sm text-slate-500">Kurslar bo‘yicha progress va keyingi darslar — barcha kurslar bepul (БД).</p>
      </motion.div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===t ? "border-[#2563eb] text-[#2563eb]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>{t}</button>
        ))}
      </div>

      {error ? (
        <Card className="p-10 text-center text-sm text-red-600">
          {error} <button onClick={() => location.reload()} className="ml-2 underline">Qayta yuklash</button>
        </Card>
      ) : list.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-500">
          {tab==="Mening darslarim" ? <><span>Hali boshlamadingiz — </span><button onClick={() => setTab("Kurslar")} className="text-[#2563eb] underline">Kurslar</button><span> dan boshlang.</span></> : tab==="Tugagan" ? "Hali tugatgan kursingiz yo‘q." : "Kurs yo‘q — administrator /admin/content → Kurslar da qo‘shadi."}
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((c, i) => {
            const prog = progressMap[c.id] ?? 0;
            let done = 0;
            try { done = getCompleted(c.id).length; } catch { done = 0; }
            const color = c.color || "from-[#1e3a8a] to-[#3b82f6]";
            return (
              <Reveal key={c.id} delay={Math.min(i * 0.06, 0.42)} className="h-full">
              <Card className="overflow-hidden flex flex-col hover:shadow-md hover:border-blue-200 transition-all h-full">
                <div className={`h-24 bg-gradient-to-br ${color} p-4 flex items-start justify-between`}>
                  <Badge className="bg-white text-slate-800 text-[11px]">{c.level}</Badge>
                  <span className="text-white/90 text-xs font-medium">{done} / {c.lessons} dars</span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="font-semibold text-slate-900 leading-tight line-clamp-2">{c.title}</div>
                  <div className="text-xs text-slate-500 line-clamp-1">{c.subtitle}</div>
                  <Progress value={prog} className="mt-3" />
                  <div className="mt-1.5 flex justify-between text-xs"><span className="text-slate-500">{prog}%</span><span className="font-bold text-emerald-600">Bepul</span></div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link href={`/courses/${c.id}`}><Button variant="outline" size="sm" className="w-full">Batafsil</Button></Link>
                    <Link href={`/courses/${c.id}`}><Button size="sm" className="w-full">Davom etish</Button></Link>
                  </div>
                </div>
              </Card>
              </Reveal>
            );
          })}
        </div>
      )}

      <Card className="p-5 flex flex-wrap items-center justify-between gap-4 bg-[#eff6ff] border-blue-100">
        <div>
          <div className="font-semibold text-slate-900">Keyingi dars</div>
          <div className="text-sm text-slate-600">Kursni oching va birinchi darsdan boshlang — ketma-ket tartib.</div>
        </div>
        <Link href={courses.length ? `/courses/${courses[0].id}` : "/courses"}><Button>Darsni davom ettirish</Button></Link>
      </Card>
    </div>
  );
}
