"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getCompleted, isLessonUnlocked } from "@/lib/lesson-progress";
import { CheckCircle2, Lock, Play, Clock, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const tabs = ["Darslar", "Testlar", "Materiallar", "O‘qituvchi"] as const;
type Lesson = { id: string; order: number; title: string; duration: string };
type Material = { id: string; title: string; kind: string; url: string | null };

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tab, setTab] = useState<typeof tabs[number]>("Darslar");
  const [completed, setCompleted] = useState<number[]>([]);
  const [course, setCourse] = useState<{ id: string; title: string; subtitle: string; level: string; teacher: string; color: string } | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const ac = new AbortController();
    fetch(`/api/courses/${encodeURIComponent(id)}`, { signal: ac.signal })
      .then(async r => { const d = await r.json().catch(() => ({} as Record<string, unknown>)); if (!r.ok) throw new Error(String((d as Record<string, unknown>).error ?? `HTTP ${r.status}`)); if ((d as Record<string, unknown>).error) throw new Error(String((d as Record<string, unknown>).error)); setCourse({ id: String((d as Record<string, unknown>).id ?? id), title: String((d as Record<string, unknown>).title ?? ""), subtitle: String((d as Record<string, unknown>).subtitle ?? ""), level: String((d as Record<string, unknown>).level ?? "A1"), teacher: String((d as Record<string, unknown>).teacher ?? "Administrator"), color: "from-[#1e3a8a] to-[#3b82f6]" }); const ls = Array.isArray((d as Record<string, unknown>).lessons) ? (d as Record<string, unknown>).lessons as Lesson[] : []; setLessons(ls); })
      .catch(e => { if ((e as Error).name !== "AbortError") toast.error("Kurs yuklanmadi"); })
      .finally(() => setLoading(false));
    fetch("/api/materials", { signal: ac.signal }).then(r=>r.json()).then(d=>{ const v = d as { items?: Material[] }; if (Array.isArray(v.items)) setMaterials(v.items); }).catch(()=>{});
    return () => ac.abort();
  }, [id]);

  useEffect(() => { if (course) setCompleted(getCompleted(course.id)); }, [course?.id]);

  if (loading) return <div className="mx-auto max-w-[1100px] p-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Yuklanmoqda…</div>;
  if (!course) return <div className="mx-auto max-w-[1100px] p-8 text-center"><Card className="p-8">Kurs topilmadi</Card></div>;

  const progress = lessons.length ? Math.round((completed.length / lessons.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card className="overflow-hidden">
          <div className={`h-40 bg-gradient-to-br ${course.color} p-6 text-white flex flex-col justify-end`}>
            <Badge className="bg-white text-slate-800 w-fit text-[11px]">{course.level}</Badge>
            <h1 className="mt-2 text-2xl font-bold leading-tight">{course.title}</h1>
            <p className="text-white/80 text-sm">{course.subtitle}</p>
          </div>
          <div className="p-5 grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed">Barcha kurslar bepul (БД). Darslar ketma-ket — keyingisi faqat oldingisini tugatgach ochiladi.</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5"/> {lessons.length} dars</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5">Ustoz: {course.teacher}</span>
                <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1.5 font-bold">Bepul</span>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Progress</span><span>{progress}%</span></div>
                <Progress value={progress} />
              </div>
            </div>
            <div className="space-y-2">
              <Link href={lessons[0] ? `/lessons/${lessons[0].id}?course=${course.id}` : "#"}><Button className="w-full" disabled={!lessons[0]}>Bepul boshlash</Button></Link>
              <p className="text-xs text-center text-slate-500">Barcha darslar bepul — ketma-ket o‘ting</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="flex gap-2 border-b border-slate-200 overflow-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${tab===t ? "border-[#2563eb] text-[#2563eb]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>{t}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "Darslar" && (
          <motion.div key="darslar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-2">
            {lessons.length === 0 ? <Card className="p-8 text-center text-sm text-slate-500">Hali dars yo‘q — administrator qo‘shadi</Card> :
              lessons.map((l, idx) => {
                const unlocked = isLessonUnlocked(course.id, idx);
                const done = completed.includes(idx);
                return (
                  <motion.div key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} layout>
                    <Link
                      href={unlocked ? `/lessons/${l.id}?course=${course.id}` : "#"}
                      onClick={e => { if (!unlocked) { e.preventDefault(); toast.error("Oldingi darsni yakunlang, keyin ochiladi"); }}}
                      className={`flex items-center gap-3 p-4 rounded-2xl border bg-white transition-all ${!unlocked ? "opacity-60 cursor-not-allowed border-slate-200" : "hover:border-blue-200 hover:shadow-sm border-slate-200"}`}
                    >
                      <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 transition-colors ${done ? "bg-emerald-100 text-emerald-600" : !unlocked ? "bg-slate-100 text-slate-400" : "bg-[#eff6ff] text-[#2563eb]"}`}>
                        {done ? <CheckCircle2 className="h-5 w-5" /> : !unlocked ? <Lock className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900">{idx+1}-dars · {l.title}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3"/>{l.duration} {done ? "· Yakunlandi" : !unlocked ? "· Yopiq — oldingisini tugating" : ""}</div>
                      </div>
                      <span className="text-xs font-medium hidden sm:block" style={{ color: !unlocked ? "#94a3b8" : "#2563eb" }}>{!unlocked ? "🔒 Yopiq" : done ? "Takrorlash →" : "Ochish →"}</span>
                    </Link>
                  </motion.div>
                );
              })}
          </motion.div>
        )}
      </AnimatePresence>
      {tab !== "Darslar" && tab !== "Materiallar" && (
        <Card className="p-8 text-center text-sm text-slate-500">
          {tab === "Testlar" && <span>Testlar — /topik bo‘limida (TOPIK).</span>}
          {tab === "O‘qituvchi" && <span>Ustoz: {course.teacher}</span>}
        </Card>
      )}
      {tab === "Materiallar" && (
        <motion.div key="materiallar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
          {materials.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">Hali material yo‘q — administrator qo‘shadi</Card>
          ) : (
            <div className="space-y-2">
              {materials.map(m => (
                <Card key={m.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900">{m.title}</div>
                    <div className="text-xs text-slate-500">{m.kind}</div>
                  </div>
                  {m.url ? (
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[#2563eb] shrink-0">Ochish →</a>
                  ) : <span className="text-xs text-slate-400 shrink-0">Havola yo‘q</span>}
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
