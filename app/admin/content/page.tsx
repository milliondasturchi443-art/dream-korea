"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type ApiCourse = { id: string; title: string; subtitle: string; level: string; description: string; teacher: string; lessons: number; color: string };
type ApiCourseDetail = ApiCourse & { lessons: { id: string; order: number; title: string; duration: string }[] };
type TestDraft = { id: string; title: string; level: string; questions: { text: string; options: string; answer: string }[] };
type MaterialDraft = { id: string; title: string; kind: string; url?: string };
const KEY_T = "dk_admin_tests";
const KEY_M = "dk_admin_materials";

function authHeader(): Record<string, string> {
  try { const t = localStorage.getItem("dk_token"); return t ? { Authorization: `Bearer ${t}` } : {}; } catch { return {}; }
}
function load<T>(k: string, fallback: T): T { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fallback; } catch { return fallback; } }
function save(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

export default function AdminContentPage() {
  const [tab, setTab] = useState<"kurslar"|"testlar"|"materiallar">("kurslar");
  // Kurslar — endi БД dan
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [detail, setDetail] = useState<Record<string, ApiCourseDetail>>({});
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("A1");
  const [desc, setDesc] = useState("");
  // Testlar/Materiallar — localStorage (до отдельной таблицы)
  const [tests, setTests] = useState<TestDraft[]>([]);
  const [materials, setMaterials] = useState<MaterialDraft[]>([]);
  const [testTitle, setTestTitle] = useState("");
  const [testLevel, setTestLevel] = useState("TOPIK I");
  const [matTitle, setMatTitle] = useState("");
  const [matKind, setMatKind] = useState("PDF");
  const [matUrl, setMatUrl] = useState("");

  async function fetchCourses() {
    setCoursesLoading(true);
    try {
      const r = await fetch("/api/courses");
      const d = await r.json();
      if (r.ok && Array.isArray(d.courses)) setCourses(d.courses);
    } catch {}
    setCoursesLoading(false);
  }
  async function fetchDetail(id: string) {
    try {
      const r = await fetch(`/api/courses/${id}`);
      const d = await r.json();
      if (r.ok && d.id) setDetail(prev => ({ ...prev, [id]: d }));
    } catch {}
  }
  useEffect(() => {
    fetchCourses();
    setTests(load<TestDraft[]>(KEY_T, []));
    setMaterials(load<MaterialDraft[]>(KEY_M, []));
  }, []);

  async function addCourse() {
    if (!title.trim()) { toast.error("Kurs nomini kiriting"); return; }
    const h = authHeader();
    if (!h.Authorization) { toast.error("Avval admin sifatida kiring"); return; }
    try {
      const r = await fetch("/api/courses", { method: "POST", headers: { "Content-Type": "application/json", ...h }, body: JSON.stringify({ title: title.trim(), level: level.trim()||"A1", description: desc.trim(), subtitle: desc.trim().slice(0,60) }) });
      const d = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(d.error || "Xato");
      setTitle(""); setDesc(""); toast.success("Kurs qo‘shildi (bepul, БД ga saqlandi)"); fetchCourses();
    } catch (e) { toast.error(String((e as Error).message ?? e)); }
  }
  async function removeCourse(id: string) {
    const h = authHeader(); if (!h.Authorization) { toast.error("Admin kerak"); return; }
    if (!confirm("Kursni o‘chirasizmi? Darslari ham o‘chadi.")) return;
    try {
      const r = await fetch(`/api/courses/${encodeURIComponent(id)}`, { method: "DELETE", headers: h });
      const d = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(d.error || "Xato");
      toast.success("O‘chirildi"); fetchCourses(); setDetail(prev => { const c = { ...prev }; delete c[id]; return c; });
    } catch (e) { toast.error(String((e as Error).message ?? e)); }
  }
  async function addLesson(courseId: string) {
    const t = prompt("Dars nomi (mas: Hangul bilan tanishuv):"); if (!t) return;
    const d = prompt("Davomiyligi:", "15 daq") ?? "15 daq";
    const h = authHeader(); if (!h.Authorization) { toast.error("Admin kerak"); return; }
    try {
      const r = await fetch(`/api/courses/${encodeURIComponent(courseId)}/lessons`, { method: "POST", headers: { "Content-Type": "application/json", ...h }, body: JSON.stringify({ title: t.trim(), duration: d }) });
      const j = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(j.error || "Xato");
      toast.success("Dars qo‘shildi (ketma-ket ochiladi)"); fetchCourses(); fetchDetail(courseId);
    } catch (e) { toast.error(String((e as Error).message ?? e)); }
  }
  async function removeLesson(courseId: string, lessonId: string) {
    const h = authHeader(); if (!h.Authorization) { toast.error("Admin kerak"); return; }
    try {
      const r = await fetch(`/api/courses/${encodeURIComponent(courseId)}/lessons?lessonId=${encodeURIComponent(lessonId)}`, { method: "DELETE", headers: h });
      const j = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(j.error || "Xato");
      toast.success("Dars o‘chirildi"); fetchCourses(); fetchDetail(courseId);
    } catch (e) { toast.error(String((e as Error).message ?? e)); }
  }

  function addTest() {
    if (!testTitle.trim()) { toast.error("Test nomini kiriting"); return; }
    const t: TestDraft = { id: Date.now().toString(), title: testTitle.trim(), level: testLevel.trim()||"TOPIK I", questions: [] };
    const next = [...tests, t]; setTests(next); save(KEY_T, next); setTestTitle(""); toast.success("Test qo‘shildi (lokal)");
  }
  function addQuestion(tid: string) {
    const text = prompt("Savol matni:"); if (!text) return;
    const opts = prompt("Variantlar (vergul bilan):", "학생입니다., 요리사입니다., 선생님입니다., 회사원입니다.") ?? "";
    const ans = prompt("To‘g‘ri javob harfi:", "C") ?? "C";
    const next = tests.map(x => x.id===tid ? { ...x, questions: [...x.questions, { text: text.trim(), options: opts, answer: ans.trim().toUpperCase() }] } : x);
    setTests(next); save(KEY_T, next); toast.success("Savol qo‘shildi");
  }
  function addMaterial() {
    if (!matTitle.trim()) { toast.error("Sarlavhani kiriting"); return; }
    const m: MaterialDraft = { id: Date.now().toString(), title: matTitle.trim(), kind: matKind, url: matUrl.trim() || undefined };
    const next = [...materials, m]; setMaterials(next); save(KEY_M, next); setMatTitle(""); setMatUrl(""); toast.success("Material qo‘shildi");
  }

  return (
    <div className="mx-auto max-w-[980px] p-4 lg:p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-[22px] font-bold text-slate-900">Kontent</h1>
        <p className="text-sm text-slate-500">Kurslar endi <b>БД (MongoDB)</b> da — barcha talabalarda ko‘rinadi. Testlar/materiallar hozircha lokal, keyin ham БД ga o‘tadi. Barchasi bepul, darslar ketma-ket.</p>
      </motion.div>

      <div className="flex gap-1.5 p-1 rounded-full bg-slate-100 w-fit">
        {(["kurslar","testlar","materiallar"] as const).map(id => (
          <button key={id} onClick={()=>setTab(id)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab===id ? "bg-[#0f1b3d] text-white shadow" : "text-slate-600 hover:text-slate-900"}`}>{id==="kurslar"?"Kurslar":id==="testlar"?"Testlar":"Materiallar"}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab==="kurslar" && (
          <motion.div key="kurslar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-4">
            <Card className="p-4 space-y-3">
              <div className="font-semibold">Yangi kurs (bepul, БД) — faqat admin</div>
              <div className="grid sm:grid-cols-[1fr_140px_100px] gap-2">
                <Input placeholder="Kurs nomi" value={title} onChange={e=>setTitle(e.target.value)} />
                <Input placeholder="Daraja A1/TOPIK I" value={level} onChange={e=>setLevel(e.target.value)} />
                <Button onClick={addCourse}>Qo‘shish</Button>
              </div>
              <Textarea placeholder="Tavsif (ixtiyoriy)" value={desc} onChange={e=>setDesc(e.target.value)} />
              <p className="text-xs text-slate-400">Avval <b>/login → dreamkorea@adminstator.kr / ahd@123WHDI</b> bilan kiring, keyin qo‘shing — aks holda 403.</p>
            </Card>
            {coursesLoading ? <Card className="p-8 text-center text-sm text-slate-400">Yuklanmoqda…</Card> :
             courses.length===0 ? <Card className="p-8 text-center text-sm text-slate-500"><p className="font-medium">Hali kurs yo‘q</p><p className="text-xs mt-1">“Kontent yo‘q — administrator qo‘shadi” holati talabada ko‘rinadi.</p></Card> :
              <div className="space-y-3">
                {courses.map(c => {
                  const d = detail[c.id];
                  const lessons = d?.lessons ?? [];
                  return (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} layout>
                      <Card className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0"><div className="font-semibold text-slate-900 truncate">{c.title}</div><div className="flex gap-1.5 mt-1 flex-wrap"><Badge className="text-[11px]">{c.level}</Badge><Badge className="bg-emerald-50 text-emerald-700">Bepul</Badge><span className="text-xs text-slate-500 self-center">{c.lessons} dars</span></div>{c.subtitle && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.subtitle}</p>}</div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={()=> fetchDetail(c.id)}>Darslar</Button>
                            <Button variant="ghost" size="sm" onClick={()=>removeCourse(c.id)}>O‘chirish</Button>
                          </div>
                        </div>
                        {d ? (
                          <div className="mt-3 space-y-1.5">
                            {lessons.length===0 ? <p className="text-xs text-slate-400">Dars yo‘q — “+ Dars” bilan qo‘shing</p> : lessons.map(l=>(
                              <div key={l.id} className="flex items-center gap-2 text-sm rounded-xl bg-slate-50 border border-slate-200 p-2.5"><span className="h-6 w-6 rounded-full bg-white border border-slate-200 grid place-items-center text-xs font-bold shrink-0">{l.order}</span><span className="flex-1 min-w-0 truncate">{l.title}</span><span className="text-xs text-slate-500">{l.duration}</span>
                                <button onClick={()=>removeLesson(c.id, l.id)} className="text-xs text-red-600 hover:underline ml-1">×</button>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-xs text-slate-400 mt-2">“Darslar” ni bosing — БД dan keladi</p>}
                        <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={()=>addLesson(c.id)}>+ Dars</Button><span className="text-xs text-slate-400 self-center">ketma-ket ochiladi</span></div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            }
          </motion.div>
        )}
        {tab==="testlar" && (
          <motion.div key="testlar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-4">
            <Card className="p-4 space-y-3">
              <div className="font-semibold">Yangi test (lokal, keyin БД)</div>
              <div className="grid sm:grid-cols-[1fr_140px_100px] gap-2"><Input placeholder="Test nomi (mas: TOPIK I — Reading)" value={testTitle} onChange={e=>setTestTitle(e.target.value)} /><Input placeholder="Daraja" value={testLevel} onChange={e=>setTestLevel(e.target.value)} /><Button onClick={addTest}>Qo‘shish</Button></div>
            </Card>
            <div className="space-y-3">
              {tests.length===0 ? <Card className="p-8 text-center text-sm text-slate-500">Hali test yo‘q — TOPIK esash /topik da seed TOPIK I bor</Card> :
                tests.map(t => (
                  <Card key={t.id} className="p-4">
                    <div className="flex items-start justify-between gap-3"><div className="flex-1 min-w-0"><div className="font-semibold">{t.title}</div><Badge className="text-[11px] mt-1">{t.level}</Badge> · <span className="text-xs text-slate-500">{t.questions.length} savol</span></div><Button variant="ghost" size="sm" onClick={()=>{ const n=tests.filter(x=>x.id!==t.id); setTests(n); save(KEY_T,n); toast.success("O‘chirildi"); }}>O‘chirish</Button></div>
                    <div className="mt-3 space-y-1.5">{t.questions.length===0 ? <p className="text-xs text-slate-400">Savol yo‘q</p> : t.questions.map((q,i)=><div key={i} className="rounded-xl bg-slate-50 border p-2.5 text-sm"><div className="font-medium">{i+1}. {q.text}</div><div className="text-xs text-slate-600 mt-1 truncate">Variantlar: {q.options}</div><div className="text-xs text-emerald-700 mt-1">Javob: {q.answer}</div><button onClick={()=>{ const n=tests.map(x=>x.id===t.id?{...x, questions:x.questions.filter((_,k)=>k!==i)}:x); setTests(n); save(KEY_T,n); }} className="text-xs text-red-600">o‘chirish</button></div>)}</div>
                    <Button size="sm" variant="outline" className="mt-3" onClick={()=>addQuestion(t.id)}>+ Savol</Button>
                  </Card>
                ))}
            </div>
          </motion.div>
        )}
        {tab==="materiallar" && (
          <motion.div key="materiallar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-4">
            <Card className="p-4 space-y-3">
              <div className="font-semibold">Yangi material (faqat admin)</div>
              <div className="grid sm:grid-cols-[1fr_120px_100px] gap-2"><Input placeholder="Sarlavha (mas: Hangul qo‘llanma PDF)" value={matTitle} onChange={e=>setMatTitle(e.target.value)} /><Input placeholder="Turi PDF/Audio" value={matKind} onChange={e=>setMatKind(e.target.value)} /><Button onClick={addMaterial}>Qo‘shish</Button></div>
              <Input placeholder="Havola / URL (ixtiyoriy)" value={matUrl} onChange={e=>setMatUrl(e.target.value)} />
            </Card>
            <div className="space-y-2">{materials.length===0 ? <Card className="p-8 text-center text-sm text-slate-500">Hali material yo‘q</Card> : materials.map(m => (
              <Card key={m.id} className="p-4 flex items-start justify-between gap-3"><div className="flex-1 min-w-0"><div className="font-medium text-sm">{m.title}</div><div className="text-xs text-slate-500 mt-1 flex gap-1.5 flex-wrap"><Badge className="text-[11px]">{m.kind}</Badge>{m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-[#2563eb] underline truncate">{m.url}</a>}</div></div><Button variant="ghost" size="sm" onClick={()=>{ const n=materials.filter(x=>x.id!==m.id); setMaterials(n); save(KEY_M,n); toast.success("O‘chirildi"); }}>O‘chirish</Button></Card>
            ))}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <Card className="p-4 bg-blue-50 border-blue-200"><div className="font-semibold text-sm text-blue-900">Qanday ko‘rinadi talabaga?</div><p className="text-xs text-blue-800 mt-1 leading-relaxed">Kurs bo‘sh bo‘lsa — “Bo‘sh holat · kontentni administrator qo‘shadi” (demo yo‘q). Dars ketma-ket: oldingisi tugamasa, keyingisi qulflangan. Testlar /topik da ham БД, materiallar shu yerda bepul boshqariladi.</p></Card>
    </div>
  );
}
