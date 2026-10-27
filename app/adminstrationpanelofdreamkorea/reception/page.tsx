"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { darsRequest } from "@/lib/dars-client";
import { UserPlus, Loader2, Phone, CalendarDays, Clock, GraduationCap, Trash2, Users, Home, Heart, MapPin, Check, CalendarClock, KeyRound, Copy, X, ShieldCheck } from "lucide-react";

type Teacher = { id: string; name: string; role: string };
type Group = { id: string; name: string; teacherId?: string | null; teacher?: { name: string } | null };
type Item = {
  id: string; name: string; phone: string; days: string; time: string; note?: string | null; status: string; createdAt: string;
  address?: string | null; parentName?: string | null; parentPhone?: string | null; startDate?: string | null;
  purpose?: string | null; plan?: string | null;
  teacher?: { name: string } | null;
  group?: { name: string } | null;
};

const ALL_DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
const PRESETS: { label: string; days: string[] }[] = [
  { label: "Dush–Chor–Jum", days: ["Dushanba", "Chorshanba", "Juma"] },
  { label: "Ses–Pay–Shan", days: ["Seshanba", "Payshanba", "Shanba"] },
];
const TIME_PRESETS = ["10:00 - 12:00", "13:30 - 15:30", "15:30 - 17:30"];
const TIME_RE = /^\d{2}:\d{2}( ?- ?\d{2}:\d{2})?$/;
const PURPOSES = ["TOPIK", "Koreada o'qish", "Ishlash", "Sayohat"];
const PLANS = ["Til kursi", "Kolleg", "Bakalavr", "Magistr"];
const STATUS_LABEL: Record<string, string> = { new: "Yangi", contacted: "Aloqa qilindi", enrolled: "Yozildi" };

// Avtomatik yaratilgan talaba hisobi (Qabul formasidan keyin ko'rsatiladi)
type Creds = { email: string; password: string | null; existing: boolean };

