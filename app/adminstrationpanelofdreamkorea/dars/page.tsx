"use client";
import { useEffect, useState } from "react";
import { darsRequest } from "@/lib/dars-client";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { speak } from "@/lib/tts";
import { Loader2, Trash2, Pencil, Plus, Volume2, ChevronDown, ChevronUp, BookOpen, Video, Headphones, PenLine, AlignLeft, Save, X } from "lucide-react";

type Kind = "vocab" | "video" | "grammar" | "listening" | "writing";
type Counts = { vocab: number; videos: number; grammars: number; listenings: number; writings: number };
type UnitListItem = { id: string; title: string; topic: string; level: string; order: number; description?: string | null; videos: { id: string; videoUrl: string }[]; _count: Counts };
type Item = {
  id: string;
  ko?: string; uz?: string; tr?: string; exampleKo?: string; exampleUz?: string;
  title?: string; videoUrl?: string; duration?: string;
  pattern?: string; explain?: string;
  examples?: { ko: string; uz: string }[];
  exercises?: { q: string; options: string[]; correct: number }[];
  audioUrl?: string; audioText?: string; transcript?: string;
  questions?: unknown[];
  prompt?: string; criteria?: string; sampleAnswer?: string;
};
type Detail = {
  title: string; topic: string; level: string; order: number; description?: string | null;
  vocab: Item[]; videos: Item[]; grammars: Item[]; listenings: Item[]; writings: Item[];
};

const MAX_VOCAB = 35;
type Draft = Record<string, string>;

function token(): string {
  try { return sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; } catch { return ""; }
}

