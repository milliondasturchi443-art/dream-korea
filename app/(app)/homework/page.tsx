"use client";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Users, GraduationCap, CalendarDays, BarChart3 } from "lucide-react";

type Member = { user: { id: string; name: string; email: string } };
type Group = { id: string; name: string; teacher?: { id: string; name: string } | null; members?: Member[] };
type HW = { id: string; title: string; description?: string | null; dueDate?: string | null; createdAt: string; group?: { id: string; name: string }; teacher?: { id: string; name: string } };
type TStats = { groups: number; students: number; homework: number; attendance: number; groupNames: string[] };

function authHeader(): Record<string, string> {
  try { const t = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; return t ? { Authorization: `Bearer ${t}` } : {}; } catch { return {}; }
}

export default function StudentHomeworkPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [hw, setHw] = useState<HW[]>([]);
  const [stats, setStats] = useState<Record<string, TStats>>({});
  const [loading, setLoading] = useState(true);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    const h = authHeader();
    (async () => {
      try {
        const [g, w] = await Promise.all([
          fetch("/api/groups", { headers: h }).then(r => r.json()).catch(() => ({})),
          fetch("/api/homework", { headers: h }).then(r => r.json()).catch(() => ({})),
        ]);
        const gl: Group[] = Array.isArray(g.groups) ? g.groups : [];
        setGroups(gl);
        setHw(Array.isArray(w.items) ? w.items : []);
        // Ustozlar statistikasi
        const tids = [...new Set(gl.map(x => x.teacher?.id).filter(Boolean))] as string[];
        const st: Record<string, TStats> = {};
        await Promise.all(tids.map(async (tid) => {
          try {
            const d = await fetch(`/api/teacher-stats?userId=${encodeURIComponent(tid)}`, { headers: h }).then(r => r.json());
            if (d && !d.error) st[tid] = d as TStats;
          } catch {}
        }));
        setStats(st);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const hwByGroup = useMemo(() => {
    const m: Record<string, HW[]> = {};
    for (const x of hw) { const gid = x.group?.id ?? ""; (m[gid] ||= []).push(x); }
    return m;
  }, [hw]);

  return (
    <div className="mx-auto max-w-[1000px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2"><BookOpen className="h-6 w-6 text-violet-600"/> Uy vazifalari</h1>
        <p className="text-sm text-slate-500">Guruhingiz, ustozingiz va uy vazifalari</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 p-4"><Loader2 className="h-4 w-4 animate-spin"/> Yuklanmoqda…</div>
      ) : groups.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">Hozircha guruhga qo‘shilmagansiz</Card>
      ) : (
        <>
          {/* Guruhlar + ustoz */}
          <div className="grid md:grid-cols-2 gap-4">
            {groups.map(g => {
              const ts = g.teacher?.id ? stats[g.teacher.id] : undefined;
              const isOpen = openGroup === g.id;
              return (
                <Card key={g.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 flex items-center gap-2"><Users className="h-4 w-4 text-blue-600"/>{g.name}</div>
                      {g.teacher && (
                        <div className="mt-1 text-xs text-slate-500 flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5"/> Ustoz: <span className="font-medium text-slate-700">{g.teacher.name}</span></div>
                      )}
                    </div>
                    <button onClick={() => setOpenGroup(isOpen ? null : g.id)} className="text-xs text-[#2563eb] font-medium shrink-0">{isOpen ? "Yopish" : "A’zolar"}</button>
                  </div>
                  {/* Ustoz statistikasi */}
                  {ts && (
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-lg bg-[#eff6ff] p-2"><div className="text-[10px] text-slate-500">Guruh</div><div className="text-sm font-bold">{ts.groups}</div></div>
                      <div className="rounded-lg bg-emerald-50 p-2"><div className="text-[10px] text-slate-500">O‘quvchi</div><div className="text-sm font-bold">{ts.students}</div></div>
                      <div className="rounded-lg bg-violet-50 p-2"><div className="text-[10px] text-slate-500">Vazifa</div><div className="text-sm font-bold">{ts.homework}</div></div>
                      <div className="rounded-lg bg-amber-50 p-2"><div className="text-[10px] text-slate-500">Davomat</div><div className="text-sm font-bold">{ts.attendance}</div></div>
                    </div>
                  )}
                  {/* Guruh a'zolari (kim bilan) */}
                  {isOpen && (
                    <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
                      <div className="text-xs font-semibold text-slate-500 flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5"/> Guruh a’zolari ({g.members?.length ?? 0})</div>
                      {(g.members ?? []).map(m => (
                        <div key={m.user.id} className="text-xs text-slate-600 flex items-center justify-between py-1">
                          <span>{m.user.name}</span>
                          {m.user.email && <span className="text-slate-400">{m.user.email}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Uy vazifalari ro'yxati */}
          <div>
            <h2 className="font-semibold text-slate-900">So‘nggi uy vazifalari</h2>
            {hw.length === 0 ? (
              <Card className="mt-3 p-6 text-center text-sm text-slate-500">Hali uy vazifasi yo‘q</Card>
            ) : (
              <div className="mt-3 space-y-2">
                {hw.map(x => (
                  <Card key={x.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{x.title}</div>
                        {x.description && <div className="text-xs text-slate-600 mt-1">{x.description}</div>}
                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2">
                          {x.group && <span className="flex items-center gap-1"><Users className="h-3 w-3"/> {x.group.name}</span>}
                          {x.teacher && <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3"/> {x.teacher.name}</span>}
                          <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3"/> {new Date(x.createdAt).toLocaleDateString("uz-UZ")}</span>
                        </div>
                      </div>
                      {x.dueDate && <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] shrink-0">Topshirish: {x.dueDate}</Badge>}
                    </div>
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
