"use client";
import { useEffect, useState } from "react";
import { darsRequest } from "@/lib/dars-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Loader2, Download, Printer, Users, CalendarCheck2, UserCheck, UserX, Percent } from "lucide-react";

type Report = {
  month: string;
  days: string[];
  students: {
    id: string; name: string; email: string;
    groupId: string; groupName: string; teacherName: string;
    present: number; absent: number; total: number; percent: number | null;
    days: (string | null)[]; // "PRESENT" | "ABSENT" | null (hali belgilanmagan)
  }[];
  groups: {
    id: string; name: string; teacherName: string; students: number;
    lessons: number; present: number; absent: number; percent: number | null;
  }[];
  totals: { students: number; groups: number; lessons: number; present: number; absent: number; percent: number | null };
};

function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(m: string) {
  const names = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
  const [y, mm] = m.split("-").map(Number);
  return `${names[(mm || 1) - 1]} ${y}`;
}
function dayNum(iso: string) { return Number(iso.split("-")[2] || 0); }
function dayName(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return ["Ya", "Du", "Se", "Chor", "Pay", "Jum", "Shan"][d.getDay()] || "";
}
function pctColor(p: number | null) {
  if (p === null) return "text-slate-400";
  if (p >= 80) return "text-emerald-600";
  if (p >= 50) return "text-amber-600";
  return "text-red-600";
}

