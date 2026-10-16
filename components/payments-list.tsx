"use client";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, CheckCircle2, CalendarDays, Wallet, Hourglass, Users, StickyNote, BellRing, RefreshCw } from "lucide-react";

export type PayUser = { id: string; name: string; email: string; groupNames?: string[] };
export type PayRow = { id: string; amount: number; method: string; month?: string | null; note?: string | null; status: string; createdAt: string; user: PayUser };

type Props = {
  payments: PayRow[];
  loading: boolean;
  onRefresh: () => void;
  onMarkPaid?: (p: PayRow) => void;
  markingId?: string;
};

const STATUS_LABEL: Record<string, string> = { PENDING: "Kutilmoqda", PAID: "To'langan", CANCELLED: "Bekor qilingan", FAILED: "Muvaffaqiyatsiz" };

function fmtSum(n: number) { return n.toLocaleString("uz-UZ"); }

function fmtDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return new Date(iso).toLocaleDateString("uz-UZ"); }
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function methodLabel(m: string) {
  if (m === "reminder") return "Eslatma";
  return m.charAt(0).toUpperCase() + m.slice(1);
}

export function PaymentsList({ payments, loading, onRefresh, onMarkPaid, markingId }: Props) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | "PENDING" | "PAID">("");
  const [month, setMonth] = useState("");

  const searched = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return payments;
    return payments.filter(p =>
      (p.user.name + p.user.email).toLowerCase().includes(t)
      || String(p.amount).includes(t)
      || (p.month ?? "").toLowerCase().includes(t)
      || (p.note ?? "").toLowerCase().includes(t)
      || (p.user.groupNames ?? []).join(" ").toLowerCase().includes(t)
    );
  }, [payments, q]);

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const p of payments) if (p.month) set.add(p.month);
    return [...set].sort().reverse();
  }, [payments]);

  const stats = useMemo(() => {
    let paidSum = 0, pendingSum = 0, paidCount = 0, pendingCount = 0;
    for (const p of searched) {
      if (p.status === "PAID") { paidSum += p.amount; paidCount++; }
      else if (p.status === "PENDING") { pendingSum += p.amount; pendingCount++; }
    }
    return { paidSum, pendingSum, paidCount, pendingCount, total: searched.length };
  }, [searched]);

  const filtered = useMemo(() => searched.filter(p =>
    (status ? p.status === status : true) && (month ? (p.month ?? "") === month : true)
  ), [searched, status, month]);

  return (
    <div className="space-y-4">
      {/* Qidirish + yangilash */}
      <Card className="p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
          <Input placeholder="Ism / email / guruh / oy / summa / izoh qidirish..." className="pl-9" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <Button variant="outline" onClick={onRefresh}><RefreshCw className="h-4 w-4 mr-1"/> Yangilash</Button>
      </Card>

      {/* Statistika */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Card className="p-3 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0"><Wallet className="h-4.5 w-4.5"/></div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-500">To&apos;langan</div>
            <div className="text-sm font-bold text-emerald-700 truncate">{fmtSum(stats.paidSum)} so&apos;m</div>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 grid place-items-center shrink-0"><Hourglass className="h-4.5 w-4.5"/></div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-500">Kutilmoqda</div>
            <div className="text-sm font-bold text-amber-700 truncate">{fmtSum(stats.pendingSum)} so&apos;m</div>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0"><CheckCircle2 className="h-4.5 w-4.5"/></div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-500">To&apos;langanlar</div>
            <div className="text-sm font-bold">{stats.paidCount} ta</div>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 grid place-items-center shrink-0"><Users className="h-4.5 w-4.5"/></div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-500">Jami yozuv</div>
            <div className="text-sm font-bold">{stats.total} ta</div>
          </div>
        </Card>
      </div>

      {/* Filtrlar */}
      <div className="flex flex-wrap items-center gap-2">
        {([["", "Hammasi"], ["PENDING", `Kutilmoqda (${stats.pendingCount})`], ["PAID", `To'langan (${stats.paidCount})`]] as const).map(([val, label]) => (
          <button key={val || "all"} onClick={() => setStatus(val as "" | "PENDING" | "PAID")}
            className={`h-9 px-3 rounded-full text-xs font-medium transition-colors ${status === val ? "bg-[#0f1b3d] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {label}
          </button>
        ))}
        {months.length > 0 && (
          <select value={month} onChange={e => setMonth(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs">
            <option value="">Barcha oylar</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 p-4"><Loader2 className="h-4 w-4 animate-spin"/> Yuklanmoqda…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Wallet className="h-10 w-10 text-slate-300 mx-auto mb-2"/>
          <div className="text-sm font-medium text-slate-600">To&apos;lovlar yo&apos;q</div>
          <div className="text-xs text-slate-400 mt-1">{q || status || month ? "Filtrlarni o&apos;zgartirib ko&apos;ring" : "Hozircha ro&apos;yxat bo&apos;sh"}</div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <Card key={p.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-[#0f1b3d]/5 text-[#0f1b3d] font-bold text-sm grid place-items-center shrink-0">
                    {initials(p.user?.name ?? "")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{p.user?.name ?? "O&apos;quvchi"}</div>
                    <div className="text-xs text-slate-500 truncate">{p.user?.email ?? ""}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {(p.user?.groupNames ?? []).map(g => (
                        <Badge key={g} className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-1.5 py-0">{g}</Badge>
                      ))}
                      {p.month && (
                        <Badge className="bg-violet-50 text-violet-700 border border-violet-200 text-[10px] px-1.5 py-0 flex items-center gap-1"><CalendarDays className="h-2.5 w-2.5"/> {p.month}</Badge>
                      )}
                      <Badge className={`text-[10px] px-1.5 py-0 ${p.method === "reminder" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-600 border"}`}>
                        {p.method === "reminder" && <BellRing className="h-2.5 w-2.5 mr-0.5"/>}{methodLabel(p.method)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3"/> {fmtDateTime(p.createdAt)}</span>
                      {p.note && <span className="flex items-center gap-1 text-slate-500"><StickyNote className="h-3 w-3"/> {p.note}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className={`text-base font-bold ${p.status === "PAID" ? "text-emerald-700" : p.status === "PENDING" ? "text-slate-900" : "text-slate-400"}`}>
                    {fmtSum(p.amount)} so&apos;m
                  </div>
                  {p.status === "PAID" ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> To&apos;langan</Badge>
                  ) : p.status === "PENDING" ? (
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px]">Kutilmoqda</Badge>
                      {onMarkPaid && (
                        <Button size="sm" onClick={() => onMarkPaid(p)} disabled={markingId === p.id} className="h-7 px-2 text-xs">
                          {markingId === p.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <CheckCircle2 className="h-3 w-3 mr-1"/>} To&apos;landi
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-700 border text-[11px]">{STATUS_LABEL[p.status] ?? p.status}</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
