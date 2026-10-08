"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidUZ } from "@/lib/phone";
import { SITE_PHONE_DISPLAY, SITE_PHONE_E164 } from "@/lib/site";
import { telHref } from "@/lib/phone";
import { toast } from "sonner";
import { CheckCircle2, Phone } from "lucide-react";

export default function AdmissionPage() {
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", birth: "", edu: "", topik: "", uni: "", comment: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (!form.name || !form.phone || !form.email) { toast.error("Ism, telefon va email majburiy"); return; }
    if (!isValidUZ(form.phone)) { toast.error("Telefonni to‘g‘ri kiriting: +998 94 328 05 13"); return; }
    setSending(true);
    try {
      const r = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Yuborib bo‘lmadi");
      setDone(true);
      toast.success("Ariza yuborildi! Tez orada bog‘lanamiz.");
    } catch (err) {
      toast.error((err as Error).message || "Server bilan bog‘lanib bo‘lmadi");
    } finally { setSending(false); }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-[640px] p-4 lg:p-6">
        <Card className="p-6 sm:p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 grid place-items-center text-emerald-600"><CheckCircle2 className="h-7 w-7" /></div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Ariza qabul qilindi!</h1>
          <p className="text-sm text-slate-500 mt-1">Operatorimiz 24 soat ichida siz bilan bog‘lanadi.</p>
          <div className="mt-4 flex justify-center">
            <a href={telHref(SITE_PHONE_E164)} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700">
              <Phone className="h-4 w-4" /> {SITE_PHONE_DISPLAY}
            </a>
          </div>
          <Button className="mt-4" onClick={()=>setDone(false)}>Yana ariza yuborish</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Qabul — ariza</h1>
        <p className="text-sm text-slate-500">Koreya universitetlariga hujjat topshirish uchun formani to‘ldiring</p>
      </div>
      <Card className="p-4 sm:p-5 lg:p-6">
        <form onSubmit={submit} className="grid gap-3">
          <div><label className="text-xs font-medium">F.I.Sh. *</label><Input autoComplete="name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Bobur Karimov" className="mt-1 text-base sm:text-sm" /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <PhoneInput label="Telefon" requiredMark value={form.phone} onValueChange={v=>setForm({...form, phone:v})} placeholder="+998 94 328 05 13" />
            <div><label className="text-xs font-medium">Email *</label><Input inputMode="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="email@example.com" className="mt-1 text-base sm:text-sm" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-medium">Tug‘ilgan sana</label><Input type="date" value={form.birth} onChange={e=>setForm({...form, birth:e.target.value})} className="mt-1 text-base sm:text-sm" /></div>
            <div><label className="text-xs font-medium">Ma’lumoti</label><Input value={form.edu} onChange={e=>setForm({...form, edu:e.target.value})} placeholder="Maktab / Kollej / Universitet" className="mt-1 text-base sm:text-sm" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-medium">TOPIK darajasi</label><Input value={form.topik} onChange={e=>setForm({...form, topik:e.target.value})} placeholder="Masalan: TOPIK 2" className="mt-1 text-base sm:text-sm" /></div>
            <div><label className="text-xs font-medium">Qiziqqan universitet</label><Input value={form.uni} onChange={e=>setForm({...form, uni:e.target.value})} placeholder="Seoul National University" className="mt-1 text-base sm:text-sm" /></div>
          </div>
          <div><label className="text-xs font-medium">Izoh</label><Textarea value={form.comment} onChange={e=>setForm({...form, comment:e.target.value})} placeholder="Qo‘shimcha ma’lumot..." className="mt-1 text-base sm:text-sm" /></div>
          <Button type="submit" className="mt-2 h-11" disabled={sending}>{sending ? "Yuborilmoqda…" : "Ariza yuborish"}</Button>
          <p className="text-xs text-slate-500 text-center">Yuborish orqali shaxsiy ma’lumotlarni qayta ishlashga rozilik bildirasiz. Savollar uchun <a href={telHref(SITE_PHONE_E164)} className="font-medium text-[#2563eb] hover:underline">{SITE_PHONE_DISPLAY}</a></p>
        </form>
      </Card>
    </div>
  );
}
