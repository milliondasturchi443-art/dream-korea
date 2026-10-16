"use client";
import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { PaymentsList, type PayRow } from "@/components/payments-list";

type Group = { id: string; name: string };

function authHeader(): Record<string, string> {
  try { const t = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; return t ? { Authorization: `Bearer ${t}` } : {}; } catch { return {}; }
}

export default function TeacherPaymentsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [payments, setPayments] = useState<PayRow[]>([]);
  const [loading, setLoading] = useState(true);
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
  useEffect(() => { queueMicrotask(() => { void load(); }); }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  // PENDING → PAID (tasdiqlash) — o'quvchiga "muvaffaqiyatli to'landi" bildirishnomasi
  async function markPaid(p: PayRow) {
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

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2"><CreditCard className="h-6 w-6 text-emerald-600"/> To&apos;lovlar nazorati</h1>
          <p className="text-sm text-slate-500">To&apos;lovlar ro&apos;yxati (faqat o&apos;z guruhlaringiz)</p>
        </div>
        <select value={groupId} onChange={e => setGroupId(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm min-w-[200px]">
          <option value="">Barcha guruhlarim</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      <PaymentsList payments={payments} loading={loading} onRefresh={load} onMarkPaid={markPaid} markingId={markingId} />
    </div>
  );
}
