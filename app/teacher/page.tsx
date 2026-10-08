"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Users, BookOpen, FileText, GraduationCap, Loader2, AlertTriangle } from "lucide-react";

type Stats = { db: boolean; students: number; courses: number; lessons: number; tests: number };
type U = { id: string; name: string; email: string; role: string; _count: { lessonProgress: number; testAttempts: number } };

export default function TeacherPage() {
  const [s, setS] = useState<Stats | null>(null);
  const [users, setUsers] = useState<U[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("dk_token") || "";
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("/api/stats", { headers: h }).then(r => r.json()),
      fetch("/api/users", { headers: h }).then(r => r.json()).catch(() => ({ users: [] })),
    ])
      .then(([st, us]) => {
        if (!st.db) setErr("Baza bilan bog‘lanib bo‘lmadi");
        setS(st);
        setUsers(Array.isArray(us.users) ? us.users.filter((u: U) => u.role === "STUDENT") : []);
      })
      .catch(() => setErr("Ma’lumot yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mx-auto max-w-[1100px] p-4 lg:p-6 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</div>;
  if (err) return <div className="mx-auto max-w-[1100px] p-4 lg:p-6"><Card className="p-6 flex items-center gap-2 text-amber-700 bg-amber-50 border-amber-200 text-sm"><AlertTriangle className="h-5 w-5" /> {err}</Card></div>;

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Ustoz paneli</h1>
        <p className="text-sm text-slate-500">Haqiqiy ma’lumotlar (MongoDB)</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          ["O‘quvchilar", String(s?.students ?? 0), Users],
          ["Kurslar", String(s?.courses ?? 0), BookOpen],
          ["Darslar", String(s?.lessons ?? 0), FileText],
          ["TOPIK testlar", String(s?.tests ?? 0), GraduationCap],
        ] as [string, string, React.ComponentType<{className?: string}>][]).map(([label, val, Icon]) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between"><span className="text-xs text-slate-500">{label}</span><Icon className="h-4 w-4 text-slate-400"/></div>
            <div className="text-xl font-bold text-slate-900 mt-1">{val}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="font-semibold text-slate-900">O‘quvchilar ({users.length})</div>
          {users.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Hozircha o‘quvchi yo‘q</p>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              {users.slice(0, 8).map(u => {
                const prog = Math.min(100, u._count.lessonProgress * 5);
                return (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#eff6ff] grid place-items-center text-xs font-bold text-[#2563eb]">{u.name[0]?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 leading-none truncate">{u.name}</div>
                      <div className="text-xs text-slate-500">{u._count.lessonProgress} dars · {u._count.testAttempts} test</div>
                    </div>
                    <div className="w-24"><Progress value={prog} /></div>
                  </div>
                );
              })}
            </div>
          )}
          <Link href="/courses" className="mt-4 block text-center text-sm text-[#2563eb] font-medium">Barcha kurslarni ko‘rish →</Link>
        </Card>

        <Card className="p-5">
          <div className="font-semibold text-slate-900">Tez amallar</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/courses"><Card className="p-3 text-center text-sm hover:border-blue-200 transition-colors">Kurslar</Card></Link>
            <Link href="/topik"><Card className="p-3 text-center text-sm hover:border-blue-200 transition-colors">TOPIK testlar</Card></Link>
            <Link href="/vocabulary"><Card className="p-3 text-center text-sm hover:border-blue-200 transition-colors">Lug‘at</Card></Link>
            <Link href="/grammar"><Card className="p-3 text-center text-sm hover:border-blue-200 transition-colors">Grammatika</Card></Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">Kontentni qo‘shish — administrator panelida (/admin/content).</p>
        </Card>
      </div>
    </div>
  );
}
