"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CreditCard, Loader2, Plus, RefreshCw, RotateCcw, Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { currentBillingMonth } from "@/lib/payment-accounting";

type Totals = { tuition: number | null; received: number; refunded: number; net: number; debt: number | null; overpaid: number | null };
type Student = Totals & { id: string; name: string; email: string; teacherIds: string[]; teacherNames: string[]; groups: string[]; lessonHours: number | null };
type Summary = { billingMonth: string; received: number; refunded: number; net: number; debt: number; paidCount: number; debtCount: number; unknownCount: number };
type Operation = { id: string; userId: string; studentName: string; billingMonth: string | null; legacyMonth: string | null; type: string; amount: number; status: string; operationDate: string | null; createdAt: string; note: string | null; voidedAt: string | null };
type Ledger = { billingMonth: string; students: Student[]; summary: Summary; chart: Summary[]; teachers: { id: string; name: string }[]; history: Operation[] };
type Action = "PAYMENT" | "REFUND" | "TARIFF" | "REMINDER" | "CONFIRM" | "ASSIGN" | "EDIT";
type Form = { action: Action; userId: string; billingMonth: string; date: string; amount: string; tuition: string; hours: string; preset: string; note: string; method: string; setDefault: boolean; paymentId?: string };

const money = (n: number | null | undefined) => n == null ? "Belgilanmagan" : `${n.toLocaleString("uz-UZ")} UZS`;
const selectStyle = "h-10 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm";
const actionLabels: Record<Action, string> = { PAYMENT: "To‘lov qo‘shish", REFUND: "Mablag‘ni qaytarish · Refund", TARIFF: "Oylik tarif va soatlar", REMINDER: "To‘lov eslatmasi", CONFIRM: "To‘lovni tasdiqlash", ASSIGN: "Eski yozuvning hisob oyini belgilash", EDIT: "To‘lovni o‘zgartirish" };
const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tashkent" }).format(new Date());
function authHeader(): Record<string, string> {
  try { const token = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token"); return token ? { Authorization: `Bearer ${token}` } : {}; } catch { return {}; }
}

export default function AdminPaymentsPage() {
  const [month, setMonth] = useState(currentBillingMonth);
  const [data, setData] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState("");
  const [teacher, setTeacher] = useState("");
  const [hours, setHours] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState("");
  const [historyMonth, setHistoryMonth] = useState("selected");
  const [historyPage, setHistoryPage] = useState(0);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");
  const [remoteAccount, setRemoteAccount] = useState<{ key: string; totals: Totals } | null>(null);
  const request = useRef<{ key: string; payload: string } | null>(null);
  const savingRef = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fresh = data?.billingMonth === month && !loading;

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) { setLoading(true); setError(""); } });
    fetch(`/api/payments/ledger?billingMonth=${encodeURIComponent(month)}`, { headers: authHeader(), signal: controller.signal })
      .then(async r => { const body = await r.json(); if (!r.ok) throw new Error(body.error || "Yuklash xatosi"); return body as Ledger; })
      .then(setData).catch(e => { if (!controller.signal.aborted) setError((e as Error).message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [month, revision]);

  useEffect(() => {
    if (form && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
    if (!form && dialogRef.current?.open) dialogRef.current.close();
  }, [form]);

  const filtered = useMemo(() => (data?.students ?? []).filter(s =>
    query.toLocaleLowerCase().trim().split(/\s+/).every(word => `${s.name} ${s.email}`.toLocaleLowerCase().includes(word)) &&
    (!teacher || s.teacherIds.includes(teacher)) &&
    (!hours || (hours === "unknown" ? s.lessonHours === null : s.lessonHours === Number(hours)))
  ), [data, query, teacher, hours]);
  const hoursOptions = [...new Set((data?.students ?? []).map(s => s.lessonHours).filter((h): h is number => h !== null))].sort((a, b) => a - b);
  const history = (data?.history ?? []).filter(p => (!selected || p.userId === selected) && (historyMonth === "all" || (historyMonth === "unassigned" ? !p.billingMonth : p.billingMonth === month)));
  const selectedStudent = data?.students.find(s => s.id === selected);
  const formStudent = data?.students.find(s => s.id === form?.userId);
  const accountKey = form ? `${form.userId}:${form.billingMonth}` : "";
  const formBalance = remoteAccount?.key === accountKey ? remoteAccount.totals : form?.billingMonth === month ? formStudent : null;
  const needsRemote = !!form && form.billingMonth !== month && !!form.userId;
  const accountReady = !needsRemote || remoteAccount?.key === accountKey;
  const summary = data?.summary;

  useEffect(() => {
    if (!needsRemote || !form) return;
    const controller = new AbortController();
    const key = `${form.userId}:${form.billingMonth}`;
    fetch(`/api/payments/ledger?billingMonth=${form.billingMonth}&userId=${form.userId}`, { headers: authHeader(), signal: controller.signal })
      .then(async r => { const body = await r.json(); if (!r.ok) throw new Error(body.error); return body as Totals; })
      .then(totals => {
        setRemoteAccount({ key, totals });
        setForm(previous => previous && `${previous.userId}:${previous.billingMonth}` === key ? {
          ...previous, tuition: totals.tuition === null ? "" : String(totals.tuition),
          preset: [360000, 420000, 450000].includes(totals.tuition ?? -1) ? String(totals.tuition) : "manual",
        } : previous);
      }).catch(e => { if (!controller.signal.aborted) toast.error((e as Error).message); });
    return () => controller.abort();
  }, [needsRemote, form?.userId, form?.billingMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  function openForm(action: Action, userId = selected, operation?: Operation) {
    const student = data?.students.find(s => s.id === userId);
    const fee = student?.tuition;
    request.current = null;
    setRemoteAccount(null);
    setStudentQuery("");
    setForm({ action, userId, billingMonth: operation?.billingMonth ?? month, date: today(), amount: operation ? String(operation.amount) : "",
      tuition: fee == null ? "" : String(fee), hours: student?.lessonHours == null ? "" : String(student.lessonHours),
      preset: [360000, 420000, 450000].includes(fee ?? -1) ? String(fee) : "manual",
      note: "", method: "cash", setDefault: false, paymentId: operation?.id,
    });
  }

  async function mutate(payload: Record<string, unknown>) {
    const serialized = JSON.stringify(payload);
    if (!request.current || request.current.payload !== serialized) request.current = { key: crypto.randomUUID(), payload: serialized };
    const response = await fetch("/api/payments/ledger", { method: "POST", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify({ ...payload, requestId: request.current.key }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Saqlanmadi");
    request.current = null;
    setRevision(r => r + 1);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await mutate({ action: form.action, userId: form.userId, billingMonth: form.billingMonth, operationDate: form.date,
        ...(form.action === "TARIFF" || form.action === "PAYMENT" || form.action === "REMINDER" ? { tuition: Number(form.tuition) } : {}),
        ...(["PAYMENT", "REFUND", "REMINDER", "EDIT"].includes(form.action) ? { amount: Number(form.amount) } : {}),
        ...(form.action === "TARIFF" && form.hours !== "" ? { lessonHours: Number(form.hours) } : {}),
        paymentId: form.paymentId, note: form.note, method: form.method, setDefault: form.setDefault,
      });
      toast.success("Operatsiya saqlandi");
      setForm(null);
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); savingRef.current = false; }
  }

  async function voidOperation(p: Operation) {
    const note = window.prompt("Bekor qilish sababi (yozuv tarixda saqlanadi):");
    if (!note?.trim() || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await mutate({ action: "VOID", userId: p.userId, billingMonth: p.billingMonth, paymentId: p.id, note: note.trim() });
      toast.success("Operatsiya bekor qilindi. Tarix saqlandi.");
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); savingRef.current = false; }
  }

  return <div className="mx-auto max-w-[1440px] space-y-5 p-4 lg:p-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><CreditCard className="text-blue-600" /> To‘lov paneli</h1><p className="mt-1 text-sm text-slate-500">Oylik hisob · qisman to‘lovlar · qaytarishlar · qarzdorlik</p></div>
      <div className="flex items-end gap-2"><label className="text-xs font-semibold text-slate-500">Hisob oyi<Input aria-label="Hisob oyi" type="month" min="2000-01" max="2099-12" value={month} onChange={e => { if (e.target.value) { setMonth(e.target.value); setPage(0); setHistoryPage(0); } }} /></label><Button variant="outline" aria-label="Yangilash" onClick={() => setRevision(r => r + 1)} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button></div>
    </header>
    {error && <Card role="alert" className="border-red-200 bg-red-50 p-4 text-red-700">{error} <Button variant="outline" onClick={() => setRevision(r => r + 1)}>Qayta urinish</Button></Card>}
    <div className="flex flex-wrap gap-2">
      <Button disabled={!fresh || !!error} onClick={() => openForm("PAYMENT")}><Plus className="mr-1 h-4 w-4" /> To‘lov qo‘shish</Button>
      <Button disabled={!fresh || !!error} variant="outline" onClick={() => openForm("REFUND")}><RotateCcw className="mr-1 h-4 w-4 text-rose-600" /> Refund</Button>
      <Button disabled={!fresh || !!error} variant="outline" onClick={() => openForm("TARIFF")}>Tarif / soatlar</Button>
      <Button disabled={!fresh || !!error} variant="outline" onClick={() => openForm("REMINDER")}>Eslatma yuborish</Button>
    </div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-6" aria-busy={loading}>
      {[["Qabul qilingan", summary?.received, "text-emerald-700"], ["Qaytarilgan", summary?.refunded, "text-rose-600"], ["Sof daromad", summary?.net, "text-blue-700"], ["Qarzdorlik", summary?.debt, "text-amber-700"], ["To‘liq to‘lagan", summary?.paidCount, "text-emerald-700"], ["Qarzdor o‘quvchilar", summary?.debtCount, "text-amber-700"]].map(([label, value, color], i) => <Card className="p-4" key={String(label)}><p className="text-xs text-slate-500">{label}</p><p className={`mt-2 break-words text-lg font-bold ${color}`}>{!fresh ? "…" : i < 4 ? money(value as number) : value ?? 0}</p></Card>)}
    </div>
    {!!summary?.unknownCount && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{summary.unknownCount} o‘quvchining oylik narxi belgilanmagan. Ularning qarzi noma’lum va jami qarzdorlikka qo‘shilmagan. Tarifni belgilang.</p>}
    <Card className="space-y-4 p-4">
      <div className="grid gap-3 md:grid-cols-3"><label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input aria-label="Ism va familiya bo‘yicha qidirish" className="pl-9" placeholder="Ism / familiya / email…" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} /></label><select aria-label="Ustoz bo‘yicha filtr" className={selectStyle} value={teacher} onChange={e => { setTeacher(e.target.value); setPage(0); }}><option value="">Barcha ustozlar</option>{data?.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><select aria-label="Soatlar bo‘yicha filtr" className={selectStyle} value={hours} onChange={e => { setHours(e.target.value); setPage(0); }}><option value="">Barcha dars soatlari</option>{hoursOptions.map(h => <option key={h} value={h}>{h} soat / oy</option>)}<option value="unknown">Soatlar belgilanmagan</option></select></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="border-b text-xs text-slate-500"><tr>{["O‘quvchi", "Ustoz / guruh", "Soat / oy", "Oylik narx", "Qabul qilingan", "Qaytarilgan", "Sof to‘lov", "Qarz", ""].map(h => <th className="px-2 py-3" key={h}>{h}</th>)}</tr></thead><tbody>{fresh && filtered.slice(page * 25, page * 25 + 25).map(s => <tr key={s.id} className={`border-b ${selected === s.id ? "bg-blue-50" : "hover:bg-slate-50"}`}><td className="px-2 py-3"><button className="text-left font-semibold text-blue-700" onClick={() => { setSelected(s.id); setHistoryPage(0); }}>{s.name}</button><div className="text-xs text-slate-400">{s.email}</div></td><td className="px-2 py-3"><div>{s.teacherNames.join(", ") || "—"}</div><div className="text-xs text-slate-400">{s.groups.join(", ")}</div></td><td className="px-2 py-3">{s.lessonHours ?? "—"}</td><td className="px-2 py-3">{money(s.tuition)}</td><td className="px-2 py-3 text-emerald-700">{money(s.received)}</td><td className="px-2 py-3 text-rose-600">{money(s.refunded)}</td><td className="px-2 py-3">{money(s.net)}{(s.overpaid ?? 0) > 0 && <div className="text-xs text-blue-600">Ortiqcha: {money(s.overpaid)}</div>}</td><td className="px-2 py-3 font-semibold text-amber-700">{money(s.debt)}</td><td className="px-2 py-3"><Button size="sm" variant="outline" onClick={() => openForm("PAYMENT", s.id)}>To‘lov</Button></td></tr>)}</tbody></table></div>
      {loading ? <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</p> : !filtered.length ? <p className="py-6 text-center text-slate-500">O‘quvchilar topilmadi</p> : null}
      <div className="flex items-center justify-between text-xs text-slate-500"><span>{filtered.length} o‘quvchi · {page + 1}/{Math.max(1, Math.ceil(filtered.length / 25))}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={!page} onClick={() => setPage(p => p - 1)}>Oldingi</Button><Button size="sm" variant="outline" disabled={(page + 1) * 25 >= filtered.length} onClick={() => setPage(p => p + 1)}>Keyingi</Button></div></div>
    </Card>
    {selectedStudent && <Card className="space-y-3 border-blue-200 p-4"><div className="flex items-center justify-between"><h2 className="font-bold">{selectedStudent.name} · {month}</h2><Button variant="ghost" size="sm" onClick={() => setSelected("")} aria-label="O‘quvchi tanlovini yopish"><X className="h-4 w-4" /></Button></div><div className="grid grid-cols-2 gap-3 md:grid-cols-6">{[["Oylik narx", selectedStudent.tuition], ["Qabul qilingan", selectedStudent.received], ["Qaytarilgan", selectedStudent.refunded], ["Sof to‘lov", selectedStudent.net], ["Qarz", selectedStudent.debt], ["Ortiqcha", selectedStudent.overpaid]].map(([label, n]) => <div key={String(label)}><div className="text-xs text-slate-500">{label}</div><div className="text-sm font-bold">{money(n as number | null)}</div></div>)}</div><div className="flex gap-2"><Button size="sm" onClick={() => openForm("PAYMENT")}>To‘lov</Button><Button variant="outline" size="sm" onClick={() => openForm("REFUND")}>Refund</Button><Button variant="outline" size="sm" onClick={() => openForm("TARIFF")}>Tarif</Button></div></Card>}
    <Card className="space-y-4 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">Operatsiyalar tarixi {selectedStudent ? `· ${selectedStudent.name}` : "· barcha o‘quvchilar"}</h2><select aria-label="Tarix oylari" className={`${selectStyle} max-w-[240px]`} value={historyMonth} onChange={e => { setHistoryMonth(e.target.value); setHistoryPage(0); }}><option value="selected">Tanlangan oy: {month}</option><option value="all">Barcha oylar</option><option value="unassigned">Hisob oyi noma’lum</option></select></div><p className="text-xs text-slate-500">Eski yozuvlarda faktik sana bo‘lmasa «noma’lum» ko‘rsatiladi. Yaratilgan sana to‘lov sanasi o‘rniga qo‘yilmaydi.</p><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="border-b text-xs text-slate-500"><tr>{["O‘quvchi", "Faktik sana", "Hisob oyi", "Operatsiya", "Summa", "Izoh", "Yaratilgan", ""].map(h => <th className="px-2 py-3" key={h}>{h}</th>)}</tr></thead><tbody>{history.slice(historyPage * 25, historyPage * 25 + 25).map(p => <tr key={p.id} className={`border-b ${p.voidedAt ? "opacity-50" : ""}`}><td className="px-2 py-3">{p.studentName}</td><td className="px-2 py-3">{p.operationDate ?? "Noma’lum"}</td><td className="px-2 py-3">{p.billingMonth ?? `Noma’lum${p.legacyMonth ? ` (${p.legacyMonth})` : ""}`}</td><td className={`px-2 py-3 font-medium ${p.type === "REFUND" ? "text-rose-600" : "text-emerald-700"}`}>{p.type === "REFUND" ? "Refund" : "To‘lov"}<div className="text-xs text-slate-400">{p.voidedAt ? "Bekor qilingan" : p.status === "PAID" ? "Tasdiqlangan" : p.status === "PENDING" ? "Kutilmoqda" : p.status}</div></td><td className="px-2 py-3">{money(p.amount)}</td><td className="max-w-[220px] break-words px-2 py-3">{p.note ?? "—"}</td><td className="px-2 py-3 text-xs">{new Date(p.createdAt).toLocaleString("uz-UZ")}</td><td className="px-2 py-3"><div className="flex gap-1">{!p.billingMonth && <Button size="sm" variant="outline" onClick={() => openForm("ASSIGN", p.userId, p)}>Oyni belgilash</Button>}{p.billingMonth && !p.voidedAt && p.status === "PAID" && p.type === "PAYMENT" && <Button size="sm" variant="outline" onClick={() => openForm("EDIT", p.userId, p)}>O‘zgartirish</Button>}{p.billingMonth && !p.voidedAt && p.status === "PENDING" && <Button size="sm" onClick={() => openForm("CONFIRM", p.userId, p)}>Tasdiqlash</Button>}{p.billingMonth && !p.voidedAt && <Button size="sm" variant="ghost" disabled={saving} onClick={() => voidOperation(p)}>Bekor qilish</Button>}</div></td></tr>)}</tbody></table></div>{!history.length && <p className="py-4 text-center text-sm text-slate-400">Operatsiyalar yo‘q</p>}<div className="flex justify-between text-xs text-slate-500"><span>{history.length} operatsiya</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={!historyPage} onClick={() => setHistoryPage(p => p - 1)}>Oldingi</Button><Button size="sm" variant="outline" disabled={(historyPage + 1) * 25 >= history.length} onClick={() => setHistoryPage(p => p + 1)}>Keyingi</Button></div></div></Card>
    <Card className="space-y-4 p-4"><h2 className="font-bold">Oylar bo‘yicha moliyaviy statistika</h2><p className="text-xs text-slate-500">Guruhlash faktik sanaga emas, hisob oyiga asoslangan. Qarzdorlik faqat narxi belgilangan hisoblarni o‘z ichiga oladi.</p><div className="h-[320px] w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={data?.chart ?? []}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="billingMonth" /><YAxis width={65} tickFormatter={n => `${Number(n) / 1000000}m`} /><Tooltip formatter={v => money(Number(v))} /><Legend /><Bar dataKey="received" name="Qabul qilingan" fill="#10b981" /><Bar dataKey="refunded" name="Qaytarilgan" fill="#f43f5e" /><Bar dataKey="net" name="Sof daromad" fill="#3b82f6" /><Bar dataKey="debt" name="Qarzdorlik" fill="#f59e0b" /></BarChart></ResponsiveContainer></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Oy", "Qabul qilingan", "Qaytarilgan", "Sof daromad", "Qarzdorlik"].map(h => <th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{data?.chart.map(c => <tr key={c.billingMonth} className="border-t"><td className="p-2"><button className="text-blue-700" onClick={() => { setMonth(c.billingMonth); setPage(0); }}>{c.billingMonth}</button></td>{[c.received, c.refunded, c.net, c.debt].map((n, i) => <td className="whitespace-nowrap p-2" key={i}>{money(n)}</td>)}</tr>)}</tbody></table></div></Card>
    <dialog ref={dialogRef} onCancel={e => { e.preventDefault(); if (!saving) setForm(null); }} className="fixed inset-0 m-auto max-h-[90dvh] w-[min(95vw,620px)] overflow-y-auto rounded-3xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/50">
      {form && <form onSubmit={save} className="space-y-4 p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">{actionLabels[form.action]}</h2><Button type="button" variant="ghost" aria-label="Yopish" disabled={saving} onClick={() => setForm(null)}><X className="h-4 w-4" /></Button></div>
        <label className="block space-y-1 text-xs font-semibold">O‘quvchini qidirish<Input value={studentQuery} onChange={e => setStudentQuery(e.target.value)} placeholder="Ism / familiya…" /></label>
        <label className="block space-y-1 text-xs font-semibold">O‘quvchi<select required disabled={saving || !!form.paymentId} value={form.userId} className={selectStyle} onChange={e => { const s = data?.students.find(s => s.id === e.target.value); setForm(f => f ? { ...f, userId: e.target.value, tuition: s?.tuition == null ? "" : String(s.tuition), hours: s?.lessonHours == null ? "" : String(s.lessonHours), preset: [360000, 420000, 450000].includes(s?.tuition ?? -1) ? String(s?.tuition) : "manual" } : f); }}><option value="">Tanlang</option>{data?.students.filter(s => s.id === form.userId || `${s.name} ${s.email}`.toLowerCase().includes(studentQuery.toLowerCase())).map(s => <option key={s.id} value={s.id}>{s.name} · {s.email}</option>)}</select></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs font-semibold">Hisob oyi<Input type="month" min="2000-01" max="2099-12" required value={form.billingMonth} disabled={saving || (!!form.paymentId && form.action !== "ASSIGN")} onChange={e => setForm(f => f ? { ...f, billingMonth: e.target.value, tuition: "", preset: "manual" } : f)} /></label>{!["TARIFF", "ASSIGN"].includes(form.action) && <label className="space-y-1 text-xs font-semibold">Faktik {form.action === "REFUND" ? "qaytarish" : "to‘lov"} sanasi<Input type="date" required value={form.date} onChange={e => setForm(f => f ? { ...f, date: e.target.value } : f)} /></label>}</div>
        {form.action === "ASSIGN" && <p className="rounded-xl bg-amber-50 p-3 text-sm">Oyni faqat ishonchli hujjat asosida belgilang. Yaratilgan sana hisob oyini isbotlamaydi.</p>}
        {["PAYMENT", "TARIFF", "REMINDER"].includes(form.action) && <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs font-semibold">Oylik narx<select className={selectStyle} value={form.preset} disabled={form.action !== "TARIFF" && formBalance?.tuition != null} onChange={e => setForm(f => f ? { ...f, preset: e.target.value, tuition: e.target.value === "manual" ? "" : e.target.value } : f)}>{[360000, 420000, 450000].map(n => <option key={n} value={n}>{money(n)}</option>)}<option value="manual">Boshqa summa · Manual</option></select></label><label className="space-y-1 text-xs font-semibold">Narx · UZS<Input type="number" min="0" max="1000000000" step="1" required readOnly={form.preset !== "manual" || (form.action !== "TARIFF" && formBalance?.tuition != null)} value={form.tuition} onChange={e => setForm(f => f ? { ...f, tuition: e.target.value } : f)} /></label></div>}
        {form.action === "TARIFF" && <><label className="block space-y-1 text-xs font-semibold">Dars soatlari / oy<Input type="number" min="0" max="744" step="0.5" value={form.hours} onChange={e => setForm(f => f ? { ...f, hours: e.target.value } : f)} /></label><label className="flex gap-2 text-sm"><input type="checkbox" checked={form.setDefault} onChange={e => setForm(f => f ? { ...f, setDefault: e.target.checked } : f)} />Keyingi yangi oylar uchun ham asosiy tarif sifatida saqlash</label><p className="text-xs text-slate-500">Oldin yaratilgan oylar o‘zgarmaydi. Bo‘sh soatlar noma’lum bo‘lib qoladi.</p></>}
        {["PAYMENT", "REFUND", "REMINDER", "EDIT"].includes(form.action) && <label className="block space-y-1 text-xs font-semibold">{form.action === "REFUND" ? "Qaytariladigan" : "Qabul qilinadigan"} summa · UZS<Input type="number" min="1" max="1000000000" step="1" required value={form.amount} onChange={e => setForm(f => f ? { ...f, amount: e.target.value } : f)} /></label>}
        {form.action === "REFUND" && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">Mavjud sof to‘lov: {formBalance ? money(formBalance.net) : "tanlangan oy uchun serverda tekshiriladi"}. Qaytarish qarzdorlikni qayta ochishi mumkin.</p>}
        {form.action === "PAYMENT" && <label className="block space-y-1 text-xs font-semibold">To‘lov usuli<select className={selectStyle} value={form.method} onChange={e => setForm(f => f ? { ...f, method: e.target.value } : f)}><option value="cash">Naqd</option><option value="card">Karta</option><option value="transfer">O‘tkazma</option></select></label>}
        <label className="block space-y-1 text-xs font-semibold">Izoh / sabab<Input maxLength={1000} value={form.note} onChange={e => setForm(f => f ? { ...f, note: e.target.value } : f)} /></label>
        <p className="text-xs text-slate-500">Hisob oyi va faktik sana mustaqil. Noyabrda olingan pul oktabr uchun yozilishi mumkin.</p>{!accountReady && <p className="text-xs text-blue-600">Tanlangan oy tarifi tekshirilmoqda…</p>}<Button className="w-full" disabled={saving || !form.userId || !accountReady} type="submit">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Saqlash</Button>
      </form>}
    </dialog>
  </div>;
}
