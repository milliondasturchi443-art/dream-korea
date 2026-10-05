"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { courses, lessonsByCourse } from "@/lib/mock-data";
import { isLessonUnlocked, getCompleted } from "@/lib/lesson-progress";
import { CheckCircle2, Lock, Play, Clock, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const tabs = ["Darslar", "Testlar", "Materiallar", "O‘qituvchi"] as const;

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState<typeof tabs[number]>("Darslar");
  const [completed, setCompleted] = useState<number[]>([]);
  const course = courses.find(c => c.id === params.id) ?? courses[0];
  const lessons = lessonsByCourse[course.id] ?? [
    { id: "1", title: "Hangul bilan tanishuv", duration: "18 daq", done: false },
    { id: "2", title: "Unli harflar ㅏ ㅓ ㅗ ㅜ", duration: "22 daq", done: false, locked: true },
    { id: "3", title: "Undosh harflar ㄱ ㄴ ㄷ", duration: "20 daq", done: false, locked: true },
    { id: "4", title: "Salomlashish — 안녕하세요", duration: "15 daq", done: false, locked: true },
    { id: "5", title: "O‘zini tanishtirish", duration: "19 daq", done: false, locked: true },
    { id: "6", title: "Raqamlar va sana", duration: "17 daq", done: false, locked: true },
  ];

  useEffect(() => { setCompleted(getCompleted(course.id)); }, [course.id]);
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
              <p className="text-sm text-slate-600 leading-relaxed">Barcha kurslar bepul. Kontentni administrator qo‘shadi. Darslar ketma-ket ochiladi — keyingi dars faqat oldingisini yakunlagach.</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5"/> {lessons.length} dars</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5">Ustoz: {course.teacher}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400"/> 4.9</span>
                <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1.5 font-bold">Bepul</span>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Progress</span><span>{progress}%</span></div>
                <Progress value={progress} />
              </div>
            </div>
            <div className="space-y-2">
              <Link href={`/lessons/${lessons[0]?.id ?? "1"}?course=${course.id}`}><Button className="w-full">Bepul boshlash</Button></Link>
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
            {lessons.map((l, idx) => {
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
      {tab !== "Darslar" && (
        <Card className="p-8 text-center text-sm text-slate-500">
          {tab === "Testlar" && <span>Testlarni faqat administrator qo‘shadi. Hozircha kontent yo‘q — admindan kuting.</span>}
          {tab === "Materiallar" && <span>PDF / audio materiallarni administrator qo‘shadi.</span>}
          {tab === "O‘qituvchi" && <span>Ustoz: {course.teacher} — TOPIK 6, 8 yillik tajriba.</span>}
        </Card>
      )}
    </div>
  );
}