export default function DavomatPage() {
  const [month, setMonth] = useState(thisMonth());
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string; teacher?: { name: string } | null }[]>([]);
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    darsRequest<{ groups: { id: string; name: string; teacher?: { name: string } | null }[] }>("/api/groups")
      .then(d => setGroups(d.groups)).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    const q = new URLSearchParams({ month });
    if (groupId) q.set("groupId", groupId);
    queueMicrotask(() => { setLoading(true); setError(""); });
    darsRequest<Report>(`/api/attendance/report?${q.toString()}`)
      .then(d => { if (alive) setData(d); })
      .catch(e => { if (alive) setError((e as Error).message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [month, groupId]);

  function exportCsv() {
    if (!data) return;
    const sep = ";";
    const lines: string[] = [];
    lines.push(["DREAM KOREA — Davomat hisoboti", monthLabel(data.month)].join(sep));
    lines.push("");
    lines.push(["Guruh", "O‘qituvchi", "O‘quvchilar", "Darslar", "Keldi", "Kelmadi", "Foiz"].join(sep));
    for (const g of data.groups) {
      lines.push([g.name, g.teacherName, g.students, g.lessons, g.present, g.absent, g.percent === null ? "—" : `${g.percent}%`].join(sep));
    }
    lines.push("");
    lines.push(["O‘quvchi", "Guruh", ...data.days.map(d => `${dayNum(d)}`), "Keldi", "Kelmadi", "Foiz"].join(sep));
    for (const s of data.students) {
      const marks = s.days.map(d => (d === "PRESENT" ? "B" : d === "ABSENT" ? "K" : "-"));
      lines.push([s.name, s.groupName, ...marks, s.present, s.absent, s.percent === null ? "—" : `${s.percent}%`].join(sep));
    }
    lines.push("");
    lines.push(["Jami", "", ...data.days.map(() => ""), data.totals.present, data.totals.absent, data.totals.percent === null ? "—" : `${data.totals.percent}%`].join(sep));
    // BOM — Excel o'zbek harflarini to'g'ri ochadi
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `davomat-${data.month}${groupId ? "-guruh" : ""}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const t = data?.totals;

  return (
    <div className="mx-auto max-w-[1200px] p-4 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[22px] font-bold text-slate-900">
            <ClipboardCheck className="h-6 w-6 text-[#2563eb]" /> Davomat (oylik hisobot)
          </h1>
          <p className="text-sm text-slate-500">Barcha guruh va o‘quvchilarning oylik davomati. Hisobotni yuklab oling yoki chop eting.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!data}>
            <Printer className="h-4 w-4 mr-1" /> Chop etish
          </Button>
          <Button size="sm" onClick={exportCsv} disabled={!data}>
            <Download className="h-4 w-4 mr-1" /> CSV yuklab olish
          </Button>
        </div>
      </div>

      {/* Filtr: oy + guruh */}
      <Card className="p-4 flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          Oy
          <input type="month" value={month} onChange={e => setMonth(e.target.value || thisMonth())}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          Guruh
          <select value={groupId} onChange={e => setGroupId(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
            <option value="">— Barcha guruhlar —</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}{g.teacher ? ` · ${g.teacher.name}` : ""}</option>)}
          </select>
        </label>
        {/* Tez oy tanlash */}
        <div className="flex flex-wrap gap-1.5">
          {(() => {
            const now = new Date();
            const opts: string[] = [];
            for (let i = 0; i < 6; i++) {
              const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
              opts.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
            }
            return opts.map(m => (
              <button key={m} onClick={() => setMonth(m)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${month === m ? "border-blue-500 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                {monthLabel(m).split(" ")[0].slice(0, 3)}
              </button>
            ));
          })()}
        </div>
      </Card>

      {error && <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</Card>}

      {loading && (
        <Card className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…
        </Card>
      )}

      {!loading && data && (
        <>
          {/* Umumiy ko'rsatkichlar */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400"><CalendarCheck2 className="h-4 w-4 text-blue-600" /> Darslar</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{t?.lessons ?? 0}</div>
              <div className="text-xs text-slate-500">{monthLabel(data.month)} — belgilangan kunlar</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400"><Users className="h-4 w-4 text-blue-600" /> O‘quvchilar</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{t?.students ?? 0}</div>
              <div className="text-xs text-slate-500">{t?.groups ?? 0} ta guruh</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400"><UserCheck className="h-4 w-4 text-emerald-600" /> Keldi</div>
              <div className="mt-1 text-2xl font-bold text-emerald-600">{t?.present ?? 0}</div>
              <div className="text-xs text-slate-500">mashg‘ulotlar</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400"><Percent className={`h-4 w-4 ${pctColor(t?.percent ?? null)}`} /> O‘rtacha</div>
              <div className={`mt-1 text-2xl font-bold ${pctColor(t?.percent ?? null)}`}>{t?.percent == null ? "—" : `${t.percent}%`}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1"><UserX className="h-3 w-3 text-red-500" /> kelmadi: {t?.absent ?? 0}</div>
            </Card>
          </div>

          {/* Guruhlar yig'indisi */}
          {data.groups.length > 0 && (
            <Card className="overflow-hidden">
              <div className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-slate-900">Guruhlar kesimida</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-2.5">Guruh</th>
                      <th className="px-4 py-2.5">O‘qituvchi</th>
                      <th className="px-4 py-2.5 text-center">O‘quvchi</th>
                      <th className="px-4 py-2.5 text-center">Darslar</th>
                      <th className="px-4 py-2.5 text-center">Keldi</th>
                      <th className="px-4 py-2.5 text-center">Kelmadi</th>
                      <th className="px-4 py-2.5 text-center">Foiz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.groups.map(g => (
                      <tr key={g.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-4 py-2.5 font-medium text-slate-900">{g.name}</td>
                        <td className="px-4 py-2.5 text-slate-600">{g.teacherName}</td>
                        <td className="px-4 py-2.5 text-center">{g.students}</td>
                        <td className="px-4 py-2.5 text-center">{g.lessons}</td>
                        <td className="px-4 py-2.5 text-center text-emerald-600 font-semibold">{g.present}</td>
                        <td className="px-4 py-2.5 text-center text-red-600 font-semibold">{g.absent}</td>
                        <td className={`px-4 py-2.5 text-center font-bold ${pctColor(g.percent)}`}>{g.percent === null ? "—" : `${g.percent}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Matritsa: o'quvchi × kun */}
          <Card className="overflow-hidden print:break-inside-avoid">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-bold text-slate-900">O‘quvchilar — kunlar kesimida <span className="font-normal text-slate-500">({monthLabel(data.month)})</span></div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-emerald-500" /> Keldi (B)</span>
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-500" /> Kelmadi (K)</span>
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-slate-100 border border-slate-200" /> — hali belgilanmagan</span>
              </div>
            </div>
            {data.students.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                Guruhlarda o‘quvchi yo‘q. Avval «O‘quvchi qo‘shish» bo‘limidan o‘quvchini guruhga qo‘shing.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="sticky left-0 bg-slate-50 px-4 py-2.5 text-left">O‘quvchi</th>
                      <th className="px-2 py-2.5 text-left">Guruh</th>
                      {data.days.map(d => (
                        <th key={d} className="px-1 py-2.5 text-center" title={`${dayName(d)} ${dayNum(d)}`}>
                          <div className="text-[10px] font-medium text-slate-400">{dayName(d)}</div>
                          <div>{dayNum(d)}</div>
                        </th>
                      ))}
                      <th className="px-2 py-2.5 text-center">Keldi</th>
                      <th className="px-2 py-2.5 text-center">Kelmadi</th>
                      <th className="px-3 py-2.5 text-center">Foiz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.map(s => (
                      <tr key={s.groupId + s.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="sticky left-0 bg-white px-4 py-2 font-medium text-slate-900">
                          {s.name}
                          <div className="truncate text-[11px] font-normal text-slate-400" title={s.email}>{s.email}</div>
                        </td>
                        <td className="px-2 py-2 text-xs text-slate-600">{s.groupName}</td>
                        {s.days.map((d, i) => (
                          <td key={i} className="px-1 py-2 text-center">
                            <span
                              title={d === "PRESENT" ? "Keldi" : d === "ABSENT" ? "Kelmadi" : "Belgilanmagan"}
                              className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                                d === "PRESENT" ? "bg-emerald-500 text-white"
                                : d === "ABSENT" ? "bg-red-500 text-white"
                                : "bg-slate-100 text-slate-300 border border-slate-200"}`}
                            >
                              {d === "PRESENT" ? "B" : d === "ABSENT" ? "K" : "—"}
                            </span>
                          </td>
                        ))}
                        <td className="px-2 py-2 text-center font-semibold text-emerald-600">{s.present}</td>
                        <td className="px-2 py-2 text-center font-semibold text-red-600">{s.absent}</td>
                        <td className={`px-3 py-2 text-center font-bold ${pctColor(s.percent)}`}>{s.percent === null ? "—" : `${s.percent}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <p className="text-xs text-slate-400">
            Belgilar: <b>B</b> — keldi, <b>K</b> — kelmadi. Davomatni o‘qituvchi «Mening guruhlarim → Davomat» bo‘limida qo‘yadi; bu yerda faqat ko‘rish va hisobot olish mumkin.
            Foiz = keldi ÷ (keldi + kelmadi).
          </p>
        </>
      )}
    </div>
  );
}
