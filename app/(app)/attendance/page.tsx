"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarCheck, CheckCircle2, XCircle } from "lucide-react";

type Row = { id: string; date: string; status: string; note?: string | null; group?: { id: string; name: string } | null };

function authHeader(): Record<string, string> {
  try { const t = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; return t ? { Authorization: `Bearer ${t}` } : {}; } catch { return {}; }
}

export default function StudentAttendancePage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    fetch("/api/attendance", { headers: authHeader() })
      .then(r => r.json())
      .then(d => setRows(Array.isArray(d.rows) ? d.rows : []))
      .catch(() => setRows([]));
  }, []);

  const list = rows ?? [];
  const present = list.filter(r => r.status === "PRESENT").length;
  const absent = list.filter(r => r.status === "ABSENT").length;

  return (
    <div className="mx-auto max-w-[800px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2"><CalendarCheck className="h-6 w-6 text-emerald-600"/> Davomat</h1>
        <p className="text-sm text-slate-500">Sizning davomat yozuvlaringiz</p>
      </div>

      {rows === null ? (
        <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/> Yuklanmoqda…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-[#eff6ff] p-3"><div className="text-xs text-slate-500">Jami yozuv</div><div className="font-bold">{list.length}</div></div>
            <div className="rounded-xl bg-emerald-50 p-3"><div className="text-xs text-slate-500">Qatnashgan</div><div className="font-bold text-emerald-600">{present}</div></div>
            <div className="rounded-xl bg-red-50 p-3"><div className="text-xs text-slate-500">Qatnashmagan</div><div className="font-bold text-red-600">{absent}</div></div>
          </div>

          {list.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">Hozircha davomat yo'q</Card>
          ) : (
            <div className="space-y-2">
              {list.map(r => (
                <Card key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{r.date}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {r.group?.name && <span>{r.group.name}</span>}
                      {r.note && <span className="text-slate-400"> · {r.note}</span>}
                    </div>
                  </div>
                  {r.status === "PRESENT" ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Qatnashdi</Badge>
                  ) : (
                    <Badge className="bg-red-50 text-red-700 border border-red-200 text-[11px] flex items-center gap-1"><XCircle className="h-3 w-3"/> Qatnashmadi</Badge>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
