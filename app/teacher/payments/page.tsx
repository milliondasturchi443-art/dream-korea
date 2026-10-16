"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Search, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Pay = { id: string; amount: number; method: string; month?: string | null; note?: string | null; status: string; createdAt: string; user: { id: string; name: string; email: string } };
type Group = { id: string; name: string };

function authHeader(): Record<string, string> {
  try { const t = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; return t ? { Authorization: `Bearer ${t}` } : {}; } catch { return {}; }
}

export default function TeacherPaymentsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [payments, setPayments] = useState<Pay[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [markingId, setMarkingId] = useState("");

  async function load() {
    setLoading(true);
    const h = authHeader();
    try {
      const gs = await fetch("/api/groups", { headers: h }).then(r => r.json());
      setGroups(Array.isArray(gs.groups) ? gs.groups : []);
      const url = groupId ? `/api/payments?groupId=${encodeURIComponent(groupId)}` : "/api/payments";
      const pr = await fetch(url, { headers: h }).then(r => r.json());
      setPayments(Array.isArray(pr.payments) ? pr.payments : []);
    } catch {} finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [groupId]);

  // PENDING → PAID (tasdiqlash) — o'quvchiga "muvaffaqiyatli to'landi" bildirishnomasi
  async function markPaid(p: Pay) {
    if (!confirm(`${p.user.name} — ${p.amount.toLocaleString("uz-UZ")} so'm to'landi deb tasdiqlaysizmi?`)) return;
    setMarkingId(p.id);
    try {
      const r = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ id: p.id, status: "PAID" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "O'zgartirib bo'lmadi");
      toast.success("To'lov tasdiqlandi — o'quvchiga yuborildi");
      load();
    } catch (e) { toast.error((e as Error).message); } finally { setMarkingId(""); }
  }

  const filtered = q.trim() ? payments.filter(p => (p.user.name + p.user.email).toLowerCase().includes(q.toLowerCase()) || String(p.amount).includes(q) || (p.month ?? "").toLowerCase().includes(q.toLowerCase())) : payments;
  const pendingCount = payments.filter(p => p.status === "PENDING").length;

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2"><CreditCard className="h-6 w-6 text-emerald-600"/> To'lovlar nazorati</h1>
          <p className="text-sm text-slate-500">To'lovlar ro'yxati (faqat o'z guruhlaringiz)</p>
        </div>
        <select value={groupId} onChange={e => setGroupId(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm min-w-[200px]">
          <option value="">Barcha guruhlarim</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      <Card className="p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
          <Input placeholder="Ism / email / oy / summa qidirish..." className="pl-9" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <Button variant="outline" onClick={load}>Yangilash</Button>
      </Card>

      {pendingCount > 0 && (
        <p className="text-xs font-medium text-amber-600 -mt-2">{pendingCount} ta to'lov kutilmoqda</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 p-4"><Loader2 className="h-4 w-4 animate-spin"/> Yuklanmoqda…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">To'lovlar yo'q</Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <Card key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{p.user?.name ?? "O'quvchi"} <span className="text-xs text-slate-500">· {p.user?.email ?? ""}</span></div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {p.month && <span className="font-medium text-slate-600">{p.month} · </span>}
                  {new Date(p.createdAt).toLocaleDateString("uz-UZ")}
                  {p.note && <span className="text-slate-400"> · {p.note}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{p.amount.toLocaleString("uz-UZ")} so'm</span>
                {p.status === "PAID" ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> To'langan</Badge>
                ) : p.status === "PENDING" ? (
                  <>
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px]">Hali to'lanmagan</Badge>
                    <Button size="sm" onClick={() => markPaid(p)} disabled={markingId === p.id} className="h-8">
                      {markingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <CheckCircle2 className="h-3.5 w-3.5 mr-1"/>} To'landi
                    </Button>
                  </>
                ) : (
                  <Badge className="bg-slate-100 text-slate-700 border text-[11px]">{p.status}</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
