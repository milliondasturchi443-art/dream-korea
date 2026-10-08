"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Reveal } from "@/components/reveal";
import { GraduationCap, Cpu, Users, Trophy, BookOpen, Building2, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { universities } from "@/lib/mock-data";

const features = [
  { icon: GraduationCap, title: "Sifatli ta'lim", desc: "Tajribali ustozlar va tasdiqlangan metodika asosida darslar." },
  { icon: Cpu, title: "Zamonaviy texnologiya", desc: "Interaktiv platforma, video darslar va AI yordamchi." },
  { icon: Users, title: "Professional ustozlar", desc: "Koreyada tahsil olgan va TOPIK sertifikatiga ega o‘qituvchilar." },
  { icon: Trophy, title: "Sizning natijangiz", desc: "Kurslar bosqichma-bosqich ochiladi — har bir darsni yakunlab boring." },
];

type ApiCourse = { id: string; title: string; subtitle: string; level: string; teacher: string; lessons: number; color: string };

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [stats, setStats] = useState<{ db: boolean; students: number; courses: number; lessons: number; tests: number } | null>(null);

  useEffect(() => {
    fetch("/api/courses").then(r => r.json()).then(d => { if (Array.isArray(d.courses)) setCourses(d.courses.slice(0, 3)); }).catch(() => {});
    fetch("/api/stats").then(r => r.json()).then(d => setStats(d)).catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="mx-auto max-w-[1200px] px-4 py-10 lg:py-14 grid lg:grid-cols-2 gap-8 items-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Badge className="bg-[#eff6ff] text-[#2563eb] border border-blue-100 mb-4">🇰🇷 Koreys tili platformasi</Badge>
          <h1 className="text-[32px] lg:text-[44px] font-extrabold leading-[1.05] tracking-tight text-[#0f1b3d]">
            Koreys tilini o‘rganing,<br />
            <span className="text-[#2563eb]">orzuingizga yaqinlashing!</span>
          </h1>
          <p className="mt-4 text-slate-600 text-[15px] leading-relaxed max-w-[520px]">Zamonaviy platforma orqali koreys tilini noldan boshlab professional darajagacha o‘rganing. TOPIK, EPS-TOPIK va universitetlarga tayyorgarlik. Barcha kurslar bepul.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register"><Button size="lg">Boshlash — bepul</Button></Link>
            <Link href="/courses"><Button variant="outline" size="lg">Kurslarni ko‘rish</Button></Link>
          </div>
          {stats?.db && stats.students > 0 && (
            <div className="mt-6 text-sm">
              <div className="font-semibold text-slate-900">{stats.students} ta o‘quvchi platformada</div>
            </div>
          )}
        </motion.div>

        {/* Real courses preview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <div className="rounded-[24px] glass overflow-hidden">
            <div className="h-10 bg-[#0f1b3d] flex items-center px-4 gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs text-slate-300">dreamkorea.uz — Kurslar</span>
            </div>
            <div className="p-5 space-y-3">
              <div className="font-bold text-slate-900">Mashhur kurslar</div>
              {courses.length === 0 ? (
                <div className="text-sm text-slate-400 py-6 text-center">Kurslar yuklanmoqda…</div>
              ) : courses.map(c => (
                <Link key={c.id} href="/courses" className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center text-white shrink-0`}><BookOpen className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{c.title}</div>
                    <div className="text-xs text-slate-500">{c.level} · {c.lessons} dars</div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] shrink-0">Bepul</Badge>
                </Link>
              ))}
              <div className="text-[11px] text-slate-400">Barcha kurslar bepul · darslar ketma-ket ochiladi</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <Reveal>
      <section className="mx-auto max-w-[1200px] px-4 py-10">
        <h2 className="text-2xl font-bold text-[#0f1b3d]">Nega DREAM KOREA?</h2>
        <p className="text-slate-500 text-sm mt-1">Natijaga yo‘naltirilgan EdTech tajribasi</p>
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(f => (
            <Card key={f.title} className="p-5">
              <div className="h-10 w-10 rounded-xl bg-[#eff6ff] grid place-items-center text-[#2563eb]"><f.icon className="h-5 w-5" /></div>
              <div className="mt-3 font-semibold text-slate-900">{f.title}</div>
              <div className="mt-1 text-sm text-slate-500 leading-relaxed">{f.desc}</div>
            </Card>
          ))}
        </div>
      </section>
      </Reveal>

      {/* POPULAR COURSES — real from DB */}
      <Reveal>
      <section className="mx-auto max-w-[1200px] px-4 py-6">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-[#0f1b3d]">Kurslar</h2>
          <Link href="/courses" className="text-sm font-medium text-[#2563eb] hover:underline">Barchasi →</Link>
        </div>
        {courses.length === 0 ? (
          <Card className="mt-6 p-8 text-center text-sm text-slate-500">Kurslar hozir yuklanmoqda yoki hali qo‘shilmagan</Card>
        ) : (
          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(c => (
              <Card key={c.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className={`h-28 bg-gradient-to-br ${c.color} relative p-4`}>
                  <Badge className="bg-white text-slate-800 text-[11px]">{c.level}</Badge>
                  <div className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-white/20 backdrop-blur grid place-items-center text-white"><BookOpen className="h-4 w-4" /></div>
                </div>
                <div className="p-4">
                  <div className="font-semibold text-slate-900 leading-tight">{c.title}</div>
                  <div className="text-xs text-slate-500">{c.subtitle} · {c.teacher}</div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{c.lessons} dars</span><span className="font-semibold text-emerald-600">Bepul</span>
                  </div>
                  <Link href={`/courses/${c.id}`}><Button className="w-full mt-3" size="sm">Batafsil</Button></Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
      </Reveal>

      {/* TOPIK */}
      <Reveal>
      <section className="mx-auto max-w-[1200px] px-4 py-8">
        <Card className="p-6 lg:p-8 bg-gradient-to-br from-[#0f1b3d] to-[#1e3a8a] text-white border-0 overflow-hidden relative">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="grid lg:grid-cols-2 gap-6 items-center relative">
            <div>
              <h3 className="text-2xl font-bold">TOPIK tayyorgarlik</h3>
              <p className="text-slate-300 text-sm mt-1">TOPIK I & II uchun to‘liq dastur — Reading, Listening, Vocabulary, Grammar va mock testlar. Natijangiz shaxsiy kabinetingizda saqlanadi.</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> Reading, Listening, Vocabulary, Grammar bo‘limlari</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-400"/> Taymer va savollar ko‘rinishi</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-violet-400"/> Har javobdan keyin tushuntirish</li>
              </ul>
              <Link href="/topik"><Button className="mt-4 bg-white text-[#0f1b3d] hover:bg-slate-100">Testni boshlash</Button></Link>
            </div>
            <div className="rounded-2xl bg-white text-slate-900 p-4">
              <div className="text-sm font-semibold">TOPIK mock test</div>
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">다음 그림을 보십시오.
                <div className="mt-2 h-20 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 grid place-items-center text-slate-400">🖼️ Rasm savoli</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {["A 학생입니다.","B 요리사입니다.","C 선생님입니다.","D 회사원입니다."].map(o => <div key={o} className="rounded-xl border border-slate-200 px-3 py-2 hover:border-[#2563eb] hover:bg-[#eff6ff] cursor-pointer">{o}</div>)}
              </div>
            </div>
          </div>
        </Card>
      </section>
      </Reveal>

      {/* STATS — real from DB */}
      {stats?.db && (
      <Reveal>
        <section className="mx-auto max-w-[1200px] px-4 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              [String(stats.students), "o‘quvchi"],
              [String(stats.courses), "kurs"],
              [String(stats.lessons), "dars"],
              [String(stats.tests), "TOPIK test"],
            ].map(([val, label]) => (
              <Card key={label} className="p-5 text-center">
                <div className="text-2xl font-extrabold text-[#0f1b3d]">{val}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>
      )}

      {/* UNIVERSITIES */}
      <Reveal>
      <section className="mx-auto max-w-[1200px] px-4 py-6">
        <div className="flex items-end justify-between"><h2 className="text-2xl font-bold text-[#0f1b3d]">Universitetlar</h2><Link href="/universities" className="text-sm font-medium text-[#2563eb]">Barchasi →</Link></div>
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.slice(0,6).map(u => (
            <Link key={u.id} href="/universities">
              <Card className="p-4 flex gap-3 hover:border-blue-200 hover:shadow-md transition-all h-full">
                <div className="h-12 w-12 rounded-xl bg-[#eff6ff] grid place-items-center shrink-0"><Building2 className="h-6 w-6 text-[#2563eb]" /></div>
                <div className="min-w-0"><div className="font-semibold text-slate-900 leading-tight truncate">{u.name}</div><div className="text-xs text-slate-500">{u.city} · {u.topik}</div><div className="text-xs text-slate-500 truncate">{u.programs.join(" · ")}</div></div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      </Reveal>

      {/* FAQ */}
      <Reveal>
      <section className="mx-auto max-w-[1200px] px-4 py-8">
        <h2 className="text-2xl font-bold text-[#0f1b3d]">Ko‘p so‘raladigan savollar</h2>
        <div className="mt-6 space-y-3 max-w-3xl">
          {[
            ["Kurs qancha davom etadi?", "Har bir daraja o‘z ritmida. Darslar ketma-ket ochiladi — oldingi darsni yakunlagach keyingisi ochiladi."],
            ["TOPIK sertifikatini olsam bo‘ladimi?", "Ha, biz TOPIK I va II uchun to‘liq tayyorgarlik va mock testlar beramiz."],
            ["Kurslar bepulmi?", "Ha — barcha kurslar bepul. Kontentni administrator qo‘shadi, darslar bosqichma-bosqich ochiladi."],
            ["Darslar offline ham bormi?", "Ha, Namangandagi markazimizda offline guruhlar ham mavjud."],
          ].map(([q,a], idx) => (
            <Card key={q} className="overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex items-center justify-between p-4 text-left">
                <span className="font-medium text-slate-900 text-sm">{q}</span>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
              </button>
              {openFaq === idx && <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed">{a}</div>}
            </Card>
          ))}
        </div>
      </section>
      </Reveal>

      {/* CTA */}
      <Reveal>
      <section className="mx-auto max-w-[1200px] px-4 pb-10">
        <Card className="p-8 bg-[#2563eb] text-white border-0 text-center">
          <h3 className="text-2xl font-bold">Orzuingizdagi Koreyaga bir qadam yaqin</h3>
          <p className="text-blue-100 text-sm mt-2">Hoziroq ro‘yxatdan o‘ting va birinchi darsni bepul sinab ko‘ring.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/register"><Button variant="outline" className="bg-white text-[#2563eb] border-white hover:bg-slate-100">Ro‘yxatdan o‘tish</Button></Link>
            <Link href="/admission"><Button variant="ghost" className="text-white hover:bg-white/10 border border-white/20">Qabulga ariza</Button></Link>
          </div>
        </Card>
      </section>
      </Reveal>
    </div>
  );
}
