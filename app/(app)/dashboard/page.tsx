"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Book, FileText, Library, Video, Film, Shuffle, Building2, BookMarked, GraduationCap, Headphones, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { getCompleted } from "@/lib/lesson-progress";

const quickActions = [
  { label: "Koreyscha kitob", icon: Book, href: "/books" },
  { label: "TOPIK testlar", icon: FileText, href: "/topik" },
  { label: "Grammatik kitob", icon: Library, href: "/grammar" },
  { label: "TOPIK kitoblar", icon: BookMarked, href: "/books" },
  { label: "Lug‘atlar", icon: Library, href: "/vocabulary" },
  { label: "EPS-TOPIK", icon: GraduationCap, href: "/topik" },
  { label: "Kinolar", icon: Film, href: "/media" },
  { label: "Seriallar", icon: Video, href: "/media" },
  { label: "Foydali dasturlar", icon: Headphones, href: "/videos" },
  { label: "Random so‘z", icon: Shuffle, href: "/vocabulary" },
  { label: "Qabul", icon: Building2, href: "/admission" },
  { label: "Universitetlar", icon: Building2, href: "/universities" },
];

type ApiCourse = { id: string; title: string; subtitle: string; level: string; lessons: number; color: string };
export default function DashboardPage() {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [userName, setUserName] = useState("Talaba");
  useEffect(() => {
    try { const u = JSON.parse(localStorage.getItem("dk_user") || "{}"); if (u.name) setUserName(u.name); } catch {}
    fetch("/api/courses").then(r=>r.json()).then(d=>{ if (Array.isArray(d.courses)) setCourses(d.courses.slice(0,3)); }).catch(()=>{});
  }, []);
  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">Assalomu alaykum, {userName}! 👋</h1>
          <p className="text-sm text-slate-500">Koreys tilida yangi yutuqlarga!</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">🔥 streak</Badge>
        </div>
      </motion.div>

      {/* main progress card */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">TOPIK I <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">68%</Badge></div>
            <div className="text-xs text-slate-500 mt-1">24 / 35 dars</div>
            <Progress value={68} className="mt-3 w-[280px] max-w-full" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full border-[5px] border-slate-100 border-t-[#2563eb] grid place-items-center text-sm font-bold text-[#2563eb]">68%</div>
            <Link href="/courses/2"><Button size="sm">Davom etish</Button></Link>
          </div>
        </div>

        {/* weekly streak */}
        <div className="mt-5">
          <div className="text-sm font-semibold text-slate-900">Haftalik o‘qish seriyasi</div>
          <div className="mt-2 grid grid-cols-7 gap-1.5 max-w-[420px]">
            {[
              { d: "Du", done: true },
              { d: "Se", done: true },
              { d: "Ch", done: true },
              { d: "Pa", done: true },
              { d: "Ju", done: true },
              { d: "Sh", done: false },
              { d: "Ya", done: false },
            ].map(x => (
              <div key={x.d} className={`rounded-xl py-2.5 text-center text-xs font-bold border ${x.done ? "bg-[#2563eb] text-white border-[#2563eb]" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                <div>{x.d}</div>
                <div className="mt-1 text-[10px]">{x.done ? "✓" : "—"}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

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

      {/* today's task + next lesson + my courses */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="font-semibold text-slate-900 flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500"/> Bugungi vazifa</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#2563eb]"/> 20 ta yangi so‘z — <Link href="/vocabulary" className="text-[#2563eb] font-medium">Boshlash</Link></li>
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500"/> 1 ta grammatika darsi — <Link href="/grammar" className="text-[#2563eb] font-medium">O‘rganish</Link></li>
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-500"/> TOPIK reading practice — <Link href="/topik" className="text-[#2563eb] font-medium">Test</Link></li>
          </ul>
          <Progress value={60} className="mt-4" />
          <div className="text-xs text-slate-500 mt-1">3 / 5 bajarildi</div>
        </Card>

        <Card className="p-5">
          <div className="font-semibold text-slate-900">Keyingi dars</div>
          <div className="mt-3 rounded-xl bg-[#eff6ff] p-4">
            <div className="text-sm font-semibold">4-dars: Salomlashish — 안녕하세요</div>
            <div className="text-xs text-slate-600 mt-1">15-may, 2026 · 16:00</div>
            <div className="text-xs text-slate-500">Ustoz: Kim Ji-Hoon</div>
            <Link href="/lessons/4"><Button size="sm" className="mt-3 w-full">Darsni davom ettirish</Button></Link>
          </div>
        </Card>

        <Card className="p-5">
          <div className="font-semibold text-slate-900">Oxirgi faoliyat</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="flex gap-2"><span className="h-6 w-6 rounded-full bg-emerald-100 grid place-items-center text-emerald-700 text-xs">✓</span> 3-dars yakunlandi — 2 soat oldin</li>
            <li className="flex gap-2"><span className="h-6 w-6 rounded-full bg-blue-100 grid place-items-center text-blue-700 text-xs">★</span> 15 ta so‘z yodlandi — kecha</li>
            <li className="flex gap-2"><span className="h-6 w-6 rounded-full bg-violet-100 grid place-items-center text-violet-700 text-xs">✦</span> TOPIK test: 78% — 2 kun oldin</li>
          </ul>
        </Card>
      </div>

      {/* my courses preview — БД + progress */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Mening kurslarim</h2>
          <Link href="/courses" className="text-sm text-[#2563eb] font-medium">Barchasi →</Link>
        </div>
        {courses.length === 0 ? (
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
