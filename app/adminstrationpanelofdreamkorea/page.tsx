"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, GraduationCap, Layers, BookOpenCheck, ArrowUpRight, Loader2, AlertTriangle, ClipboardCheck, BookOpen, Headphones, PenLine, ListChecks, Library, Award, BarChart3, type LucideIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { adminBase } from "@/lib/admin-base";

type LearningStudent = {
  id: string; name: string; email: string; xp: number; stars: number; streak: number;
  topikLevel: string | null; lastActive: string;
  unitsDone: number; percent: number; started: boolean;
  examBest: { score: number; total: number } | null; examAttempts: number;
  topikN: number; topikAvg: number; writingN: number; homeworkN: number;
};
type Learning = {
  unitsTotal: number;
  dars: { started: number; unitsCompleted: number; avgPercent: number; exams: { bests: number; attempts: number } };
  topik: { attempts: number; avg: number; bySection: { type: string; n: number; avg: number }[]; levels: { level: string; n: number }[] };
  yozish: { topik: { n: number; avg: number }; dars: { n: number; avg: number } };
  books: { count: number; byCategory: { category: string; n: number }[] };
  homework: { done: number };
  courses: { completedLessons: number; enrollments: number };
  students: LearningStudent[];
};

type Stats = {
  db: boolean;
  students: number; teachers: number; courses: number; lessons: number; tests: number; attempts: number;
  users?: { id: string; name: string; email: string; role: string; createdAt: string }[];
  admissions?: { id: string; name: string; phone: string; createdAt: string }[];
  recentCourses?: { id: string; title: string; createdAt: string; _count: { lessons: number } }[];
  byMonth?: { name: string; users: number }[];
  learning?: Learning;
};

const fmtDate = (s: string) => new Date(s).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", year: "numeric" });

