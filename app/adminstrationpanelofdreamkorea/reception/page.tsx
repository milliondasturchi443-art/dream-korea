"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { darsRequest } from "@/lib/dars-client";
import { UserPlus, Loader2, Phone, CalendarDays, Clock, GraduationCap, Trash2, Users } from "lucide-react";

type Teacher = { id: string; name: string; role: string };
type Group = { id: string; name: string; teacherId?: string | null; teacher?: { name: string } | null };
type Item = {
  id: string; name: string; phone: string; days: string; time: string; note?: string | null; status: string; createdAt: string;
  teacher?: { name: string } | null;
  group?: { name: string } | null;
};

const ALL_DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
const PRESETS: { label: string; days: string[] }[] = [
  { label: "Dush–Chor–Jum", days: ["Dushanba", "Chorshanba", "Juma"] },
  { label: "Ses–Pay–Shan", days: ["Seshanba", "Payshanba", "Shanba"] },
];
const STATUS_LABEL: Record<string, string> = { new: "Yangi", contacted: "Aloqa qilindi", enrolled: "Yozildi" };

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

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const d = await darsRequest<{ items: Item[] }>("/api/reception");
      setItems(d.items);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    load();
    darsRequest<{ users: Teacher[] }>("/api/users").then(d => setTeachers(d.users.filter(u => u.role === "TEACHER"))).catch(() => {});
    darsRequest<{ groups: Group[] }>("/api/groups").then(d => setGroups(d.groups)).catch(() => {});
  }, []);

  const teacherGroups = groups.filter(g => !teacherId || g.teacherId === teacherId);

  function toggleDay(day: string) {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }

  async function submit() {
    setBusy(true); setError(""); setNotice(null);
    try {
      await darsRequest("/api/reception", { name, phone, days, time, teacherId: teacherId || null, groupId: groupId || null, note: note || undefined });
      setName(""); setPhone(""); setDays([]); setTime(""); setTeacherId(""); setGroupId(""); setNote("");
      setNotice({ ok: true, text: "Ro'yxatga olindi" });
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function setStatus(id: string, status: string) {
    setNotice(null);
    try {
      const r = await fetch("/api/reception", { method: "PATCH", headers: await authHeaders(), body: JSON.stringify({ id, status }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setNotice({ ok: false, text: d.error || "Xato" }); return; }
      if (d.enrolled) {
        const e = d.enrolled;
        setNotice({ ok: true, text: `O'quvchi «${e.groupName ?? "guruh"}» guruhiga qo'shildi${e.added === false ? " (allaqachon a'zo edi)" : ""}. Login: ${e.email}${e.tempPassword ? ` · Vaqtinchalik parol: ${e.tempPassword} (talabaga bering)` : ""}` });
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

  const valid = name.trim().length >= 2 && phone.trim().length >= 7 && days.length > 0 && /^\d{2}:\d{2}$/.test(time);

  return (
    <div className="mx-auto max-w-[1200px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-[22px] font-bold text-slate-900"><UserPlus className="h-6 w-6 text-[#2563eb]" /> O'quvchi qo'shish (Reception)</h1>
        <p className="text-sm text-slate-500">Qabulga kelgan o'quvchini yozing: F.I.Sh., telefon, dars kunlari va vaqti, o'qituvchi va guruh. «Yozildi» tugmasi — o'quvchi avtomatik guruhga qo'shiladi.</p>
      </div>

      {notice && <Card className={`p-4 text-sm ${notice.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`} role="status">{notice.text}</Card>}

      <Card className="p-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-slate-700">F.I.Sh. (Ism familiya)
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Qudratillayev Bekzod" />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">Telefon raqam
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+998 90 123 45 67" inputMode="tel" />
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
            <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">O'qituvchi
            <select value={teacherId} onChange={e => { setTeacherId(e.target.value); setGroupId(""); }}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">— Tanlanmagan —</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">Guruh
            <select value={groupId} onChange={e => setGroupId(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">— Avtomatik (o'qituvchining birinchi guruhi) —</option>
              {teacherGroups.map(g => <option key={g.id} value={g.id}>{g.name}{g.teacher ? ` · ${g.teacher.name}` : ""}</option>)}
            </select>
          </label>
        </div>

        <label className="block space-y-1 text-sm font-medium text-slate-700">Izoh (ixtiyoriy)
          <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Masalan: boshlang'ich guruh, kechki vaqt" />
        </label>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button onClick={submit} disabled={busy || !valid} className="w-full sm:w-auto">
          {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />} Ro'yxatga olish
        </Button>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">Ro'yxat ({items.length})</h2>
        {loading && <div className="flex items-center gap-2 text-sm text-slate-500 p-4"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</div>}
        {!loading && !items.length && <Card className="p-8 text-center text-sm text-slate-500">Hozircha yozilmagan o'quvchi yo'q</Card>}
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
