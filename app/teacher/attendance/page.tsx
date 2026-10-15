"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X, Save, History, Bell, Users, CalendarDays, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type Group = { id: string; name: string; members: { user: { id: string; name: string; email: string } }[] };
type Mark = "PRESENT" | "ABSENT";
type HistRow = { id: string; date: string; studentId: string; status: string; student?: { name: string } };

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()}-${MONTHS[d.getMonth()]}, ${WEEKDAYS[d.getDay()]}`;
}
function authHeader(): Record<string, string> { try { const t = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; return t ? { Authorization: `Bearer ${t}` } : {}; } catch { return {}; } }

export default function TeacherAttendancePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [savedMarks, setSavedMarks] = useState<Record<string, Mark>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<HistRow[]>([]);

  useEffect(() => {
    fetch("/api/groups", { headers: authHeader() }).then(r => r.json()).then(d => {
      const gs = Array.isArray(d.groups) ? d.groups : [];
      setGroups(gs);
      if (gs[0]?.id) setGroupId(gs[0].id);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const group = groups.find(g => g.id === groupId) || null;

  function loadHistory(gid: string) {
    fetch(`/api/attendance?groupId=${encodeURIComponent(gid)}`, { headers: authHeader() })
      .then(r => r.json()).then(dd => setHistory(Array.isArray(dd.rows) ? dd.rows : [])).catch(() => {});
  }

  useEffect(() => {
    if (!groupId || !date) return;
    fetch(`/api/attendance?groupId=${encodeURIComponent(groupId)}&date=${encodeURIComponent(date)}`, { headers: authHeader() })
      .then(r => r.json()).then(d => {
        const rows: HistRow[] = Array.isArray(d.rows) ? d.rows : [];
        const m: Record<string, Mark> = {};
        rows.forEach(rw => { m[rw.studentId] = rw.status === "ABSENT" ? "ABSENT" : "PRESENT"; });
        setMarks(m);
        setSavedMarks(m);
        loadHistory(groupId);
      }).catch(() => {});
  }, [groupId, date]);

  function setStatus(id: string, st: Mark) {
    setMarks(prev => ({ ...prev, [id]: st }));
  }
  function markAllPresent() {
    if (!group) return;
    const m: Record<string, Mark> = {};
    group.members.forEach(mem => { m[mem.user.id] = "PRESENT"; });
    setMarks(m);
  }

  const presentCount = group ? group.members.filter(m => (marks[m.user.id] || "PRESENT") === "PRESENT").length : 0;
  const absentCount = group ? group.members.length - presentCount : 0;
  const dirty = !!group && group.members.some(m => (marks[m.user.id] || "PRESENT") !== (savedMarks[m.user.id] || "PRESENT"));
  const dateSaved = history.some(h => h.date === date);

  async function save() {
    if (!group || !groupId) { toast.error("Guruh tanlang"); return; }
    const payload = group.members.map(m => ({ studentId: m.user.id, status: marks[m.user.id] || "PRESENT" }));
    setSaving(true);
    try {
      const r = await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json", ...authHeader() }, body: JSON.stringify({ groupId, date, marks: payload }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Saqlab bo'lmadi");
      const saved: Record<string, Mark> = {};
      group.members.forEach(m => { saved[m.user.id] = marks[m.user.id] || "PRESENT"; });
      setSavedMarks(saved);
      loadHistory(groupId);
      toast.success(absentCount > 0 ? `Saqlandi — ${absentCount} nafar o'quvchiga ogohlantirish yuborildi` : "Davomat saqlandi — barchasi keldi");
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  }

  if (loading) return <div className="mx-auto max-w-[1100px] p-4 lg:p-6 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</div>;
  if (groups.length === 0) return <div className="mx-auto max-w-[1100px] p-4 lg:p-6"><Card className="p-6 text-sm text-slate-500">Sizga hali guruh biriktirilmagan — admin “Guruhlar” bo‘limida sizni tayinlaydi.</Card></div>;

  // Tarixni sanalar bo'yicha guruhlash (oxirgi 7 sana)
  const byDate = new Map<string, HistRow[]>();
  history.forEach(h => { const arr = byDate.get(h.date) || []; arr.push(h); byDate.set(h.date, arr); });
  const histDates = [...byDate.keys()].sort().reverse().slice(0, 7);

  return (
    <div className="mx-auto max-w-[900px] p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2"><CalendarDays className="h-6 w-6 text-blue-600" /> Davomat belgilash</h1>
        <p className="text-sm text-slate-500 mt-1">O‘quvchi qarshisidagi tugmani bosing — keldi yoki kelmadi. Keyin «Saqlash»ni bosing: yo‘q deb belgilanganlarga ogohlantirish ketadi.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-500">Guruh</span>
            <select value={groupId} onChange={e => setGroupId(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm min-w-[200px]">
              {groups.map(g => <option key={g.id} value={g.id}>{g.name} — {g.members.length} nafar</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-500">Sana</span>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-[160px]" />
          </label>
          <Button variant="outline" size="sm" onClick={() => setDate(new Date().toISOString().slice(0, 10))} className="h-10"><RotateCcw className="mr-1 h-3.5 w-3.5" />Bugun</Button>
          <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
            <Users className="h-4 w-4 text-slate-400" />
            {fmtDate(date)}
            {dateSaved && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">saqlangan</span>}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold text-sm">{group?.name}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">{presentCount} keldi</span>
            <span className="rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700">{absentCount} kelmadi</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">jami {group?.members.length ?? 0}</span>
            <button onClick={markAllPresent} className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 hover:bg-slate-50">Hammasi keldi</button>
            {dirty && <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">saqlanmagan o‘zgarishlar</span>}
          </div>
        </div>

        {!group?.members.length && <p className="mt-4 text-sm text-slate-500">Bu guruhda hozircha o‘quvchi yo‘q.</p>}
        <div className="mt-3 grid gap-2">
          {group?.members.map((m, i) => {
            const st = marks[m.user.id] || "PRESENT";
            const isAbsent = st === "ABSENT";
            return (
              <div key={m.user.id} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${isAbsent ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900"><span className="mr-1 text-slate-400">{i + 1}.</span>{m.user.name}</div>
                  <div className="ml-5 text-xs text-slate-500">{m.user.email}</div>
                  {isAbsent && <div className="ml-5 mt-0.5 flex items-center gap-1 text-xs text-red-600"><Bell className="h-3 w-3" /> saqlashdan keyin ogohlantirish ketadi</div>}
                </div>
                <div className="flex shrink-0 rounded-full border border-slate-200 bg-white p-1" role="group" aria-label={`${m.user.name} davomati`}>
                  <button aria-pressed={!isAbsent} onClick={() => setStatus(m.user.id, "PRESENT")} className={`flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold ${!isAbsent ? "bg-emerald-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}><Check className="h-3.5 w-3.5" />Keldi</button>
                  <button aria-pressed={isAbsent} onClick={() => setStatus(m.user.id, "ABSENT")} className={`flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold ${isAbsent ? "bg-red-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}><X className="h-3.5 w-3.5" />Kelmadi</button>
                </div>
              </div>
            );
          })}
        </div>
        <Button onClick={save} disabled={saving || !group?.members.length} className="mt-4 w-full"><Save className="h-4 w-4 mr-1" />{saving ? "Saqlanmoqda…" : "Saqlash"}</Button>
        <p className="mt-2 text-xs text-slate-500">Avval hamma “keldi” deb hisoblanadi — faqat kelmay qolganlarni “Kelmadi” qiling, shuning yetadi.</p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4" /> Tarix — oxirgi kunlar</div>
        {histDates.length === 0 ? <p className="mt-2 text-xs text-slate-400">Hali davomat belgilanmagan</p> : (
          <div className="mt-3 space-y-3">
            {histDates.map(d => {
              const rows = byDate.get(d)!;
              const abs = rows.filter(r => r.status === "ABSENT");
              const pres = rows.length - abs.length;
              return (
                <div key={d} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-slate-800">{fmtDate(d)} {d === date && <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700">hozir tanlangan</span>}</span>
                    <span className="text-xs text-slate-500">{pres} keldi · {abs.length} kelmadi</span>
                  </div>
                  {abs.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {abs.map(r => <span key={r.id} className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">{r.student?.name ?? r.studentId.slice(-6)}</span>)}
                    </div>
                  ) : <div className="mt-1.5 text-xs font-medium text-emerald-700">Barchasi keldi ✓</div>}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
