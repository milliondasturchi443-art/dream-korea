"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Users, GraduationCap, Layers, BookOpenCheck, ArrowUpRight, Loader2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Stats = {
  db: boolean;
  students: number; teachers: number; courses: number; lessons: number; tests: number; attempts: number;
  users?: { id: string; name: string; email: string; role: string; createdAt: string }[];
  admissions?: { id: string; name: string; phone: string; createdAt: string }[];
  recentCourses?: { id: string; title: string; createdAt: string; _count: { lessons: number } }[];
  byMonth?: { name: string; users: number }[];
};

const fmtDate = (s: string) => new Date(s).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", year: "numeric" });

export default function AdminPage() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const token = (()=>{ try{ return sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; }catch{ return localStorage.getItem("dk_token") || ""; } })();
    fetch("/api/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setS(d))
      .catch(() => setErr("Statistika yuklanmadi"));
  }, []);

  if (err || (s && !s.db)) {
    return (
      <div className="mx-auto max-w-[1200px] p-4 lg:p-6">
        <Card className="p-6 flex items-center gap-3 text-amber-700 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{err || "Ma’lumotlar bazasi bilan bog‘lanib bo‘lmadi — server tomonida ko‘ring."}</span>
        </Card>
      </div>
    );
  }
  if (!s) {
    return <div className="mx-auto max-w-[1200px] p-4 lg:p-6 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</div>;
  }

  const cards = [
    { label: "O‘quvchilar", value: s.students, icon: Users, href: "/adminstrationpanelofdreamkorea/users" },
    { label: "Ustozlar", value: s.teachers, icon: GraduationCap, href: "/adminstrationpanelofdreamkorea/users" },
    { label: "Kurslar", value: s.courses, icon: Layers, href: "/adminstrationpanelofdreamkorea/content" },
    { label: "Darslar", value: s.lessons, icon: BookOpenCheck, href: "/adminstrationpanelofdreamkorea/content" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-slate-900">Admin Dashboard</h1>
        <span className="text-xs text-slate-500">Haqiqiy ma’lumotlar (MongoDB)</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Link key={c.label} href={c.href}>
            <Card className="p-5 hover:border-blue-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-slate-500"><span className="text-xs">{c.label}</span><c.icon className="h-4 w-4"/></div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{c.value}</div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {[
          ["O‘quvchilar", "Ro‘yxat va rollar", "/adminstrationpanelofdreamkorea/users"],
          ["Qabul arizalari", "Arizalar ro‘yxati", "/adminstrationpanelofdreamkorea/admissions"],
          ["Kontent", "Kurslar va darslar", "/adminstrationpanelofdreamkorea/content"],
          ["Bloklangan ilovalar", "Ruxsatlar", "/adminstrationpanelofdreamkorea/blocked-apps"],
          ["TOPIK testlar", "Testlar", "/topik"],
          ["Universitetlar", "Ro‘yxat", "/universities"],
        ].map(([title, sub, href]) => (
          <Link key={title} href={href}><Card className="p-4 hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between"><div><div className="font-medium text-sm text-slate-900">{title}</div><div className="text-xs text-slate-500">{sub}</div></div><span className="text-[#2563eb] text-xs font-medium">Ochish →</span></Card></Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="font-semibold text-slate-900">Ro‘yxatdan o‘tganlar (oylik, haqiqiy)</div>
          <div className="h-[240px] mt-3">
            {(s.byMonth ?? []).some(m => m.users > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.byMonth}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="users" name="Yangi foydalanuvchi" fill="#2563eb" radius={[8,8,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-sm text-slate-400">Hozircha ma’lumot yo‘q</div>
            )}
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-semibold text-slate-900">So‘nggi qo‘shilgan foydalanuvchilar</div>
          <ul className="mt-3 space-y-2 text-sm">
            {(s.users ?? []).length === 0 && <li className="text-sm text-slate-400">Hozircha foydalanuvchi yo‘q</li>}
            {(s.users ?? []).map(u => (
              <li key={u.id} className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-slate-800">{u.name}</span>
                <span className="text-xs text-slate-500 shrink-0">{u.role} · {fmtDate(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="font-semibold text-slate-900 flex items-center justify-between">
            <span>So‘nggi qabul arizalari</span>
            <Link href="/adminstrationpanelofdreamkorea/admissions" className="text-xs text-[#2563eb] font-medium">Barchasi →</Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {(s.admissions ?? []).length === 0 && <li className="text-sm text-slate-400">Arizalar yo‘q</li>}
            {(s.admissions ?? []).map(a => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-slate-800">{a.name}</span>
                <span className="text-xs text-slate-500 shrink-0">{a.phone} · {fmtDate(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="font-semibold text-slate-900 flex items-center justify-between">
            <span>Yangi kurslar</span>
            <Link href="/adminstrationpanelofdreamkorea/content" className="text-xs text-[#2563eb] font-medium">Boshqarish →</Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {(s.recentCourses ?? []).length === 0 && <li className="text-sm text-slate-400">Kurs yo‘q</li>}
            {(s.recentCourses ?? []).map(c => (
              <li key={c.id} className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-slate-800">{c.title}</span>
                <span className="text-xs text-slate-500 shrink-0">{c._count.lessons} dars · {fmtDate(c.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4"><div className="text-xs text-slate-500">TOPIK testlar</div><div className="text-xl font-bold mt-1">{s.tests}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">Test yozuvlari</div><div className="text-xl font-bold mt-1">{s.attempts}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">Barcha kurslar</div><div className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><ArrowUpRight className="h-3 w-3"/> bepul</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">Admin</div><div className="text-xs text-slate-700 mt-1 font-medium">dreamkorea@adminstator.kr</div></Card>
      </div>
    </div>
  );
}
