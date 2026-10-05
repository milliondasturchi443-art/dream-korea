"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type LessonDraft = { title: string; duration: string };
type CourseDraft = { id: string; title: string; level: string; desc?: string; lessons: LessonDraft[] };
type TestDraft = { id: string; title: string; level: string; questions: { text: string; options: string; answer: string }[] };
type MaterialDraft = { id: string; title: string; kind: string; url?: string };

const KEY_C = "dk_admin_courses";
const KEY_T = "dk_admin_tests";
const KEY_M = "dk_admin_materials";

function load<T>(k: string, fallback: T): T {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function save(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

export default function AdminContentPage() {
  const [tab, setTab] = useState<"kurslar"|"testlar"|"materiallar">("kurslar");
  const [courses, setCourses] = useState<CourseDraft[]>([]);
  const [tests, setTests] = useState<TestDraft[]>([]);
  const [materials, setMaterials] = useState<MaterialDraft[]>([]);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("A1");
  const [desc, setDesc] = useState("");
  const [testTitle, setTestTitle] = useState("");
  const [testLevel, setTestLevel] = useState("TOPIK I");
  const [matTitle, setMatTitle] = useState("");
  const [matKind, setMatKind] = useState("PDF");
  const [matUrl, setMatUrl] = useState("");

  useEffect(() => {
    setCourses(load<CourseDraft[]>(KEY_C, []));
    setTests(load<TestDraft[]>(KEY_T, []));
    setMaterials(load<MaterialDraft[]>(KEY_M, []));
  }, []);

  function addCourse() {
    if (!title.trim()) { toast.error("Kurs nomini kiriting"); return; }
    const c: CourseDraft = { id: Date.now().toString(), title: title.trim(), level: level.trim()||"A1", desc: desc.trim(), lessons: [] };
    const next = [...courses, c]; setCourses(next); save(KEY_C, next);
    setTitle(""); setDesc("");
    toast.success("Kurs qo‘shildi (bepul)");
  }
  function addLesson(cid: string) {
    const t = prompt("Dars nomi (mas: Hangul bilan tanishuv):"); if (!t) return;
    const d = prompt("Davomiyligi (mas: 18 daq):", "15 daq") ?? "15 daq";
    const next = courses.map(c => c.id===cid ? { ...c, lessons: [...c.lessons, { title: t.trim(), duration: d }] } : c);
    setCourses(next); save(KEY_C, next); toast.success("Dars qo‘shildi");
  }
  function addTest() {
    if (!testTitle.trim()) { toast.error("Test nomini kiriting"); return; }
    const t: TestDraft = { id: Date.now().toString(), title: testTitle.trim(), level: testLevel.trim()||"TOPIK I", questions: [] };
    const next = [...tests, t]; setTests(next); save(KEY_T, next);
    setTestTitle(""); toast.success("Test qo‘shildi");
  }
  function addQuestion(tid: string) {
    const text = prompt("Savol matni:"); if (!text) return;
    const opts = prompt("Variantlar (vergul bilan, mas: A) 학생입니다., B) 요리사입니다., C) ...):", "학생입니다., 요리사입니다., 선생님입니다., 회사원입니다.") ?? "";
    const ans = prompt("To‘g‘ri javob harfi (mas: C):", "C") ?? "C";
    const next = tests.map(x => x.id===tid ? { ...x, questions: [...x.questions, { text: text.trim(), options: opts, answer: ans.trim().toUpperCase() }] } : x);
    setTests(next); save(KEY_T, next); toast.success("Savol qo‘shildi");
  }
  function addMaterial() {
    if (!matTitle.trim()) { toast.error("Sarlavhani kiriting"); return; }
    const m: MaterialDraft = { id: Date.now().toString(), title: matTitle.trim(), kind: matKind, url: matUrl.trim() || undefined };
    const next = [...materials, m]; setMaterials(next); save(KEY_M, next);
    setMatTitle(""); setMatUrl(""); toast.success("Material qo‘shildi");
  }

  return (
    <div className="mx-auto max-w-[980px] p-4 lg:p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-[22px] font-bold text-slate-900">Kontent</h1>
        <p className="text-sm text-slate-500">Faqat admin qo‘shadi · barcha kurslar bepul · darslar ketma-ket ochiladi · testlar/materiallar shu yerdan boshqariladi.</p>
      </motion.div>

      <div className="flex gap-1.5 p-1 rounded-full bg-slate-100 w-fit">
        {[
          ["kurslar","Kurslar"] as const,
          ["testlar","Testlar"] as const,
          ["materiallar","Materiallar"] as const,
        ].map(([id, label]) => (
          <button key={id} onClick={()=>setTab(id)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab===id ? "bg-[#0f1b3d] text-white shadow" : "text-slate-600 hover:text-slate-900"}`}>{label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab==="kurslar" && (
          <motion.div key="kurslar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-4">
            <Card className="p-4 space-y-3">
              <div className="font-semibold">Yangi kurs (bepul) — faqat admin qo‘shadi</div>
              <div className="grid sm:grid-cols-[1fr_140px_100px] gap-2">
                <Input placeholder="Kurs nomi" value={title} onChange={e=>setTitle(e.target.value)} />
                <Input placeholder="Daraja A1/TOPIK I" value={level} onChange={e=>setLevel(e.target.value)} />
                <Button onClick={addCourse}>Qo‘shish</Button>
              </div>
              <Textarea placeholder="Tavsif (ixtiyoriy)" value={desc} onChange={e=>setDesc(e.target.value)} />
              <p className="text-xs text-slate-400">Narx yo‘q — barcha kurslar bepul. Keyingi dars faqat oldingisini tugatgach ochiladi.</p>
            </Card>
            <div className="space-y-3">
              {courses.length===0 ? <Card className="p-8 text-center text-sm text-slate-500"><p className="font-medium">Hali kurs yo‘q</p><p className="text-xs mt-1">Adminda bo‘sh holatda talabalar “Kontent yo‘q — administrator qo‘shadi” holatini ko‘radi.</p></Card> :
                courses.map(c => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} layout>
                    <Card className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0"><div className="font-semibold text-slate-900 truncate">{c.title}</div><div className="flex gap-1.5 mt-1"><Badge className="text-[11px]">{c.level}</Badge><Badge className="bg-emerald-50 text-emerald-700">Bepul</Badge></div>{c.desc && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.desc}</p>}</div>
                        <Button variant="ghost" size="sm" onClick={()=>{ const n=courses.filter(x=>x.id!==c.id); setCourses(n); save(KEY_C,n); toast.success("O‘chirildi"); }}>O‘chirish</Button>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        {c.lessons.length===0 ? <p className="text-xs text-slate-400">Dars yo‘q — “+ Dars” bilan qo‘shing</p> : c.lessons.map((l,i)=>
                          <div key={i} className="flex items-center gap-2 text-sm rounded-xl bg-slate-50 border border-slate-200 p-2.5"><span className="h-6 w-6 rounded-full bg-white border border-slate-200 grid place-items-center text-xs font-bold">{i+1}</span><span className="flex-1 min-w-0 truncate">{l.title}</span><span className="text-xs text-slate-500">{l.duration}</span>
                            <button onClick={()=>{ const n=courses.map(x=>x.id===c.id?{...x, lessons:x.lessons.filter((_,k)=>k!==i)}:x); setCourses(n); save(KEY_C,n); toast.success("Dars o‘chirildi"); }} className="text-xs text-red-600 hover:underline ml-1">×</button>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={()=>addLesson(c.id)}>+ Dars</Button>
                        <span className="text-xs text-slate-400 self-center">{c.lessons.length} dars · bosqichli ochiladi</span>
                      </div>
                    </Card>
                  </motion.div>
                ))
              }
            </div>
          </motion.div>
        )}

        {tab==="testlar" && (
          <motion.div key="testlar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-4">
            <Card className="p-4 space-y-3">
              <div className="font-semibold">Yangi test</div>
              <div className="grid sm:grid-cols-[1fr_140px_100px] gap-2">
                <Input placeholder="Test nomi (mas: TOPIK I — Reading)" value={testTitle} onChange={e=>setTestTitle(e.target.value)} />
                <Input placeholder="Daraja" value={testLevel} onChange={e=>setTestLevel(e.target.value)} />
                <Button onClick={addTest}>Qo‘shish</Button>
              </div>
            </Card>
            <div className="space-y-3">
              {tests.length===0 ? <Card className="p-8 text-center text-sm text-slate-500">Hali test yo‘q — admindan kuting</Card> :
                tests.map(t => (
                  <Card key={t.id} className="p-4">
                    <div className="flex items-start justify-between gap-3"><div className="flex-1 min-w-0"><div className="font-semibold">{t.title}</div><Badge className="text-[11px] mt-1">{t.level}</Badge> · <span className="text-xs text-slate-500">{t.questions.length} savol</span></div>
                      <Button variant="ghost" size="sm" onClick={()=>{ const n=tests.filter(x=>x.id!==t.id); setTests(n); save(KEY_T,n); toast.success("O‘chirildi"); }}>O‘chirish</Button>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {t.questions.length===0 ? <p className="text-xs text-slate-400">Savol yo‘q</p> : t.questions.map((q,i)=>
                        <div key={i} className="rounded-xl bg-slate-50 border p-2.5 text-sm"><div className="font-medium">{i+1}. {q.text}</div><div className="text-xs text-slate-600 mt-1 truncate">Variantlar: {q.options}</div><div className="text-xs text-emerald-700 mt-1">Javob: {q.answer}</div>
                          <button onClick={()=>{ const n=tests.map(x=>x.id===t.id?{...x, questions:x.questions.filter((_,k)=>k!==i)}:x); setTests(n); save(KEY_T,n); }} className="text-xs text-red-600">o‘chirish</button>
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="mt-3" onClick={()=>addQuestion(t.id)}>+ Savol</Button>
                  </Card>
                ))
              }
            </div>
          </motion.div>
        )}

        {tab==="materiallar" && (
          <motion.div key="materiallar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-4">
            <Card className="p-4 space-y-3">
              <div className="font-semibold">Yangi material (faqat admin)</div>
              <div className="grid sm:grid-cols-[1fr_120px_100px] gap-2">
                <Input placeholder="Sarlavha (mas: Hangul qo‘llanma PDF)" value={matTitle} onChange={e=>setMatTitle(e.target.value)} />
                <Input placeholder="Turi PDF/Audio" value={matKind} onChange={e=>setMatKind(e.target.value)} />
                <Button onClick={addMaterial}>Qo‘shish</Button>
              </div>
              <Input placeholder="Havola / URL (ixtiyoriy)" value={matUrl} onChange={e=>setMatUrl(e.target.value)} />
            </Card>
            <div className="space-y-2">
              {materials.length===0 ? <Card className="p-8 text-center text-sm text-slate-500">Hali material yo‘q</Card> :
                materials.map(m => (
                  <Card key={m.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0"><div className="font-medium text-sm">{m.title}</div><div className="text-xs text-slate-500 mt-1 flex gap-1.5 flex-wrap"><Badge className="text-[11px]">{m.kind}</Badge>{m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-[#2563eb] underline truncate">{m.url}</a>}</div></div>
                    <Button variant="ghost" size="sm" onClick={()=>{ const n=materials.filter(x=>x.id!==m.id); setMaterials(n); save(KEY_M,n); toast.success("O‘chirildi"); }}>O‘chirish</Button>
                  </Card>
                ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="font-semibold text-sm text-blue-900">Qanday ko‘rinadi talabaga?</div>
        <p className="text-xs text-blue-800 mt-1 leading-relaxed">Kurslar bo‘sh bo‘lsa — talabada “Bo‘sh holat · kontentni administrator qo‘shadi” ko‘rinadi (demo kontent yo‘q). Darslar ketma-ket: oldingisi tugamasa, keyingisi qulflangan. Testlar/materiallar ham shu yerda boshqariladi va bepul.</p>
      </Card>
    </div>
  );
}
