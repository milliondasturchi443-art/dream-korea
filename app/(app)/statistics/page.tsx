"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart3, Users, GraduationCap, BookOpen, Layers, FileText, CalendarCheck } from "lucide-react";

type Site = { students: number; teachers: number; groups: number; courses: number; lessons: number; tests: number };
type Participant = { id: string; name: string; email: string; attendance: number };
type G = { id: string; name: string; teacher?: { id: string; name: string } | null; homeworkCount: number; participants: Participant[] };

function authHeader(): Record<string, string> {
  try { const t = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; return t ? { Authorization: `Bearer ${t}` } : {}; } catch { return {}; }
}

export default function StatisticsPage() {
  const [site, setSite] = useState<Site | null>(null);
  const [groups, setGroups] = useState<G[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/overview", { headers: authHeader() })
      .then(r => r.json())
      .then(d => { if (d.site) setSite(d.site); if (Array.isArray(d.groups)) setGroups(d.groups); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalParticipants = groups.reduce((s, g) => s + g.participants.length, 0);

  const siteCards = site ? [
    { label: "O‘quvchilar", value: site.students, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Ustozlar", value: site.teachers, icon: GraduationCap, color: "bg-emerald-50 text-emerald-600" },
    { label: "Guruhlar", value: site.groups, icon: Layers, color: "bg-violet-50 text-violet-600" },
    { label: "Kurslar", value: site.courses, icon: BookOpen, color: "bg-amber-50 text-amber-600" },
    { label: "Darslar", value: site.lessons, icon: FileText, color: "bg-rose-50 text-rose-600" },
    { label: "Testlar", value: site.tests, icon: BarChart3, color: "bg-indigo-50 text-indigo-600" },
  ] : [];

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2"><BarChart3 className="h-6 w-6 text-blue-600"/> Statistika</h1>
        <p className="text-sm text-slate-500">Sayt va guruh ishtirokchilari statistikasi</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 p-4"><Loader2 className="h-4 w-4 animate-spin"/> Yuklanmoqda…</div>
      ) : (
        <>
          {/* Sayt statistikasi */}
          <div>
            <h2 className="font-semibold text-slate-900">Sayt statistikasi</h2>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {siteCards.map(c => (
                <Card key={c.label} className="p-4 text-center">
                  <div className={`h-10 w-10 mx-auto rounded-xl ${c.color} grid place-items-center`}><c.icon className="h-5 w-5"/></div>
                  <div className="mt-2 text-xl font-bold text-slate-900">{c.value}</div>
                  <div className="text-xs text-slate-500">{c.label}</div>
                </Card>
              ))}
            </div>
          </div>

          {/* Guruh ishtirokchilari */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Guruh ishtirokchilari</h2>
              <Badge className="bg-slate-100 text-slate-700 border text-[11px]">{groups.length} guruh · {totalParticipants} a’zo</Badge>
            </div>
            {groups.length === 0 ? (
              <Card className="mt-3 p-8 text-center text-sm text-slate-500">Guruh yo‘q</Card>
            ) : (
              <div className="mt-3 space-y-4">
                {groups.map(g => (
                  <Card key={g.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold text-slate-900 flex items-center gap-2"><Users className="h-4 w-4 text-blue-600"/>{g.name}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {g.teacher && <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5"/> {g.teacher.name}</span>}
                        <Badge className="bg-violet-50 text-violet-700 border border-violet-200 text-[11px]">{g.homeworkCount} vazifa</Badge>
                      </div>
                    </div>
                    {g.participants.length === 0 ? (
                      <div className="mt-3 text-xs text-slate-400">A’zolar yo‘q</div>
                    ) : (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-slate-400 border-b border-slate-100">
                              <th className="py-2 pr-3 font-medium">#</th>
                              <th className="py-2 pr-3 font-medium">Ishtirokchi</th>
                              <th className="py-2 pr-3 font-medium">Email</th>
                              <th className="py-2 font-medium text-right">Davomat</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.participants.map((p, i) => (
                              <tr key={p.id} className="border-b border-slate-50 last:border-0">
                                <td className="py-2 pr-3 text-slate-400">{i + 1}</td>
                                <td className="py-2 pr-3 font-medium text-slate-800">{p.name}</td>
                                <td className="py-2 pr-3 text-slate-500">{p.email}</td>
                                <td className="py-2 text-right"><span className="inline-flex items-center gap-1 font-semibold text-slate-700"><CalendarCheck className="h-3.5 w-3.5 text-emerald-500"/>{p.attendance}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
