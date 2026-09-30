"use client";
import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { courses } from "@/lib/mock-data";

const tabs = ["Mening darslarim", "Kurslar", "Tugagan"] as const;

export default function CoursesPage() {
  const [tab, setTab] = useState<typeof tabs[number]>("Mening darslarim");
  const myCourses = courses.filter(c => c.progress > 0 && c.progress < 100);
  const allCourses = courses;
  const doneCourses: typeof courses = [];

  const list = tab === "Mening darslarim" ? myCourses : tab === "Tugagan" ? doneCourses : allCourses;

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Mening darslarim</h1>
        <p className="text-sm text-slate-500">Kurslar bo‘yicha progress va keyingi darslar</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab===t ? "border-[#2563eb] text-[#2563eb]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>{t}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-500">Bu bo‘limda kurslar yo‘q.</Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(c => (
            <Card key={c.id} className="overflow-hidden flex flex-col">
              <div className={`h-24 bg-gradient-to-br ${c.color} p-4 flex items-start justify-between`}>
                <Badge className="bg-white text-slate-800 text-[11px]">{c.level}</Badge>
                <span className="text-white/90 text-xs font-medium">{c.completed} / {c.lessons} dars</span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="font-semibold text-slate-900 leading-tight">{c.title}</div>
                <div className="text-xs text-slate-500">{c.subtitle}</div>
                <div className="text-xs text-slate-500 mt-1">Ustoz: <span className="font-medium text-slate-700">{c.teacher}</span></div>
                <Progress value={c.progress} className="mt-3" />
                <div className="mt-1.5 flex justify-between text-xs"><span className="text-slate-500">{c.progress}%</span><span className="font-semibold text-[#2563eb]">{c.price}</span></div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link href={`/courses/${c.id}`}><Button variant="outline" size="sm" className="w-full">Batafsil</Button></Link>
                  <Link href={`/lessons/4`}><Button size="sm" className="w-full">Davom etish</Button></Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5 flex flex-wrap items-center justify-between gap-4 bg-[#eff6ff] border-blue-100">
        <div>
          <div className="font-semibold text-slate-900">Keyingi dars</div>
          <div className="text-sm text-slate-600">15-may, 2026 · 16:00 — 4-dars: Salomlashish</div>
        </div>
        <Link href="/lessons/4"><Button>Darsni davom ettirish</Button></Link>
      </Card>
    </div>
  );
}
