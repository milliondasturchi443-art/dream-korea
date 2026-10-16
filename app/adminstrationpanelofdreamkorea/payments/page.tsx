"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Search, BellRing, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Pay = { id: string; amount: number; method: string; month?: string | null; note?: string | null; status: string; createdAt: string; user: { id: string; name: string; email: string } };
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
  const [payments, setPayments] = useState<Pay[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  // Eslatma formasi
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [markingId, setMarkingId] = useState("");

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
  async function markPaid(p: Pay) {
    if (!confirm(`${p.user.name} — ${p.amount.toLocaleString("uz-UZ")} so&apos;m to'landi deb tasdiqlaysizmi?`)) return;
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

      <Card className="p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
          <Input placeholder="Ism / email / oy / summa qidirish..." className="pl-9" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <Button variant="outline" onClick={load}>Yangilash</Button>
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 p-4"><Loader2 className="h-4 w-4 animate-spin"/> Yuklanmoqda…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">To&apos;lovlar yo&apos;q</Card>
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
                <span className="text-sm font-bold">{p.amount.toLocaleString("uz-UZ")} so&apos;m</span>
                {p.status === "PAID" ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> To&apos;langan</Badge>
                ) : p.status === "PENDING" ? (
                  <>
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px]">Hali to&apos;lanmagan</Badge>
                    <Button size="sm" onClick={() => markPaid(p)} disabled={markingId === p.id} className="h-8">
                      {markingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <CheckCircle2 className="h-3.5 w-3.5 mr-1"/>} To&apos;landi
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