export default function AdminPage() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  const pathname = usePathname();
  const base = adminBase(pathname);

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
    { label: "O‘quvchilar", value: s.students, icon: Users, href: `${base}/users` },
    { label: "Ustozlar", value: s.teachers, icon: GraduationCap, href: `${base}/users` },
    { label: "Kurslar", value: s.courses, icon: Layers, href: `${base}/content` },
    { label: "Darslar", value: s.lessons, icon: BookOpenCheck, href: `${base}/content` },
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
            <Card className="p-5 hover:border-blue-200 hover:shadow-md transition">
              <div className="flex items-center justify-between text-slate-500"><span className="text-xs">{c.label}</span><c.icon className="h-4 w-4"/></div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{c.value}</div>
            </Card>
          </Link>
        ))}
      </div>

      {s.learning && (() => {
        const L = s.learning;
        const reading = L.topik.bySection.find(x => x.type === "Reading");
        const listening = L.topik.bySection.find(x => x.type === "Listening");
        const levelSum = L.topik.levels.filter(l => l.level !== "Belgilanmagan").reduce<number>((a, b) => a + b.n, 0);
        const tiles: { label: string; value: string | number; sub: string; icon: LucideIcon; href: string }[] = [
          { label: "Darslar", value: `${L.dars.started}/${s.students}`, sub: `boshlagan · o‘rtacha ${L.dars.avgPercent}%`, icon: GraduationCap, href: `${base}/dars` },
          { label: "Imtihonlar", value: L.dars.exams.attempts, sub: `urinish · ${L.dars.exams.bests} ta rekord`, icon: ClipboardCheck, href: `${base}/dars` },
          { label: "O‘qish · Reading", value: reading?.n ?? 0, sub: reading ? `urinish · o‘rtacha ${reading.avg}%` : "urinish hali yo‘q", icon: BookOpen, href: "/topik" },
          { label: "Tinglash · Listening", value: listening?.n ?? 0, sub: listening ? `urinish · o‘rtacha ${listening.avg}%` : "urinish hali yo‘q", icon: Headphones, href: "/topik" },
          { label: "Yozish", value: L.yozish.topik.n + L.yozish.dars.n, sub: L.yozish.topik.n + L.yozish.dars.n ? `TOPIK ${L.yozish.topik.n} (${L.yozish.topik.avg}) · Dars ${L.yozish.dars.n} (${L.yozish.dars.avg})` : "topshirish hali yo‘q", icon: PenLine, href: "/topik/writing" },
          { label: "Uy vazifalari", value: L.homework.done, sub: `topshirilgan · ${L.courses.completedLessons} dars yakunlandi`, icon: ListChecks, href: "/homework" },
          { label: "Kitoblar", value: L.books.count, sub: L.books.count ? L.books.byCategory.map(c => `${c.category}: ${c.n}`).join(" · ") : "kitoblar hali qo‘shilmagan", icon: Library, href: `${base}/books` },
          { label: "Darajalar", value: levelSum, sub: L.topik.levels.map(l => `${l.level}: ${l.n}`).join(" · ") || "ma’lumot yo‘q", icon: Award, href: `${base}/users` },
        ];
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#2563eb]" />
              <h2 className="font-semibold text-slate-900">O‘quv statistikasi</h2>
              <span className="text-xs text-slate-500">darslar, imtihonlar, TOPIK, yozish, kitoblar</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {tiles.map(t => (
                <Link key={t.label} href={t.href}>
                  <Card className="p-4 h-full hover:border-blue-200 hover:shadow-md transition">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs">{t.label}</span>
                      <t.icon className="h-4 w-4 shrink-0" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 mt-1">{t.value}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{t.sub}</div>
                  </Card>
                </Link>
              ))}
            </div>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-slate-900">O‘quvchilar statistikasi</div>
                <span className="text-xs text-slate-500 shrink-0">{L.students.length} ta · {L.unitsTotal} unit bo‘yicha</span>
              </div>
              {L.students.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">Hozircha o‘quvchi yo‘q.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[860px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                        <th className="py-2 pr-3 font-medium">O‘quvchi</th>
                        <th className="py-2 pr-3 font-medium">Darslar</th>
                        <th className="py-2 pr-3 font-medium">Imtihon</th>
                        <th className="py-2 pr-3 font-medium">TOPIK</th>
                        <th className="py-2 pr-3 font-medium">Yozish</th>
                        <th className="py-2 pr-3 font-medium">Vazifa</th>
                        <th className="py-2 pr-3 font-medium">XP</th>
                        <th className="py-2 pr-3 font-medium">Yulduz</th>
                      </tr>
                    </thead>
                    <tbody>
                      {L.students.map(st => (
                        <tr key={st.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-2.5 pr-3">
                            <div className="max-w-[190px] truncate font-medium text-slate-800">{st.name}</div>
                            <div className="max-w-[190px] truncate text-xs text-slate-400">{st.email}{st.topikLevel ? ` · ${st.topikLevel}` : ""}</div>
                          </td>
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-blue-600" style={{ width: `${st.percent}%` }} />
                              </div>
                              <span className="shrink-0 text-xs text-slate-600">{st.unitsDone}/{L.unitsTotal} · {st.percent}%</span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-3 text-xs text-slate-600">
                            {st.examBest ? `${st.examBest.score}/${st.examBest.total}` : "—"}{st.examAttempts > 1 ? ` · ${st.examAttempts}×` : ""}
                          </td>
                          <td className="py-2.5 pr-3 text-xs text-slate-600">{st.topikN ? `${st.topikN} urinish · ${st.topikAvg}%` : "—"}</td>
                          <td className="py-2.5 pr-3 text-xs text-slate-600">{st.writingN || "—"}</td>
                          <td className="py-2.5 pr-3 text-xs text-slate-600">{st.homeworkN || "—"}</td>
                          <td className="py-2.5 pr-3 text-xs font-medium text-slate-800">{st.xp}</td>
                          <td className="py-2.5 pr-3 text-xs font-medium text-amber-600">{st.stars}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        );
      })()}

      <div className="grid lg:grid-cols-3 gap-4">
        {[
          ["O‘quvchilar", "Ro‘yxat va rollar", `${base}/users`],
          ["Qabul arizalari", "Arizalar ro‘yxati", `${base}/admissions`],
          ["Kontent", "Kurslar va darslar", `${base}/content`],
          ["TOPIK testlar", "Testlar", "/topik"],
          ["Kitoblar", "PDF qo'shish va boshqarish", `${base}/books`],
          ["Universitetlar", "Ro‘yxat", "/universities"],
        ].map(([title, sub, href]) => (
          <Link key={title} href={href}><Card className="p-4 hover:shadow-md hover:border-blue-200 transition flex items-center justify-between"><div><div className="font-medium text-sm text-slate-900">{title}</div><div className="text-xs text-slate-500">{sub}</div></div><span className="text-[#2563eb] text-xs font-medium">Ochish →</span></Card></Link>
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
            <Link href={`${base}/admissions`} className="text-xs text-[#2563eb] font-medium">Barchasi →</Link>
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
            <Link href={`${base}/content`} className="text-xs text-[#2563eb] font-medium">Boshqarish →</Link>
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
