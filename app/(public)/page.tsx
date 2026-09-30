"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { courses, universities, demoAccounts } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { GraduationCap, Cpu, Users, Trophy, Star, Play, CheckCircle2, BookOpen, Building2, ChevronDown } from "lucide-react";
import { useState } from "react";

const features = [
  { icon: GraduationCap, title: "Sifatli ta'lim", desc: "Tajribali ustozlar va tasdiqlangan metodika asosida darslar." },
  { icon: Cpu, title: "Zamonaviy texnologiya", desc: "Interaktiv platforma, video darslar va AI yordamchi." },
  { icon: Users, title: "Professional ustozlar", desc: "Koreyada tahsil olgan va TOPIK sertifikatiga ega o‘qituvchilar." },
  { icon: Trophy, title: "Sizning natijangiz", desc: "95% o‘quvchilar kursni muvaffaqiyatli yakunlaydi." },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  return (
    <div className="bg-[#f8fafc]">
      {/* HERO */}
      <section className="mx-auto max-w-[1200px] px-4 py-10 lg:py-14 grid lg:grid-cols-2 gap-8 items-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Badge className="bg-[#eff6ff] text-[#2563eb] border border-blue-100 mb-4">🇰🇷 #1 Koreys tili platformasi O‘zbekistonda</Badge>
          <h1 className="text-[32px] lg:text-[44px] font-extrabold leading-[1.05] tracking-tight text-[#0f1b3d]">
            Koreys tilini o‘rganing,<br />
            <span className="text-[#2563eb]">orzuingizga yaqinlashing!</span>
          </h1>
          <p className="mt-4 text-slate-600 text-[15px] leading-relaxed max-w-[520px]">Zamonaviy platforma orqali koreys tilini noldan boshlab professional darajagacha o‘rganing. TOPIK, EPS-TOPIK va universitetlarga tayyorgarlik.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register"><Button size="lg">Boshlash — bepul</Button></Link>
            <Link href="/courses"><Button variant="outline" size="lg">Kurslarni ko‘rish</Button></Link>
          </div>
          <div className="mt-6 flex items-center gap-4 text-sm">
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-indigo-600 grid place-items-center text-white text-xs font-bold">{String.fromCharCode(64+i)}</div>)}
            </div>
            <div><div className="font-semibold text-slate-900">1 200+ o‘quvchi</div><div className="text-slate-500 text-xs flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400"/> 4.9 (320 sharh)</div></div>
          </div>
          {/* demo accounts hint */}
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed">
            <div className="font-semibold text-amber-900 mb-1">Demo akkauntlar (development):</div>
            {demoAccounts.map(a => <div key={a.email} className="font-mono text-amber-800">{a.role}: {a.email} / {a.password}</div>)}
          </div>
        </motion.div>

        {/* Right mock dashboard */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="relative">
          <div className="rounded-[24px] bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="h-10 bg-[#0f1b3d] flex items-center px-4 gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs text-slate-300">dreamkorea.uz — Dashboard</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div><div className="font-bold text-slate-900">TOPIK I — Progress</div><div className="text-xs text-slate-500">24 / 35 dars</div></div>
                <div className="h-12 w-12 rounded-full border-4 border-blue-100 border-t-[#2563eb] grid place-items-center text-sm font-bold text-[#2563eb]">68%</div>
              </div>
              <Progress value={68} />
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-[#eff6ff] p-3"><div className="text-xs text-slate-500">Streak</div><div className="font-bold">🔥 12 kun</div></div>
                <div className="rounded-xl bg-emerald-50 p-3"><div className="text-xs text-slate-500">Lug‘at</div><div className="font-bold">1 240 so‘z</div></div>
                <div className="rounded-xl bg-violet-50 p-3"><div className="text-xs text-slate-500">Vazifa</div><div className="font-bold">3 / 5</div></div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#2563eb] grid place-items-center text-white"><Play className="h-5 w-5 ml-0.5" /></div>
                <div className="flex-1"><div className="text-sm font-semibold">4-dars: Salomlashish</div><div className="text-xs text-slate-500">16:00 — bugun</div></div>
                <Button size="sm">Davom etish</Button>
              </div>
              <div className="flex gap-2 text-[11px]">
                {["Du","Se","Ch","Pa","Ju","Sh","Ya"].map((d,i) => (
                  <div key={d} className={`flex-1 rounded-lg py-2 text-center font-semibold ${i<5 ? "bg-[#2563eb] text-white" : "bg-slate-100 text-slate-500"}`}>{d}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-2 hidden lg:block rounded-2xl bg-white border border-slate-200 shadow-lg p-3 w-[220px]">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500"/> Bugungi vazifa</div>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> 20 ta yangi so‘z</li>
              <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-500"/> 1 ta grammatika darsi</li>
              <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-violet-500"/> TOPIK reading</li>
            </ul>
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-[1200px] px-4 py-10">
        <h2 className="text-2xl font-bold text-[#0f1b3d]">Nega DREAM KOREA?</h2>
        <p className="text-slate-500 text-sm mt-1">Natijaga yo‘naltirilgan premium EdTech tajribasi</p>
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

      {/* POPULAR COURSES */}
      <section className="mx-auto max-w-[1200px] px-4 py-6">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-[#0f1b3d]">Mashhur kurslar</h2>
          <Link href="/courses" className="text-sm font-medium text-[#2563eb] hover:underline">Barchasi →</Link>
        </div>
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.slice(0,6).map(c => (
            <Card key={c.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className={`h-28 bg-gradient-to-br ${c.color} relative p-4`}>
                <Badge className="bg-white text-slate-800 text-[11px]">{c.level}</Badge>
                <div className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-white/20 backdrop-blur grid place-items-center text-white"><BookOpen className="h-4 w-4" /></div>
              </div>
              <div className="p-4">
                <div className="font-semibold text-slate-900 leading-tight">{c.title}</div>
                <div className="text-xs text-slate-500">{c.subtitle} · {c.teacher}</div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{c.lessons} dars</span><span className="font-semibold text-[#2563eb]">{c.price}</span>
                </div>
                <Progress value={c.progress} className="mt-2" />
                <Link href={`/courses/${c.id}`}><Button className="w-full mt-3" size="sm">Batafsil</Button></Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* TOPIK */}
      <section className="mx-auto max-w-[1200px] px-4 py-8">
        <Card className="p-6 lg:p-8 bg-gradient-to-br from-[#0f1b3d] to-[#1e3a8a] text-white border-0 overflow-hidden relative">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="grid lg:grid-cols-2 gap-6 items-center relative">
            <div>
              <h3 className="text-2xl font-bold">TOPIK tayyorgarlik</h3>
              <p className="text-slate-300 text-sm mt-1">TOPIK I & II uchun to‘liq dastur — Reading, Listening, Vocabulary, Grammar va mock testlar.</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Reading", "82%", "bg-emerald-400"],
                  ["Listening", "74%", "bg-blue-400"],
                  ["Vocabulary", "80%", "bg-violet-400"],
                  ["Grammar", "76%", "bg-amber-400"],
                ].map(([label, val, color]) => (
                  <div key={label} className="rounded-xl bg-white/10 p-3">
                    <div className="text-xs text-slate-300">{label}</div>
                    <div className="font-bold">{val}</div>
                    <div className="mt-1 h-1.5 rounded-full bg-white/20"><div className={`h-full rounded-full ${color}`} style={{ width: val }} /></div>
                  </div>
                ))}
              </div>
              <Link href="/topik"><Button className="mt-4 bg-white text-[#0f1b3d] hover:bg-slate-100">Mock testni boshlash</Button></Link>
            </div>
            <div className="rounded-2xl bg-white text-slate-900 p-4">
              <div className="flex items-center justify-between text-sm font-semibold"><span>TOPIK I — 12 / 30</span><span className="text-[#2563eb]">00:28:34</span></div>
              <Progress value={40} className="mt-2" />
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">다음 그림을 보십시오.<div className="mt-2 h-20 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 grid place-items-center text-slate-400">🖼️ Rasm</div></div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {["A 학생입니다.","B 요리사입니다.","C 선생님입니다.","D 회사원입니다."].map(o => <div key={o} className="rounded-xl border border-slate-200 px-3 py-2 hover:border-[#2563eb] hover:bg-[#eff6ff] cursor-pointer">{o}</div>)}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-[1200px] px-4 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ["1 200+", "o‘quvchi"],
            ["24", "professional ustoz"],
            ["95%", "kursni yakunlash"],
            ["87%", "TOPIK natijasi"],
          ].map(([val, label]) => (
            <Card key={label} className="p-5 text-center">
              <div className="text-2xl font-extrabold text-[#0f1b3d]">{val}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-[1200px] px-4 py-6">
        <h2 className="text-2xl font-bold text-[#0f1b3d]">O‘quvchilarimiz fikri</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[
            { name: "Dilnoza A.", text: "3 oyda TOPIK I dan 178 ball oldim. Ustozlar juda tushunarli tushuntiradi!", topik: "TOPIK I — 178" },
            { name: "Jasur B.", text: "EPS-TOPIK dan o‘tdim, endi Koreyada ishlayapman. Rahmat DREAM KOREA!", topik: "EPS-TOPIK — Pass" },
            { name: "Madina K.", text: "Platforma juda qulay, streak va lug‘at bo‘limi motivatsiya beradi.", topik: "TOPIK II — 210" },
          ].map(t => (
            <Card key={t.name} className="p-5">
              <div className="flex items-center gap-1 text-amber-400"><Star className="h-4 w-4 fill-amber-400" /><Star className="h-4 w-4 fill-amber-400" /><Star className="h-4 w-4 fill-amber-400" /><Star className="h-4 w-4 fill-amber-400" /><Star className="h-4 w-4 fill-amber-400" /></div>
              <p className="mt-3 text-sm text-slate-700 leading-relaxed">“{t.text}”</p>
              <div className="mt-4 flex items-center justify-between"><span className="text-sm font-semibold">{t.name}</span><Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">{t.topik}</Badge></div>
            </Card>
          ))}
        </div>
      </section>

      {/* UNIVERSITIES */}
      <section className="mx-auto max-w-[1200px] px-4 py-6">
        <div className="flex items-end justify-between"><h2 className="text-2xl font-bold text-[#0f1b3d]">Universitetlar</h2><Link href="/universities" className="text-sm font-medium text-[#2563eb]">Barchasi →</Link></div>
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.slice(0,6).map(u => (
            <Card key={u.id} className="p-4 flex gap-3">
              <div className="h-12 w-12 rounded-xl bg-[#eff6ff] grid place-items-center shrink-0"><Building2 className="h-6 w-6 text-[#2563eb]" /></div>
              <div className="min-w-0"><div className="font-semibold text-slate-900 leading-tight truncate">{u.name}</div><div className="text-xs text-slate-500">{u.city} · {u.topik}</div><div className="text-xs text-slate-500 truncate">{u.programs.join(" · ")}</div></div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1200px] px-4 py-8">
        <h2 className="text-2xl font-bold text-[#0f1b3d]">Ko‘p so‘raladigan savollar</h2>
        <div className="mt-6 space-y-3 max-w-3xl">
          {[
            ["Kurs qancha davom etadi?", "Har bir daraja 3 oy (36 dars). Haftasiga 3 marta, har dars 90 daqiqa."],
            ["TOPIK sertifikatini olsam bo‘ladimi?", "Ha, biz TOPIK I va II uchun to‘liq tayyorgarlik va mock testlar beramiz."],
            ["To‘lov qanday amalga oshiriladi?", "Click, Payme, Uzum Bank va karta orqali to‘lashingiz mumkin."],
            ["Darslar offline ham bormi?", "Ha, Toshkentdagi markazimizda offline guruhlar ham mavjud."],
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

      {/* CTA */}
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
    </div>
  );
}