async function api<T = unknown>(url: string, method: string, body?: unknown): Promise<T> {
  const r = await fetch(url, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${token()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "So‘rov bajarilmadi");
  return d as T;
}

// ---------- format <-> form ----------
function serExamples(arr: { ko: string; uz: string }[] | undefined): string {
  return (arr ?? []).map(e => `${e.ko} | ${e.uz}`).join("\n");
}
function parseExamples(s: string): { ko: string; uz: string }[] {
  return s.split("\n").map(l => l.trim()).filter(Boolean).map(l => {
    const [ko, ...rest] = l.split("|");
    return { ko: (ko ?? "").trim(), uz: rest.join("|").trim() };
  }).filter(e => e.ko && e.uz);
}
function serExercises(arr: { q: string; options: string[]; correct: number }[] | undefined): string {
  return (arr ?? []).map(e => `${e.q} | ${e.options.join(" | ")} | ${"ABCD"[e.correct] ?? "A"}`).join("\n");
}
function parseExercises(s: string): { q: string; options: string[]; correct: number; hint?: string }[] {
  return s.split("\n").map(l => l.trim()).filter(Boolean).map(l => {
    const parts = l.split("|").map(p => p.trim()).filter(Boolean);
    if (parts.length < 4) return null;
    const letter = (parts[parts.length - 1] ?? "A").toUpperCase();
    const q = parts[0] ?? "";
    const options = parts.slice(1, parts.length - 1);
    let correct = "ABCD".indexOf(letter);
    if (correct < 0 || correct >= options.length) correct = 0;
    return { q, options, correct };
  }).filter(Boolean) as { q: string; options: string[]; correct: number }[];
}
function serQuestions(arr: unknown): string {
  try { return JSON.stringify(Array.isArray(arr) ? arr : [], null, 2); } catch { return "[]"; }
}
function parseQuestions(s: string): unknown[] {
  const v = JSON.parse(s || "[]");
  if (!Array.isArray(v)) throw new Error("Savollar massiv bo‘lishi kerak");
  return v;
}

function emptyDraft(kind: Kind): Draft {
  switch (kind) {
    case "vocab": return { ko: "", uz: "", tr: "", exampleKo: "", exampleUz: "" };
    case "video": return { title: "", videoUrl: "", duration: "" };
    case "grammar": return { title: "", pattern: "", explain: "", examples: "", exercises: "" };
    case "listening": return { title: "", audioUrl: "", audioText: "", transcript: "", questions: serQuestions([]) };
    case "writing": return { title: "", prompt: "", criteria: "", sampleAnswer: "" };
  }
}

function draftFrom(kind: Kind, item: Item): Draft {
  const d = emptyDraft(kind);
  const src = item as Record<string, unknown>;
  for (const k of Object.keys(d)) { const v = src[k]; if (typeof v === "string") d[k] = v; }
  if (kind === "grammar") { d.examples = serExamples(item.examples); d.exercises = serExercises(item.exercises); }
  if (kind === "listening") d.questions = serQuestions(item.questions);
  return d;
}

function payloadFrom(kind: Kind, d: Draft): unknown {
  if (kind === "grammar") return { title: d.title, pattern: d.pattern, explain: d.explain, examples: parseExamples(d.examples), exercises: parseExercises(d.exercises) };
  if (kind === "listening") return { title: d.title, audioUrl: d.audioUrl, audioText: d.audioText, transcript: d.transcript, questions: parseQuestions(d.questions) };
  return { ...d };
}

// Har bir bo'limning nima uchun kerakligi — admin foydalanuvchisi uchun qisqa tushuntirish.
const SECTIONS: { kind: Kind; label: string; icon: typeof BookOpen; hint: string }[] = [
  { kind: "vocab", label: "d) So‘zlar (lug‘at)", icon: BookOpen, hint: "Unit lug‘ati: koreyscha so‘z, o‘zbekcha tarjima va transliteratsiya. Shu so‘zlar keyingi mashqlarda ham ishlatiladi." },
  { kind: "video", label: "a) Videolar", icon: Video, hint: "Dars videosi (YouTube yoki boshqa havola). Talaba uni ko‘rib, keyingi bo‘limga o‘tadi." },
  { kind: "grammar", label: "b) Grammatika", icon: AlignLeft, hint: "Qoida bo‘limi: shakl (pattern), tushuntirish, misollar va variantli mashqlar (A/B/C/D) — avto-baholanadi." },
  { kind: "listening", label: "c) Tinglash", icon: Headphones, hint: "Ovozli material: audio yoki TTS matni, transkript va savollar — talaba tinglab javob beradi." },
  { kind: "writing", label: "e) Yozish", icon: PenLine, hint: "Yozish topshirig‘i: vazifa (prompt), baholash mezonlari va namuna javob." },
];

function rowSummary(kind: Kind, item: Item, i: number): string {
  if (kind === "vocab") return `${i + 1}. ${item.ko ?? ""} (${item.tr ?? ""}) — ${item.uz ?? ""}`;
  if (kind === "video") return `${item.title ?? ""} — ${item.videoUrl ?? ""}`;
  if (kind === "grammar") return `${item.title ?? ""}${item.pattern ? ` · ${item.pattern}` : ""}`;
  if (kind === "listening") return `${item.title ?? ""} · ${Array.isArray(item.questions) ? item.questions.length : 0} savol`;
  return `${item.title ?? ""} — ${String(item.prompt ?? "").slice(0, 60)}`;
}

// ---------- bitta bo'lim editori (So'zlar / Video / Grammatika / ...) ----------
function SectionEditor({ unitId, kind, items, onChanged }: { unitId: string; kind: Kind; items: Item[]; onChanged: () => void }) {
  const meta = SECTIONS.find(s => s.kind === kind)!;
  const [mode, setMode] = useState<null | "add" | "edit">(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const Icon = meta.icon;
  const count = items.length;

  function set(k: string, v: string) { setDraft(d => ({ ...d, [k]: v })); }

  function openAdd() {
    if (kind === "vocab" && count >= MAX_VOCAB) { setErr(`Ko‘pi bilan ${MAX_VOCAB} ta so‘z`); return; }
    setDraft(emptyDraft(kind)); setEditId(null); setMode("add"); setErr("");
  }
  function openEdit(item: Item) { setDraft(draftFrom(kind, item)); setEditId(String(item.id)); setMode("edit"); setErr(""); }
  function close() { setMode(null); setEditId(null); setErr(""); }

  async function save() {
    setBusy(true); setErr("");
    try {
      const body = payloadFrom(kind, draft);
      if (mode === "edit" && editId) await api(`/api/dars/${unitId}/items`, "PATCH", { kind, itemId: editId, data: body });
      else await api(`/api/dars/${unitId}/items`, "POST", { kind, data: body });
      close(); onChanged();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  async function remove(id: string, name: string) {
    if (!confirm(`“${name}” o‘chirilsinmi?`)) return;
    setBusy(true); setErr("");
    try { await api(`/api/dars/${unitId}/items?kind=${kind}&itemId=${id}`, "DELETE"); if (editId === id) close(); onChanged(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  const f = (k: string) => ({ value: draft[k] ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value) });
  const linesHint = "Har bir qator: koreys | o‘zbek";

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold text-sm"><Icon className="h-4 w-4 text-blue-600" /> {meta.label}
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${kind === "vocab" && count >= MAX_VOCAB ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{count}{kind === "vocab" ? `/${MAX_VOCAB}` : ""}</span>
        </div>
        <div className="flex gap-1.5">
          {mode && <Button size="sm" variant="ghost" onClick={close}><X className="h-3.5 w-3.5" /></Button>}
          <Button size="sm" variant={mode === "add" ? "default" : "outline"} onClick={() => mode === "add" ? close() : openAdd()}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Qo‘shish
          </Button>
        </div>
      </div>

      <p className="-mt-1.5 text-xs text-slate-500 leading-relaxed">{meta.hint}</p>

      {mode && (
        <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
          <div className="text-xs font-semibold text-blue-700">{mode === "edit" ? "Tahrirlash" : "Yangi qo‘shish"}</div>
          {kind === "vocab" && (<>
            <div className="grid sm:grid-cols-2 gap-2">
              <Input placeholder="Koreys (ko‘) * 🇰🇷" {...f("ko")} />
              <Input placeholder="O‘zbekcha * — Assalomu alaykum" {...f("uz")} />
              <Input placeholder="Transliteration — annyeonghaseyo" {...f("tr")} />
              <Input placeholder="Misol (koreys) — 안녕하세요." {...f("exampleKo")} />
            </div>
            <Input placeholder="Misol tarjimasi — Assalomu alaykum." {...f("exampleUz")} />
          </>)}
          {kind === "video" && (<>
            <Input placeholder="Video nomi *" {...f("title")} />
            <Input placeholder="YouTube: https://youtu.be/… yoki https://…" {...f("videoUrl")} />
            <Input placeholder="Davomiyligi (ixtiyoriy) 12:30" {...f("duration")} />
          </>)}
          {kind === "grammar" && (<>
            <Input placeholder="Mavzu nomi * — 문법 1 · 입니다" {...f("title")} />
            <Input placeholder="Shakl (pattern) — Ot + 입니다" {...f("pattern")} />
            <Textarea rows={4} placeholder="Tushuntirish *" {...f("explain")} />
            <Textarea rows={3} placeholder={`Misol-lar:\n${linesHint}`} {...f("examples")} />
            <p className="text-[11px] text-slate-500 -mt-1">Misollar: har bir qator <b>koreys | o‘zbek</b></p>
            <Textarea rows={4} placeholder={"Mashqlar:\nSavol | variant1 | variant2 | variant3 | variant4 | A"} {...f("exercises")} />
            <p className="text-[11px] text-slate-500 -mt-1">Mashq: <b>savol | variantlar | to‘g‘ri javob (A/B/C/D)</b></p>
          </>)}
          {kind === "listening" && (<>
            <Input placeholder="Sarlavha * — 듣기 · Tanishuv dialogi" {...f("title")} />
            <Input placeholder="Audio URL (ixtiyoriy)" {...f("audioUrl")} />
            <Textarea rows={3} placeholder="TTS matni (audio yo‘q bo‘lsa ovozli o‘qiladi)" {...f("audioText")} />
            <Textarea rows={3} placeholder="Transkript (ixtiyoriy)" {...f("transcript")} />
            <Textarea rows={5} placeholder='Savollar JSON: [{"text":"…","options":[{"key":"A","text":"…"}],"correct":"A"}]' {...f("questions")} />
            <p className="text-[11px] text-slate-500 -mt-1">Savollar — JSON massiv (key: A/B/C…, correct — to‘g‘ri kalit)</p>
          </>)}
          {kind === "writing" && (<>
            <Input placeholder="Mavzu * — Yozish: Tanishuv" {...f("title")} />
            <Textarea rows={4} placeholder="Vazifa (prompt) *" {...f("prompt")} />
            <Textarea rows={2} placeholder="Baholash mezonlari (ixtiyoriy)" {...f("criteria")} />
            <Textarea rows={4} placeholder="Namuna javob (ixtiyoriy)" {...f("sampleAnswer")} />
          </>)}
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex gap-2">
            <Button size="sm" disabled={busy} onClick={save}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />} Saqlash</Button>
            <Button size="sm" variant="ghost" onClick={close}>Bekor</Button>
          </div>
        </div>
      )}

      {count === 0 && !mode && <p className="text-xs text-slate-400">Hali yo‘q — “Qo‘shish” bilan qo‘shing</p>}
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={String(item.id)} className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm ${editId === String(item.id) ? "border-blue-300 bg-blue-50" : ""}`}>
            <span className="min-w-0 flex-1 truncate" title={rowSummary(kind, item, i)}>{rowSummary(kind, item, i)}</span>
            {kind === "vocab" && <button onClick={() => speak(item.ko ?? "")} aria-label={`${item.ko ?? ""} talaffuzi`} className="text-blue-600 hover:text-blue-800 shrink-0"><Volume2 className="h-4 w-4" /></button>}
            <button onClick={() => openEdit(item)} aria-label="Tahrirlash" className="text-slate-500 hover:text-blue-600 shrink-0"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => remove(String(item.id), rowSummary(kind, item, i))} disabled={busy} aria-label="O‘chirish" className="text-slate-400 hover:text-red-600 shrink-0"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------- sahifa ----------
export default function AdminDarsPage() {
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, Detail>>({});
  const [meta, setMeta] = useState<Record<string, Draft>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  // yaratish formasi
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("TOPIK I");
  const [order, setOrder] = useState("");
  const [desc, setDesc] = useState("");
  const [creating, setCreating] = useState(false);

  async function refresh() {
    const d = await darsRequest<{ units: UnitListItem[] }>("/api/dars");
    const sorted = [...d.units].sort((a, b) => a.order - b.order);
    setUnits(sorted);
    return sorted;
  }

  useEffect(() => {
    queueMicrotask(() => { refresh().catch(e => setError((e as Error).message)); });
  }, []);

  // tartib raqami — bo'sh qoldirilsa, keyingi raqam avtomatik
  const nextOrder = order.trim() || String(units.length + 1);

  async function loadDetail(id: string) {
    const d = await api<Detail>(`/api/dars/${id}`, "GET");
    setDetail(prev => ({ ...prev, [id]: d }));
    setMeta(prev => ({ ...prev, [id]: { title: d.title, topic: d.topic, level: d.level, order: String(d.order), description: d.description ?? "" } }));
  }

  async function toggle(id: string) {
    setError("");
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!detail[id]) { try { await loadDetail(id); } catch (e) { setError((e as Error).message); } }
  }

  async function createUnit() {
    if (!title.trim() || !topic.trim()) { setError("Unit nomi va mavzusi kerak"); return; }
    setCreating(true); setError("");
    try {
      await darsRequest("/api/dars", { title: title.trim(), topic: topic.trim(), level, order: Number(nextOrder) || units.length + 1, description: desc.trim() || undefined });
      setTitle(""); setTopic(""); setDesc(""); setOrder("");
      await refresh();
    } catch (e) { setError((e as Error).message); } finally { setCreating(false); }
  }

  async function saveMeta(id: string) {
    const m = meta[id]; if (!m) return;
    setBusyId(id); setError("");
    try {
      await api(`/api/dars/${id}`, "PATCH", { title: m.title, topic: m.topic, level: m.level, order: Number(m.order) || 1, description: m.description });
      await Promise.all([refresh(), loadDetail(id)]);
    } catch (e) { setError((e as Error).message); } finally { setBusyId(null); }
  }

  async function removeUnit(id: string, name: string) {
    if (!confirm(`“${name}” uniti va barcha bo‘limlari o‘chirilsinmi?`)) return;
    setBusyId(id); setError("");
    try {
      await api(`/api/dars/${id}`, "DELETE");
      if (expanded === id) setExpanded(null);
      setDetail(prev => { const n = { ...prev }; delete n[id]; return n; });
      await refresh();
    } catch (e) { setError((e as Error).message); } finally { setBusyId(null); }
  }

  const setMetaField = (id: string, k: string, v: string) => setMeta(prev => ({ ...prev, [id]: { ...prev[id], [k]: v } }));

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Darslar · Unit boshqaruvi</h1>
        <p className="text-sm text-slate-500">Unit yaratish, tahrirlash va barcha bo‘limlarni (video, grammatika, tinglash, so‘zlar, yozish) to‘liq boshqarish.</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <Card className="space-y-3 p-5">
        <div className="font-semibold">Yangi unit</div>
        <div className="grid sm:grid-cols-2 gap-2">
          <Input placeholder="Unit nomi (mas: Salomlashish)" value={title} onChange={e => setTitle(e.target.value)} />
          <Input placeholder="Mavzu: 인사 · Salomlashish (koreys · o‘zbek)" value={topic} onChange={e => setTopic(e.target.value)} />
          <div className="flex gap-2">
            <select value={level} onChange={e => setLevel(e.target.value)} className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-sm"><option>TOPIK I</option><option>TOPIK II</option></select>
            <Input type="number" min={1} className="w-24" value={order} onChange={e => setOrder(e.target.value)} placeholder={nextOrder} />
          </div>
          <Button disabled={creating || !title.trim() || !topic.trim()} onClick={createUnit}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />} Unit yaratish
          </Button>
        </div>
        <Textarea placeholder="Tavsif (ixtiyoriy)" value={desc} onChange={e => setDesc(e.target.value)} />
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Unitlar ({units.length})</h2>
        {units.length === 0 && <Card className="p-6 text-center text-sm text-slate-500">Hali unit yo‘q — yuqoridan yarating yoki <a className="text-blue-600 underline" href="/adminstrationpanelofdreamkorea/content">Kontent</a> sahifasidan original darslarni nashr qiling.</Card>}
        {units.map(u => {
          const open = expanded === u.id;
          const c = u._count;
          const m = meta[u.id];
          const d = detail[u.id];
          const busy = busyId === u.id;
          return (
            <Card key={u.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate"><span className="text-blue-600">{u.order})</span> {u.topic || u.title}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">{u.level}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">So‘z {c.vocab}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">Video {c.videos}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">Grammatika {c.grammars}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">Tinglash {c.listenings}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">Yozish {c.writings}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => toggle(u.id)} aria-expanded={open}>
                    {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} Tahrirlash
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" disabled={busy} onClick={() => removeUnit(u.id, u.topic || u.title)}>O‘chirish</Button>
                </div>
              </div>

              {open && !d && <p className="text-sm text-slate-400">Yuklanmoqda…</p>}

              {open && d && m && (
                <div className="space-y-3 border-t pt-3">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-700">Unit ma’lumotlari</div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <Input value={m.title} onChange={e => setMetaField(u.id, "title", e.target.value)} placeholder="Nom (kortdagi ichki nom)" />
                      <Input value={m.topic} onChange={e => setMetaField(u.id, "topic", e.target.value)} placeholder="Mavzu: 인사 · Salomlashish" />
                      <select value={m.level} onChange={e => setMetaField(u.id, "level", e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm"><option>TOPIK I</option><option>TOPIK II</option></select>
                      <Input type="number" min={1} value={m.order} onChange={e => setMetaField(u.id, "order", e.target.value)} placeholder="Tartib" />
                    </div>
                    <Textarea rows={2} value={m.description} onChange={e => setMetaField(u.id, "description", e.target.value)} placeholder="Tavsif" />
                    <Button size="sm" disabled={busy} onClick={() => saveMeta(u.id)}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />} Ma’lumotni saqlash</Button>
                  </div>

                  {/* bo'limlar — tartib: a video, b grammatika, c tinglash, d so'zlar, e yozish */}
                  <SectionEditor unitId={u.id} kind="video" items={d.videos} onChanged={() => loadDetail(u.id).then(refresh).catch(() => {})} />
                  <SectionEditor unitId={u.id} kind="grammar" items={d.grammars} onChanged={() => loadDetail(u.id).then(refresh).catch(() => {})} />
                  <SectionEditor unitId={u.id} kind="listening" items={d.listenings} onChanged={() => loadDetail(u.id).then(refresh).catch(() => {})} />
                  <SectionEditor unitId={u.id} kind="vocab" items={d.vocab} onChanged={() => loadDetail(u.id).then(refresh).catch(() => {})} />
                  <SectionEditor unitId={u.id} kind="writing" items={d.writings} onChanged={() => loadDetail(u.id).then(refresh).catch(() => {})} />
                </div>
              )}
            </Card>
          );
        })}
      </section>
    </div>
  );
}