function fmtDateTime(isoStr: string) {
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export default function ReceptionPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [creds, setCreds] = useState<Creds | null>(null);
  const [copied, setCopied] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [note, setNote] = useState("");
  const [address, setAddress] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [purpose, setPurpose] = useState<string[]>([]);
  const [plan, setPlan] = useState("");

  function togglePurpose(p: string) {
    setPurpose(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  async function load() {
    setLoading(true); setError("");
    try {
      const d = await darsRequest<{ items: Item[] }>("/api/reception");
      setItems(d.items);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    queueMicrotask(() => { load(); });
    darsRequest<{ users: Teacher[] }>("/api/users").then(d => setTeachers(d.users.filter(u => u.role === "TEACHER"))).catch(() => {});
    darsRequest<{ groups: Group[] }>("/api/groups").then(d => setGroups(d.groups)).catch(() => {});
  }, []);

  const teacherGroups = groups.filter(g => !teacherId || g.teacherId === teacherId);

  function toggleDay(day: string) {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }

  async function submit() {
    setBusy(true); setError(""); setNotice(null); setCreds(null);
    try {
      const r = await darsRequest<{ account?: Creds | null }>("/api/reception", {
        name, phone, days, time, teacherId: teacherId || null, groupId: groupId || null, note: note || undefined,
        address: address || undefined, parentName: parentName || undefined, parentPhone: parentPhone || undefined,
        startDate: startDate || undefined,
        purpose: purpose.length ? purpose : undefined,
        plan: plan || undefined,
      });
      setName(""); setPhone(""); setDays([]); setTime(""); setTeacherId(""); setGroupId(""); setNote("");
      setAddress(""); setParentName(""); setParentPhone(""); setStartDate(""); setPurpose([]); setPlan("");
      // Hisob avtomatik yaratildi — login/parolni pastdagi kartochkada ko'rsatamiz
      if (r.account) setCreds(r.account);
      setNotice({ ok: true, text: r.account?.existing ? "Ro'yxatga olindi (mavjud hisob topildi)" : "Ro'yxatga olindi — talaba uchun hisob yaratildi" });
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1600);
    } catch {}
  }

  async function setStatus(id: string, status: string) {
    setNotice(null);
    try {
      const r = await fetch("/api/reception", { method: "PATCH", headers: await authHeaders(), body: JSON.stringify({ id, status }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setNotice({ ok: false, text: d.error || "Xato" }); return; }
      if (d.enrolled) {
        const e = d.enrolled;
        if (e.email) setCreds({ email: e.email, password: e.tempPassword ?? null, existing: !e.tempPassword });
        setNotice({ ok: true, text: `O'quvchi «${e.groupName ?? "guruh"}» guruhiga qo'shildi${e.added === false ? " (allaqachon a'zo edi)" : ""}` });
      } else if (d.warn) {
        setNotice({ ok: false, text: d.warn + (d.created?.email ? ` · Login: ${d.created.email}` : "") });
      }
      await load();
    } catch { setNotice({ ok: false, text: "Xatolik yuz berdi" }); }
  }

  async function remove(id: string) {
    if (!confirm("O'chirilsinmi?")) return;
    try { await fetch(`/api/reception?id=${id}`, { method: "DELETE", headers: await authHeaders() }); await load(); } catch {}
  }

  const valid = name.trim().length >= 2 && phone.trim().length >= 7 && days.length > 0 && TIME_RE.test(time.trim());

  return (
    <div className="mx-auto max-w-[1200px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-[22px] font-bold text-slate-900"><UserPlus className="h-6 w-6 text-[#2563eb]" /> O&apos;quvchi qo&apos;shish (Reception)</h1>
        <p className="text-sm text-slate-500">Qabulga kelgan o&apos;quvchini yozing: F.I.Sh., telefon, dars kunlari va vaqti, o&apos;qituvchi va guruh. «Yozildi» tugmasi — o&apos;quvchi avtomatik guruhga qo&apos;shiladi.</p>
      </div>

      {notice && <Card className={`p-4 text-sm ${notice.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`} role="status">{notice.text}</Card>}

      {/* ——— Avtomatik yaratilgan talaba hisobi: login + parol ——— */}
      {creds && (
        <Card className="border-emerald-200 bg-emerald-50/70 p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Talaba hisobi tayyor {creds.existing && <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">mavjud hisob topildi</span>}
            </div>
            <button onClick={() => setCreds(null)} aria-label="Yopish" className="text-emerald-700/60 hover:text-emerald-900"><X className="h-4 w-4" /></button>
          </div>
          <p className="text-xs text-emerald-800 -mt-1">
            {creds.password
              ? "Quyidagi login va parolni talabaga bering (yoki ota-onaga yuboring). Birinchi kirishda parolni o‘zgartirishni maslahat bering."
              : "Bu telefon raqamga oldin hisob yaratilgan — parol avval berilgan, yangi yaratilmadi."}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Login (email)</div>
                  <div className="truncate font-mono text-sm font-semibold text-slate-900" title={creds.email}>{creds.email}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => copyText("email", creds.email)}>
                  {copied === "email" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === "email" ? "Nusxalandi" : "Nusxalash"}
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1"><KeyRound className="h-3 w-3" /> Parol</div>
                  {creds.password ? (
                    <div className="truncate font-mono text-sm font-semibold text-slate-900" title={creds.password}>{creds.password}</div>
                  ) : (
                    <div className="text-sm text-slate-500">avval berilgan (ko‘rsatilmaydi)</div>
                  )}
                </div>
                {creds.password && (
                  <Button size="sm" variant="outline" onClick={() => copyText("pass", creds.password!)}>
                    {copied === "pass" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === "pass" ? "Nusxalandi" : "Nusxalash"}
                  </Button>
                )}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-emerald-700/80">
            Login formati: dreamkoreastudent0001@gmail.com — raqamlar ketma-ket oshadi (faqat oxirgi 4 ta raqam o‘zgaradi).
          </p>
        </Card>
      )}

      <Card className="p-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-slate-700">F.I.Sh. (Ism familiya)
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Qudratillayev Bekzod" />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">Telefon raqam
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+998 90 123 45 67" inputMode="tel" />
          </label>
        </div>

        <label className="block space-y-1 text-sm font-medium text-slate-700">
          <span className="flex items-center gap-1.5"><Home className="h-4 w-4 text-[#2563eb]" /> Yashash manzil</span>
          <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Namangan vil., Chust tum., Bog' ko'chasi 12-uy" />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm font-medium text-slate-700">
            <span className="flex items-center gap-1.5"><Heart className="h-4 w-4 text-[#2563eb]" /> Ota-ona F.I.Sh.</span>
            <Input value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Qudratillayev Valijon" />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">Ota-ona telefon raqami
            <Input value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="+998 90 111 22 33" inputMode="tel" />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">Kurs boshlash sanasi
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><CalendarDays className="h-4 w-4" /> Dars kunlari</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button key={p.label} type="button" onClick={() => setDays(p.days)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${JSON.stringify([...days].sort()) === JSON.stringify([...p.days].sort()) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map(d => (
              <button key={d} type="button" onClick={() => toggleDay(d)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${days.includes(d) ? "border-blue-500 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm font-medium text-slate-700">Dars vaqti
            <Input value={time} onChange={e => setTime(e.target.value)} placeholder="10:00 - 12:00" inputMode="numeric" />
          </label>
          <div className="space-y-1 text-sm font-medium text-slate-700 sm:col-span-2">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-[#2563eb]" /> Tez tanlash</span>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {TIME_PRESETS.map(t => (
                <button key={t} type="button" onClick={() => setTime(t)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${time === t ? "border-blue-500 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <label className="space-y-1 text-sm font-medium text-slate-700">O&apos;qituvchi
            <select value={teacherId} onChange={e => { setTeacherId(e.target.value); setGroupId(""); }}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">— Tanlanmagan —</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">Guruh
            <select value={groupId} onChange={e => setGroupId(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">— Avtomatik (o&apos;qituvchining birinchi guruhi) —</option>
              {teacherGroups.map(g => <option key={g.id} value={g.id}>{g.name}{g.teacher ? ` · ${g.teacher.name}` : ""}</option>)}
            </select>
          </label>
        </div>

        {/* ——— O'qish ma'lumotlari ——— */}
        <div className="border-t border-slate-200 pt-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><GraduationCap className="h-4 w-4 text-[#2563eb]" /> O‘qish ma’lumotlari</div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700">Til o‘rganish maqsadi <span className="text-xs font-normal text-slate-400">(bir yoki bir nechta)</span></div>
            <div className="flex flex-wrap gap-2">
              {PURPOSES.map(p => {
                const on = purpose.includes(p);
                return (
                  <button key={p} type="button" onClick={() => togglePurpose(p)} aria-pressed={on}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${on ? "border-blue-500 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    <span className={`grid h-4 w-4 place-items-center rounded border ${on ? "border-white/70 bg-white/25" : "border-slate-300 bg-white"}`}>
                      {on && <Check className="h-3 w-3" />}
                    </span>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700">Kelajakdagi reja</div>
            <div className="flex flex-wrap gap-2">
              {PLANS.map(pl => {
                const on = plan === pl;
                return (
                  <button key={pl} type="button" onClick={() => setPlan(on ? "" : pl)} aria-pressed={on}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${on ? "border-emerald-500 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    <span className={`grid h-4 w-4 place-items-center rounded-full border ${on ? "border-white/70 bg-white/25" : "border-slate-300 bg-white"}`}>
                      {on && <Check className="h-3 w-3" />}
                    </span>
                    {pl}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <label className="block space-y-1 text-sm font-medium text-slate-700">Izoh (ixtiyoriy)
          <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Masalan: boshlang'ich guruh, kechki vaqt" />
        </label>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button onClick={submit} disabled={busy || !valid} className="w-full sm:w-auto">
          {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />} Ro&apos;yxatga olish
        </Button>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">Ro&apos;yxat ({items.length})</h2>
        {loading && <div className="flex items-center gap-2 text-sm text-slate-500 p-4"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</div>}
        {!loading && !items.length && <Card className="p-8 text-center text-sm text-slate-500">Hozircha yozilmagan o&apos;quvchi yo&apos;q</Card>}
        {!loading && items.map(it => (
          <Card key={it.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-semibold text-slate-900">{it.name}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${it.status === "enrolled" ? "bg-emerald-50 text-emerald-700" : it.status === "contacted" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{STATUS_LABEL[it.status] ?? it.status}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-700">
                  <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5 text-[#2563eb]" />{it.teacher?.name ?? "O'qituvchi tanlanmagan"}</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-emerald-600" />{it.group?.name ?? "Guruh avtomatik yaratiladi"}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                  <a href={`tel:${it.phone.replace(/\s/g, "")}`} className="flex items-center gap-1 hover:text-[#2563eb]"><Phone className="h-3 w-3" />{it.phone}</a>
                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{it.days}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{it.time}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600"><CalendarClock className="h-3 w-3 text-[#2563eb]" />Ro‘yxatga olindi: {fmtDateTime(it.createdAt)}</span>
                </div>
                {(it.address || it.parentName || it.parentPhone || it.startDate) && (
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {it.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400" />{it.address}</span>}
                    {it.parentName && <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-slate-400" />{it.parentName}{it.parentPhone ? ` · ${it.parentPhone}` : ""}</span>}
                    {it.parentPhone && !it.parentName && <a href={`tel:${it.parentPhone.replace(/\s/g, "")}`} className="flex items-center gap-1 hover:text-[#2563eb]"><Phone className="h-3 w-3" />{it.parentPhone}</a>}
                    {it.startDate && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3 text-slate-400" />Boshlash: {it.startDate.split("-").reverse().join(".")}</span>}
                  </div>
                )}
                {(it.purpose || it.plan) && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {it.purpose?.split(",").filter(Boolean).map(p => (
                      <span key={p} className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">{p}</span>
                    ))}
                    {it.plan && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">{it.plan}</span>}
                  </div>
                )}
                {it.note && <p className="mt-1 text-xs text-slate-400">{it.note}</p>}
              </div>
              <div className="flex shrink-0 gap-1.5">
                {it.status === "new" && <Button size="sm" variant="outline" onClick={() => setStatus(it.id, "contacted")}>Aloqa qilindi</Button>}
                {it.status !== "enrolled" && <Button size="sm" onClick={() => setStatus(it.id, "enrolled")}>Yozildi</Button>}
                <button onClick={() => remove(it.id)} className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-red-600" aria-label="O'chirish"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
