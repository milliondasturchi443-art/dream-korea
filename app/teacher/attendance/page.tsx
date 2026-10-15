"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X, Save, History, Bell, Users, CalendarDays, RotateCcw, ChevronLeft, ChevronRight, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

type Group = { id: string; name: string; members: { user: { id: string; name: string; email: string } }[] };
type Mark = "PRESENT" | "ABSENT";
type HistRow = { id: string; date: string; studentId: string; status: string; student?: { name: string } };
type WeekMap = Record<string, Record<string, Mark>>;
type Mode = "kunlik" | "haftalik";

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const DAY_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseIso(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDaysIso(s: string, n: number) {
  const d = parseIso(s);
  d.setDate(d.getDate() + n);
  return toIso(d);
}
function mondayOf(s: string) {
  const d = parseIso(s);
  const wd = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - wd);
  return toIso(d);
}
function fmtDate(iso: string) {
  const d = parseIso(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()}-${MONTHS[d.getMonth()]}, ${WEEKDAYS[d.getDay()]}`;
}
function fmtShort(iso: string) {
  const d = parseIso(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function authHeader(): Record<string, string> { try { const t = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; return t ? { Authorization: `Bearer ${t}` } : {}; } catch { return {}; } }

export default function TeacherAttendancePage() {
  const [mode, setMode] = useState<Mode>("kunlik");
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [date, setDate] = useState(todayIso);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [savedMarks, setSavedMarks] = useState<Record<string, Mark>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<HistRow[]>([]);

  // Haftalik
  const [weekStart, setWeekStart] = useState(() => mondayOf(todayIso()));
  const [weekMap, setWeekMap] = useState<WeekMap>({});
  const [weekLoading, setWeekLoading] = useState(false);
  const [cellBusy, setCellBusy] = useState("");

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

  useEffect(() => {
    if (!groupId || !weekStart) return;
    const to = addDaysIso(weekStart, 6);
    fetch(`/api/attendance?groupId=${encodeURIComponent(groupId)}&from=${weekStart}&to=${to}`, { headers: authHeader() })
      .then(r => r.json()).then(d => {
        const m: WeekMap = {};
        const rows: HistRow[] = Array.isArray(d.rows) ? d.rows : [];
        rows.forEach(rw => {
          if (!m[rw.date]) m[rw.date] = {};
          m[rw.date][rw.studentId] = rw.status === "ABSENT" ? "ABSENT" : "PRESENT";
        });
        setWeekMap(m);
      }).catch(() => {}).finally(() => setWeekLoading(false));
    queueMicrotask(() => setWeekLoading(true));
  }, [groupId, weekStart]);

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
      toast.success(absentCount > 0 ? `Saqlandi — ${absentCount} nafar o‘quvchiga ogohlantirish yuborildi` : "Davomat saqlandi — barchasi keldi");
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  }

  // Haftalik jadval: yacheykani bosib holatni almashtirish (mavjud POST orqali, dublikat yo'q)
  async function toggleCell(studentId: string, day: string) {
    if (!groupId || cellBusy) return;
    const cur = weekMap[day]?.[studentId];
    const next: Mark = cur === "PRESENT" ? "ABSENT" : "PRESENT";
    const prevDay = { ...(weekMap[day] || {}) };
    setCellBusy(studentId + day);
    setWeekMap(prev => ({ ...prev, [day]: { ...(prev[day] || {}), [studentId]: next } }));
    try {
      const r = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ groupId, date: day, marks: [{ studentId, status: next }] }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Saqlab bo‘lmadi");
      loadHistory(groupId);
    } catch (e) {
      setWeekMap(prev => {
        const day2 = { ...(prev[day] || {}) };
        if (prevDay[studentId]) day2[studentId] = prevDay[studentId]; else delete day2[studentId];
        return { ...prev, [day]: day2 };
      });
      toast.error((e as Error).message);
    } finally { setCellBusy(""); }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysIso(weekStart, i));
  const today = todayIso();
  let wkPresent = 0, wkAbsent = 0;
  Object.values(weekMap).forEach(day => Object.values(day).forEach(s => { if (s === "PRESENT") wkPresent++; else wkAbsent++; }));
  const wkPct = wkPresent + wkAbsent > 0 ? Math.round((wkPresent / (wkPresent + wkAbsent)) * 100) : null;
  const weekLabel = `${fmtShort(weekStart)} – ${fmtShort(addDaysIso(weekStart, 6))}.${parseIso(addDaysIso(weekStart, 6)).getFullYear()}`;

  if (loading) return <div className="mx-auto max-w-[1100px] p-4 lg:p-6 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</div>;
  if (groups.length === 0) return <div className="mx-auto max-w-[1100px] p-4 lg:p-6"><Card className="p-6 text-sm text-slate-500">Sizga hali guruh biriktirilmagan — admin “Guruhlar” bo‘limida sizni tayinlaydi.</Card></div>;

  // Tarixni sanalar bo'yicha guruhlash (oxirgi 7 sana)
  const byDate = new Map<string, HistRow[]>();
  history.forEach(h => { const arr = byDate.get(h.date) || []; arr.push(h); byDate.set(h.date, arr); });
  const histDates = [...byDate.keys()].sort().reverse().slice(0, 7);

  const modeBtn = (mk: Mode, label: string) => (
    <button
      onClick={() => setMode(mk)}
      aria-pressed={mode === mk}
      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${mode === mk ? "bg-[#2563eb] text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
    >
      {mk === "kunlik" ? <CalendarDays className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}{label}
    </button>
  );

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2"><CalendarDays className="h-6 w-6 text-blue-600" /> Davomat</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kunlik yoki haftalik jadvalda davomat belgilang.</p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {modeBtn("kunlik", "Kunlik")}
          {modeBtn("haftalik", "Haftalik")}
        </div>
      </div>

      {/* Guruh — ikkala rejim uchun umumiy */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-500">Guruh</span>
            <select value={groupId} onChange={e => setGroupId(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm min-w-[200px]">
              {groups.map(g => <option key={g.id} value={g.id}>{g.name} — {g.members.length} nafar</option>)}
            </select>
          </label>
          <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="font-medium">{group?.name}</span>
            <span className="text-xs text-slate-400">({group?.members.length ?? 0} nafar)</span>
          </div>
        </div>
      </Card>

      {mode === "kunlik" && (
        <>
          <Card className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-500">Sana</span>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 w-[160px]" />
              </label>
              <Button variant="outline" size="sm" onClick={() => setDate(todayIso())} className="h-9"><RotateCcw className="mr-1 h-3.5 w-3.5" />Bugun</Button>
              <div className="text-sm text-slate-600">{fmtDate(date)}</div>
              {dateSaved && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">saqlangan</span>}
              <div className="ml-auto flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">{presentCount} keldi</span>
                <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-700">{absentCount} kelmadi</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">jami {group?.members.length ?? 0}</span>
                <button onClick={markAllPresent} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50">Hammasi keldi</button>
                {dirty && <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">saqlanmagan</span>}
              </div>
            </div>
          </Card>

          <Card className="p-3">
            {!group?.members.length && <p className="mb-2 text-sm text-slate-500">Bu guruhda hozircha o‘quvchi yo‘q.</p>}
            <div className="grid gap-1.5">
              {group?.members.map((m, i) => {
                const st = marks[m.user.id] || "PRESENT";
                const isAbsent = st === "ABSENT";
                return (
                  <div key={m.user.id} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${isAbsent ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900"><span className="mr-1 text-slate-400">{i + 1}.</span>{m.user.name}</div>
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
            <Button onClick={save} disabled={saving || !group?.members.length} className="mt-3 w-full"><Save className="h-4 w-4 mr-1" />{saving ? "Saqlanmoqda…" : "Saqlash"}</Button>
            <p className="mt-2 text-xs text-slate-500">Avval hamma “keldi” deb hisoblanadi — faqat kelmay qolganlarni “Kelmadi” qiling, shuning yetadi.</p>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4" /> Tarix — oxirgi kunlar</div>
            {histDates.length === 0 ? <p className="mt-2 text-xs text-slate-400">Hali davomat belgilanmagan</p> : (
              <div className="mt-2 space-y-2">
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
        </>
      )}

      {mode === "haftalik" && (
        <>
          <Card className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setWeekStart(addDaysIso(weekStart, -7))} aria-label="Oldingi hafta" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button>
              <div className="min-w-[170px] text-center">
                <div className="text-sm font-bold text-slate-900">{weekLabel}</div>
                <div className="text-[11px] text-slate-400">hafta</div>
              </div>
              <button onClick={() => setWeekStart(addDaysIso(weekStart, 7))} aria-label="Keyingi hafta" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><ChevronRight className="h-4 w-4" /></button>
              <Button variant="outline" size="sm" onClick={() => setWeekStart(mondayOf(today))} className="h-9"><RotateCcw className="mr-1 h-3.5 w-3.5" />Bugun</Button>

              <div className="ml-auto flex flex-wrap items-center gap-1.5 text-xs">
                {weekLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">{wkPresent} keldi</span>
                <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-700">{wkAbsent} kelmadi</span>
                {wkPct !== null && <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">{wkPct}%</span>}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-emerald-500" aria-hidden />Keldi</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-500" aria-hidden />Kelmadi</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-slate-300" aria-hidden />Belgilanmagan</span>
              <span className="text-slate-400">— yacheykani bosib holatni almashtiring</span>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            {!group?.members.length ? (
              <p className="p-4 text-sm text-slate-500">Bu guruhda hozircha o‘quvchi yo‘q.</p>
            ) : (
              <div className="overflow-auto" style={{ maxHeight: "62vh" }}>
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className="sticky left-0 top-0 z-20 min-w-[150px] border-b border-r border-slate-200 bg-white px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">O‘quvchi</th>
                      {weekDays.map((d, i) => {
                        const dt = parseIso(d);
                        const isToday = d === today;
                        return (
                          <th key={d} scope="col" className={`sticky top-0 z-10 min-w-[46px] border-b border-slate-200 px-1 py-1.5 text-center ${isToday ? "bg-blue-50" : "bg-white"}`}>
                            <div className={`text-[11px] font-semibold ${isToday ? "text-blue-700" : "text-slate-400"}`}>{DAY_SHORT[i]}</div>
                            <div className={`text-[13px] font-bold ${isToday ? "text-blue-700" : "text-slate-700"}`}>{dt.getDate()}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {group.members.map((m, i) => (
                      <tr key={m.user.id} className="hover:bg-slate-50/70">
                        <th scope="row" className={`sticky left-0 z-10 max-w-[180px] border-b border-r border-slate-200 px-3 py-1 text-left text-[13px] font-medium text-slate-800 ${i % 2 ? "bg-slate-50/80" : "bg-white"}`}>
                          <span className="block truncate" title={m.user.name}>{m.user.name}</span>
                        </th>
                        {weekDays.map(d => {
                          const st = weekMap[d]?.[m.user.id];
                          const isToday = d === today;
                          const isFuture = d > today;
                          const busy = cellBusy === m.user.id + d;
                          const label = st === "PRESENT" ? "Keldi" : st === "ABSENT" ? "Kelmadi" : "Belgilanmagan";
                          return (
                            <td key={d} className={`border-b border-slate-100 p-0.5 ${isToday ? "bg-blue-50/50" : ""}`}>
                              <button
                                onClick={() => toggleCell(m.user.id, d)}
                                disabled={busy || isFuture}
                                title={`${m.user.name} · ${fmtDate(d)} · ${label}${isFuture ? " (kelajakdagi sana)" : ""}`}
                                aria-label={`${m.user.name}, ${fmtDate(d)}: ${label}`}
                                className={`grid h-9 w-full min-w-[42px] place-items-center rounded-lg text-xs font-bold transition-colors ${
                                  st === "PRESENT" ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                  : st === "ABSENT" ? "bg-red-500 text-white hover:bg-red-600"
                                  : isFuture ? "bg-slate-50 text-slate-300"
                                  : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                                }`}
                              >
                                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : st === "PRESENT" ? <Check className="h-4 w-4" /> : st === "ABSENT" ? <X className="h-4 w-4" /> : "–"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <p className="text-xs text-slate-500">Keldi (✓) — yashil, Kelmadi (✗) — qizil, belgilanmagan — kulrang. Kelmadi belgilansa, o‘quvchiga ogohlantirish yuboriladi.</p>
        </>
      )}
    </div>
  );
}
