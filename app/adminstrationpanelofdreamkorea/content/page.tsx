"use client";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

type ApiCourse = { id: string; title: string; subtitle: string; level: string; description: string; teacher: string; lessons: number; color: string };
type ApiCourseDetail = ApiCourse & { lessons: { id: string; order: number; title: string; duration: string }[] };
type TestListItem = { id: string; title: string; level: string; type: string; questions: number; seeded?: boolean };
type TestDetail = { id: string; title: string; questions: { id: string; text: string; correct: string; options?: { key: string; text: string }[] }[] };
type Material = { id: string; title: string; kind: string; url: string | null };
type Video = { id: string; title: string; category: string; duration: string; videoUrl: string | null };

function authHeader(): Record<string, string> {
  try { const t = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token"); return t ? { Authorization: `Bearer ${t}` } : {}; } catch { try { const t2 = localStorage.getItem("dk_token"); return t2 ? { Authorization: `Bearer ${t2}` } : {}; } catch { return {}; } }
}

export default function AdminContentPage() {
  const [tab, setTab] = useState<"kurslar" | "testlar" | "materiallar" | "videolar">("kurslar");

  // Kurslar
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [detail, setDetail] = useState<Record<string, ApiCourseDetail>>({});
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("A1");
  const [desc, setDesc] = useState("");

  // Testlar (БД)
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testDetail, setTestDetail] = useState<Record<string, TestDetail>>({});
  const [tTitle, setTTitle] = useState("");
  const [tLevel, setTLevel] = useState("TOPIK I");
  const [tType, setTType] = useState("Reading");
  const [qTest, setQTest] = useState<string>("");
  const [qText, setQText] = useState("");
  const [qA, setQA] = useState(""); const [qB, setQB] = useState(""); const [qC, setQC] = useState(""); const [qD, setQD] = useState("");
  const [qCorrect, setQCorrect] = useState("A");
  const [qExpl, setQExpl] = useState("");

  // Materiallar (БД)
  const [materials, setMaterials] = useState<Material[]>([]);
  const [matLoading, setMatLoading] = useState(false);
  const [matTitle, setMatTitle] = useState("");
  const [matKind, setMatKind] = useState("PDF");
  const [matUrl, setMatUrl] = useState("");

  // Videolar (БД)
  const [videos, setVideos] = useState<Video[]>([]);
  const [vidLoading, setVidLoading] = useState(false);
  const [vTitle, setVTitle] = useState("");
  const [vCat, setVCat] = useState("Koreys tili");
  const [vDur, setVDur] = useState("");
  const [vUrl, setVUrl] = useState("");

  const h = authHeader;

  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    try { const r = await fetch("/api/courses"); const d = await r.json(); if (r.ok && Array.isArray(d.courses)) setCourses(d.courses); } catch {}
    setCoursesLoading(false);
  }, []);
  async function fetchDetail(id: string) {
    try { const r = await fetch(`/api/courses/${id}`); const d = await r.json(); if (r.ok && d.id) setDetail(prev => ({ ...prev, [id]: d })); } catch {}
  }
  const fetchTests = useCallback(async () => {
    setTestsLoading(true);
    try { const r = await fetch("/api/topik"); const d = await r.json(); if (r.ok && Array.isArray(d.tests)) setTests(d.tests); } catch {}
    setTestsLoading(false);
  }, []);
  const fetchMaterials = useCallback(async () => {
    setMatLoading(true);
    try { const r = await fetch("/api/materials"); const d = await r.json(); if (r.ok && Array.isArray(d.items)) setMaterials(d.items); } catch {}
    setMatLoading(false);
  }, []);
  const fetchVideos = useCallback(async () => {
    setVidLoading(true);
    try { const r = await fetch("/api/videos"); const d = await r.json(); if (r.ok && Array.isArray(d.videos)) setVideos(d.videos); } catch {}
    setVidLoading(false);
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);
  useEffect(() => { if (tab === "testlar") fetchTests(); if (tab === "materiallar") fetchMaterials(); if (tab === "videolar") fetchVideos(); }, [tab, fetchTests, fetchMaterials, fetchVideos]);

  async function req(url: string, method: string, body?: unknown): Promise<any> {
    const hd = h();
    if (!hd.Authorization) throw new Error("Avval admin sifatida kiring");
    const r = await fetch(url, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...hd }, body: body ? JSON.stringify(body) : undefined });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Xato");
    return d;
  }

  // ---- Kurslar ----
  async function addCourse() {
    if (!title.trim()) { toast.error("Kurs nomini kiriting"); return; }
    try {
      await req("/api/courses", "POST", { title: title.trim(), level: level.trim() || "A1", description: desc.trim(), subtitle: desc.trim().slice(0, 60) });
      setTitle(""); setDesc(""); toast.success("Kurs qo‘shildi (БД)"); fetchCourses();
    } catch (e) { toast.error((e as Error).message); }
  }
  async function removeCourse(id: string) {
    if (!confirm("Kursni o‘chirasizmi? Darslari ham o‘chadi.")) return;
    try { await req(`/api/courses/${encodeURIComponent(id)}`, "DELETE"); toast.success("O‘chirildi"); fetchCourses(); setDetail(p => { const c = { ...p }; delete c[id]; return c; }); } catch (e) { toast.error((e as Error).message); }
  }
  async function addLesson(courseId: string) {
    const t = prompt("Dars nomi (mas: Hangul bilan tanishuv):"); if (!t) return;
    const d = prompt("Davomiyligi:", "15 daq") ?? "15 daq";
    try { await req(`/api/courses/${encodeURIComponent(courseId)}/lessons`, "POST", { title: t.trim(), duration: d }); toast.success("Dars qo‘shildi (ketma-ket ochiladi)"); fetchCourses(); fetchDetail(courseId); } catch (e) { toast.error((e as Error).message); }
  }
  async function removeLesson(courseId: string, lessonId: string) {
    try { await req(`/api/courses/${encodeURIComponent(courseId)}/lessons?lessonId=${encodeURIComponent(lessonId)}`, "DELETE"); toast.success("Dars o‘chirildi"); fetchCourses(); fetchDetail(courseId); } catch (e) { toast.error((e as Error).message); }
  }

  // ---- Testlar (БД) ----
  async function addTest() {
    if (!tTitle.trim()) { toast.error("Test nomini kiriting"); return; }
    try {
      const d = await req("/api/topik", "POST", { title: tTitle.trim(), level: tLevel, type: tType });
      setTTitle(""); toast.success("Test yaratildi (БД) — endi savol qo‘shing"); fetchTests();
      if (d?.id) setQTest(d.id);
    } catch (e) { toast.error((e as Error).message); }
  }
  async function fetchTestDetail(id: string) {
    try { const r = await fetch(`/api/topik/${id}`); const d = await r.json(); if (r.ok && d.id) setTestDetail(p => ({ ...p, [id]: d })); } catch {}
  }
  async function addQuestion() {
    if (!qTest) { toast.error("Avval test tanlang"); return; }
    if (!qText.trim()) { toast.error("Savol matnini kiriting"); return; }
    const opts = [
      { key: "A", text: qA.trim() || "—" }, { key: "B", text: qB.trim() || "—" },
      { key: "C", text: qC.trim() || "—" }, { key: "D", text: qD.trim() || "—" },
    ];
    try {
      await req(`/api/topik/${qTest}`, "POST", { text: qText.trim(), options: opts, correct: qCorrect, explanation: qExpl.trim() });
      setQText(""); setQA(""); setQB(""); setQC(""); setQD(""); setQExpl("");
      toast.success("Savol qo‘shildi (БД)"); fetchTests(); fetchTestDetail(qTest);
    } catch (e) { toast.error((e as Error).message); }
  }
  async function removeQuestion(tid: string, qid: string) {
    try { await req(`/api/topik/${tid}?question=${encodeURIComponent(qid)}`, "DELETE"); toast.success("Savol o‘chirildi"); fetchTests(); fetchTestDetail(tid); } catch (e) { toast.error((e as Error).message); }
  }
  async function removeTest(id: string) {
    if (id.startsWith("seed_")) { toast.error("Ichki (seed) test o‘chirilmaydi"); return; }
    if (!confirm("Testni o‘chirasizmi? Savollari va yozuvlari ham o‘chadi.")) return;
    try { await req(`/api/topik/${id}`, "DELETE"); toast.success("Test o‘chirildi"); fetchTests(); setTestDetail(p => { const c = { ...p }; delete c[id]; return c; }); } catch (e) { toast.error((e as Error).message); }
  }

  // ---- Materiallar (БД) ----
  async function addMaterial() {
    if (!matTitle.trim()) { toast.error("Sarlavhani kiriting"); return; }
    try { await req("/api/materials", "POST", { title: matTitle.trim(), kind: matKind, url: matUrl.trim() }); setMatTitle(""); setMatUrl(""); toast.success("Material qo‘shildi (БД)"); fetchMaterials(); } catch (e) { toast.error((e as Error).message); }
  }
  async function removeMaterial(id: string) {
    try { await req(`/api/materials/${id}`, "DELETE"); toast.success("O‘chirildi"); fetchMaterials(); } catch (e) { toast.error((e as Error).message); }
  }

  // ---- Videolar (БД) ----
  async function addVideo() {
    if (!vTitle.trim() || !vCat.trim()) { toast.error("Sarlavha va kategoriya majburiy"); return; }
    try { await req("/api/videos", "POST", { title: vTitle.trim(), category: vCat.trim(), duration: vDur.trim(), videoUrl: vUrl.trim() }); setVTitle(""); setVDur(""); setVUrl(""); toast.success("Video qo‘shildi (БД)"); fetchVideos(); } catch (e) { toast.error((e as Error).message); }
  }
  async function removeVideo(id: string) {
    try { await req(`/api/videos/${id}`, "DELETE"); toast.success("O‘chirildi"); fetchVideos(); } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="mx-auto max-w-[980px] p-4 lg:p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-[22px] font-bold text-slate-900">Kontent</h1>
        <p className="text-sm text-slate-500">Barchasi <b>БД (MongoDB)</b> da — barcha talabalarda ko‘rinadi. Bepul, darslar ketma-ket ochiladi.</p>
      </motion.div>

      <div className="flex gap-1.5 p-1 rounded-full bg-slate-100 w-fit flex-wrap">
        {(["kurslar", "testlar", "materiallar", "videolar"] as const).map(id => (
          <button key={id} onClick={() => setTab(id)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === id ? "bg-[#0f1b3d] text-white shadow" : "text-slate-600 hover:text-slate-900"}`}>
            {id === "kurslar" ? "Kurslar" : id === "testlar" ? "Testlar" : id === "materiallar" ? "Materiallar" : "Videolar"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "kurslar" && (
          <motion.div key="kurslar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-4">
            <Card className="p-4 space-y-3">
              <div className="font-semibold">Yangi kurs (bepul, БД) — faqat admin</div>
              <div className="grid sm:grid-cols-[1fr_140px_100px] gap-2">
                <Input placeholder="Kurs nomi" value={title} onChange={e => setTitle(e.target.value)} />
                <Input placeholder="Daraja A1/TOPIK I" value={level} onChange={e => setLevel(e.target.value)} />
                <Button onClick={addCourse}>Qo‘shish</Button>
              </div>
              <Textarea placeholder="Tavsif (ixtiyoriy)" value={desc} onChange={e => setDesc(e.target.value)} />
            </Card>
            {coursesLoading ? <Card className="p-8 text-center text-sm text-slate-400">Yuklanmoqda…</Card> :
             courses.length === 0 ? <Card className="p-8 text-center text-sm text-slate-500"><p className="font-medium">Hali kurs yo‘q</p><p className="text-xs mt-1">Talabada “Hali kurs yo‘q — administrator qo‘shadi” ko‘rinadi.</p></Card> :
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
                            <Button variant="ghost" size="sm" onClick={() => fetchDetail(c.id)}>Darslar</Button>
                            <Button variant="ghost" size="sm" onClick={() => removeCourse(c.id)}>O‘chirish</Button>
                          </div>
                        </div>
                        {d ? (
                          <div className="mt-3 space-y-1.5">
                            {lessons.length === 0 ? <p className="text-xs text-slate-400">Dars yo‘q — “+ Dars” bilan qo‘shing</p> : lessons.map(l => (
                              <div key={l.id} className="flex items-center gap-2 text-sm rounded-xl bg-slate-50 border border-slate-200 p-2.5"><span className="h-6 w-6 rounded-full bg-white border border-slate-200 grid place-items-center text-xs font-bold shrink-0">{l.order}</span><span className="flex-1 min-w-0 truncate">{l.title}</span><span className="text-xs text-slate-500">{l.duration}</span>
                                <button onClick={() => removeLesson(c.id, l.id)} className="text-xs text-red-600 hover:underline ml-1">×</button>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-xs text-slate-400 mt-2">“Darslar” ni bosing — БД dan keladi</p>}
                        <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => addLesson(c.id)}>+ Dars</Button><span className="text-xs text-slate-400 self-center">ketma-ket ochiladi</span></div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            }
          </motion.div>
        )}

        {tab === "testlar" && (
          <motion.div key="testlar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-4">
            <Card className="p-4 space-y-3">
              <div className="font-semibold">Yangi test (БД) — talabalar /topik da ko‘radi</div>
              <div className="grid sm:grid-cols-[1fr_120px_120px_100px] gap-2">
                <Input placeholder="Test nomi (mas: TOPIK I — Reading)" value={tTitle} onChange={e => setTTitle(e.target.value)} />
                <select value={tLevel} onChange={e => setTLevel(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"><option>TOPIK I</option><option>TOPIK II</option><option>EPS-TOPIK</option></select>
                <select value={tType} onChange={e => setTType(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"><option>Reading</option><option>Listening</option><option>Full</option></select>
                <Button onClick={addTest}>Qo‘shish</Button>
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="font-semibold">Savol qo‘shish</div>
              <select value={qTest} onChange={e => setQTest(e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm">
                <option value="">— Testni tanlang —</option>
                {tests.filter(t => !t.seeded).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              <Textarea placeholder="Savol matni" value={qText} onChange={e => setQText(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                {([["A", qA, setQA], ["B", qB, setQB], ["C", qC, setQC], ["D", qD, setQD]] as const).map(([k, val, set]) => (
                  <div key={k} className="flex gap-1.5 items-center">
                    <span className="h-7 w-7 rounded-full bg-slate-100 grid place-items-center text-xs font-bold shrink-0">{k}</span>
                    <Input placeholder={`Variant ${k}`} value={val} onChange={e => set(e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">To‘g‘ri javob:</span>
                {["A", "B", "C", "D"].map(k => (
                  <button key={k} onClick={() => setQCorrect(k)} className={`h-7 w-7 rounded-full text-xs font-bold border ${qCorrect === k ? "bg-emerald-500 text-white border-emerald-500" : "bg-white border-slate-200"}`}>{k}</button>
                ))}
                <Input placeholder="Tushuntirish (ixtiyoriy)" value={qExpl} onChange={e => setQExpl(e.target.value)} className="flex-1 min-w-[200px]" />
                <Button onClick={addQuestion} disabled={!qTest}>Savolni saqlash</Button>
              </div>
            </Card>

            {testsLoading ? <Card className="p-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</Card> :
             tests.length === 0 ? <Card className="p-8 text-center text-sm text-slate-500">Test yo‘q — yuqoridan qo‘shing</Card> :
              <div className="space-y-3">
                {tests.map(t => {
                  const d = testDetail[t.id];
                  return (
                    <Card key={t.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold">{t.title}</div>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap"><Badge className="text-[11px]">{t.level}</Badge><Badge className="text-[11px] bg-blue-50 text-blue-700">{t.type}</Badge><span className="text-xs text-slate-500">{t.questions} savol</span>{t.seeded && <Badge className="text-[11px] bg-slate-100 text-slate-600">Ichki namuna — o‘chirilmaydi</Badge>}</div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => { setQTest(t.id); fetchTestDetail(t.id); }}>Savollar</Button>
                          {!t.seeded && <Button variant="ghost" size="sm" className="text-red-600" onClick={() => removeTest(t.id)}>O‘chirish</Button>}
                        </div>
                      </div>
                      {d && (
                        <div className="mt-3 space-y-1.5">
                          {d.questions.length === 0 ? <p className="text-xs text-slate-400">Savol yo‘q — yuqoridagi formadan qo‘shing</p> :
                            d.questions.map((q, i) => (
                              <div key={q.id} className="rounded-xl bg-slate-50 border p-2.5 text-sm">
                                <div className="font-medium flex justify-between gap-2"><span>{i + 1}. {q.text}</span><button onClick={() => removeQuestion(t.id, q.id)} className="text-xs text-red-600 shrink-0">o‘chirish</button></div>
                                <div className="text-xs text-slate-600 mt-1">{(q.options ?? []).map(o => `${o.key}) ${o.text}`).join("  ")}</div>
                                <div className="text-xs text-emerald-700 mt-1">Javob: {q.correct}</div>
                              </div>
                            ))}
                        </div>
                      )}
                      {d && <Button size="sm" variant="outline" className="mt-3" onClick={() => { setQTest(t.id); }}>+ Savol shu testga</Button>}
                    </Card>
                  );
                })}
              </div>
            }
          </motion.div>
        )}

        {tab === "materiallar" && (
          <motion.div key="materiallar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-4">
            <Card className="p-4 space-y-3">
              <div className="font-semibold">Yangi material (БД) — talabalar ko‘radi</div>
              <div className="grid sm:grid-cols-[1fr_120px_100px] gap-2">
                <Input placeholder="Sarlavha (mas: Hangul qo‘llanma PDF)" value={matTitle} onChange={e => setMatTitle(e.target.value)} />
                <Input placeholder="Turi PDF/Audio" value={matKind} onChange={e => setMatKind(e.target.value)} />
                <Button onClick={addMaterial}>Qo‘shish</Button>
              </div>
              <Input placeholder="Havola / URL (ixtiyoriy)" value={matUrl} onChange={e => setMatUrl(e.target.value)} />
            </Card>
            {matLoading ? <Card className="p-8 text-center text-sm text-slate-400">Yuklanmoqda…</Card> :
             materials.length === 0 ? <Card className="p-8 text-center text-sm text-slate-500">Hali material yo‘q</Card> :
              <div className="space-y-2">
                {materials.map(m => (
                  <Card key={m.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0"><div className="font-medium text-sm">{m.title}</div>
                      <div className="text-xs text-slate-500 mt-1 flex gap-1.5 flex-wrap items-center"><Badge className="text-[11px]">{m.kind}</Badge>{m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-[#2563eb] underline truncate">{m.url}</a>}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => removeMaterial(m.id)}>O‘chirish</Button>
                  </Card>
                ))}
              </div>
            }
          </motion.div>
        )}

        {tab === "videolar" && (
          <motion.div key="videolar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="space-y-4">
            <Card className="p-4 space-y-3">
              <div className="font-semibold">Yangi video (БД) — /videos va /media da ko‘rinadi</div>
              <div className="grid sm:grid-cols-[1fr_140px_110px_100px] gap-2">
                <Input placeholder="Video nomi" value={vTitle} onChange={e => setVTitle(e.target.value)} />
                <Input placeholder="Kategoriya (Koreys tili/TOPIK/Kino…)" value={vCat} onChange={e => setVCat(e.target.value)} />
                <Input placeholder="Davomiylik 12:30" value={vDur} onChange={e => setVDur(e.target.value)} />
                <Button onClick={addVideo}>Qo‘shish</Button>
              </div>
              <Input placeholder="Video havolasi (YouTube/URL, ixtiyoriy)" value={vUrl} onChange={e => setVUrl(e.target.value)} />
            </Card>
            {vidLoading ? <Card className="p-8 text-center text-sm text-slate-400">Yuklanmoqda…</Card> :
             videos.length === 0 ? <Card className="p-8 text-center text-sm text-slate-500">Hali video yo‘q — talabada “Hali video yo‘q” ko‘rinadi</Card> :
              <div className="space-y-2">
                {videos.map(v => (
                  <Card key={v.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0"><div className="font-medium text-sm">{v.title}</div>
                      <div className="text-xs text-slate-500 mt-1 flex gap-1.5 flex-wrap items-center"><Badge className="text-[11px]">{v.category}</Badge><span>{v.duration}</span>{v.videoUrl && <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[#2563eb] underline truncate">havola</a>}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => removeVideo(v.id)}>O‘chirish</Button>
                  </Card>
                ))}
              </div>
            }
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="p-4 bg-blue-50 border-blue-200"><div className="font-semibold text-sm text-blue-900">Hammasi БД da</div><p className="text-xs text-blue-800 mt-1 leading-relaxed">Kurslar, testlar, savollar, materiallar va videolar MongoDB da — har bir talabada ko‘rinadi. Darslar ketma-ket: oldingisi tugamasa, keyingisi qulflangan.</p></Card>
    </div>
  );
}
