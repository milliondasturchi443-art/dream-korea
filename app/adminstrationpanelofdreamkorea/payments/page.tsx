"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CreditCard, BellRing } from "lucide-react";
import { toast } from "sonner";
import { PaymentsList, type PayRow } from "@/components/payments-list";

type Student = { id: string; name: string; email: string; role: string };

function authHeader(): Record<string, string> {
  try { const t = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; return t ? { Authorization: `Bearer ${t}` } : {}; } catch { return {}; }
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminPaymentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<PayRow[]>([]);
  const [loading, setLoading] = useState(true);
  // Eslatma formasi
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [markingId, setMarkingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  async function load() {
    setLoading(true);
    const h = authHeader();
    try {
      const us = await fetch("/api/users", { headers: h }).then(r => r.json());
      const all: Student[] = Array.isArray(us.users) ? us.users : [];
      setStudents(all.filter(u => u.role === "STUDENT"));
      const pr = await fetch("/api/payments", { headers: h }).then(r => r.json());
      setPayments(Array.isArray(pr.payments) ? pr.payments : []);
    } catch {} finally { setLoading(false); }
  }
  useEffect(() => { queueMicrotask(() => { void load(); }); }, []);

  // To'lov eslatmasi yuborish (PENDING) — o'quvchiga bildirishnoma ketadi
  async function sendReminder() {
    if (!studentId) { toast.error("O'quvchini tanlang"); return; }
    const am = Number(amount);
    if (!am || am <= 0) { toast.error("Summa kiriting"); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ userId: studentId, amount: am, method: "reminder", status: "PENDING", month: month || undefined, note: note.trim() || undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Yuborib bo'lmadi");
      toast.success("To'lov eslatmasi yuborildi — o'quvchiga bildirishnoma ketdi");
      setAmount(""); setNote("");
      load();
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  }

  // PENDING → PAID (tasdiqlash)
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

  const pendingCount = payments.filter(p => p.status === "PENDING").length;

  // To'lovni o'chirish (moliyaviy yozuv — faqat admin, tasdiqlash bilan)
  async function deletePayment(p: PayRow) {
    if (!confirm(`Bu to'lovni o'chirishni tasdiqlaysizmi?\n${p.user.name} — ${p.amount.toLocaleString("uz-UZ")} so'm\nBu amalni qaytarib bo'lmaydi.`)) return;
    setDeletingId(p.id);
    try {
      const r = await fetch(`/api/payments/${p.id}`, { method: "DELETE", headers: authHeader() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "O'chirib bo'lmadi");
      setPayments(prev => prev.filter(x => x.id !== p.id));
      toast.success("To'lov o'chirildi");
    } catch (e) { toast.error((e as Error).message); } finally { setDeletingId(""); }
  }

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2"><CreditCard className="h-6 w-6 text-emerald-600"/> To&apos;lovlar nazorati</h1>
          <p className="text-sm text-slate-500">Eslatma yuboring, to&apos;lovni tasdiqlang (barcha guruhlar)</p>
        </div>
      </div>

      {/* To'lov eslatmasi yuborish */}
      <Card className="p-4">
        <div className="font-semibold text-sm flex items-center gap-2"><BellRing className="h-4 w-4 text-amber-500"/> To&apos;lov eslatmasi yuborish</div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_140px_160px_minmax(0,1fr)_auto] gap-2">
          <select value={studentId} onChange={e => setStudentId(e.target.value)} className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm">
            <option value="">— O&apos;quvchini tanlang —</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
            ))}
          </select>
          <Input placeholder="Summa" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} />
          <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
          <Input placeholder="Izoh (ixtiyoriy)" value={note} onChange={e => setNote(e.target.value)} />
          <Button onClick={sendReminder} disabled={saving} className="whitespace-nowrap">{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <BellRing className="h-4 w-4 mr-1"/>} Yuborish</Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Barcha o&apos;quvchilar — eslatma yuborilganda o&apos;quvchiga bildirishnoma ketadi.
          {pendingCount > 0 && <span className="ml-2 font-medium text-amber-600">{pendingCount} ta to&apos;lov kutilmoqda</span>}
        </p>
      </Card>

      <PaymentsList payments={payments} loading={loading} onRefresh={load} onMarkPaid={markPaid} markingId={markingId} onDelete={deletePayment} deletingId={deletingId} />
    </div>
  );
}
