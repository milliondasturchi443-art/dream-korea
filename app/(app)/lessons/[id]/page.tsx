"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Play, FileText, Volume2, Download, Lock } from "lucide-react";
import { toast } from "sonner";
import { getCompleted, isLessonUnlocked, markCompleted } from "@/lib/lesson-progress";
import { motion, AnimatePresence } from "framer-motion";

const lessons = [
  { id: "1", title: "Hangul bilan tanishuv" },
  { id: "2", title: "Unli harflar ㅏ ㅓ ㅗ ㅜ" },
  { id: "3", title: "Undosh harflar ㄱ ㄴ ㄷ" },
  { id: "4", title: "Salomlashish — 안녕하세요" },
  { id: "5", title: "O‘zini tanishtirish" },
  { id: "6", title: "Raqamlar va sana" },
];

export default function LessonPage({ params }: { params: { id: string } }) {
  const search = useSearchParams();
  const router = useRouter();
  const courseId = search.get("course") ?? "1";
  const idx = lessons.findIndex(l => l.id === params.id);
  const cur = lessons[idx] ?? lessons[0];
  const [tab, setTab] = useState<"konspekt"|"vocab"|"grammar">("konspekt");
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => { setCompleted(getCompleted(courseId)); }, [courseId]);
  const unlocked = isLessonUnlocked(courseId, idx);
  const done = completed.includes(idx);
  const canGoNext = idx < lessons.length - 1 ? completed.includes(idx) : true;
  const nextUnlocked = idx < lessons.length - 1 ? isLessonUnlocked(courseId, idx + 1) : false;

  function handleComplete() {
    markCompleted(courseId, idx);
    setCompleted(prev => prev.includes(idx) ? prev : [...prev, idx]);
    toast.success("Dars yakunlandi! Keyingi dars ochildi.");
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-[1100px] p-4 lg:p-6">
        <Card className="p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 grid place-items-center text-amber-600"><Lock className="h-7 w-7" /></div>
          <h1 className="mt-4 text-xl font-bold">Dars yopiq</h1>
          <p className="text-sm text-slate-500 mt-1">Oldingi darsni yakunlang, keyin bu dars ochiladi.</p>
          <Link href={`/courses/${courseId}`}><Button className="mt-4">Kursga qaytish</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center justify-between gap-4 mb-4">
        <Link href={`/courses/${courseId}`} className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"><ChevronLeft className="h-4 w-4"/> Kursga qaytish</Link>
        <div className="text-xs text-slate-500">{idx+1} / {lessons.length} {done ? "· Yakunlandi" : ""}</div>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-[#0f1b3d] to-[#2563eb] grid place-items-center relative">
                <div className="text-center text-white">
                  <div className="mx-auto h-14 w-14 rounded-full bg-white/15 backdrop-blur grid place-items-center"><Play className="h-7 w-7 ml-1" /></div>
                  <div className="mt-3 font-semibold">{cur.title}</div>
                  <div className="text-xs text-white/70">Video — administrator qo‘shadi</div>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <Progress value={done ? 100 : 45} className="h-1.5 bg-white/20" />
                </div>
              </div>
              <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-bold text-slate-900">{cur.title}</h1>
                  <p className="text-xs text-slate-500">Bepul · Ketma-ket tartib</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={()=>toast.info("Materialni administrator qo‘shadi")}><Download className="h-4 w-4 mr-1"/> Material</Button>
                  {done ? <Button size="sm" variant="outline" disabled>Yakunlandi ✓</Button> : <Button size="sm" onClick={handleComplete}>Tugatdim ✓</Button>}
                </div>
              </div>
            </Card>
          </motion.div>

          <Card className="p-4">
            <div className="flex gap-2 border-b border-slate-200 mb-4">
              {[
                ["konspekt","Konspekt"],
                ["vocab","Lug‘at"],
                ["grammar","Grammatika"],
              ].map(([k,label]) => (
                <button key={k} onClick={()=>setTab(k as typeof tab)} className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===k ? "border-[#2563eb] text-[#2563eb]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>{label}</button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                {tab==="konspekt" && (
                  <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2"><FileText className="h-4 w-4"/> Dars konspekti</h3>
                    <p className="text-sm text-slate-500">Kontentni administrator to‘ldiradi. Barcha kurslar bepul.</p>
                    <p>안녕하세요 (annyeonghaseyo) — rasmiy salomlashish.</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>안녕하세요? — Salomlashish (rasmiy)</li>
                      <li>감사합니다 — Rahmat</li>
                    </ul>
                  </div>
                )}
                {tab==="vocab" && (
                  <div className="space-y-2">
                    {[
                      ["안녕하세요","annyeonghaseyo","salom"],
                      ["감사합니다","kamsahamnida","rahmat"],
                    ].map(([ko,tr,uz]) => (
                      <div key={ko} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                        <div><div className="font-bold">{ko} <span className="text-xs font-normal text-slate-500">· {tr}</span></div><div className="text-xs text-slate-500">{uz}</div></div>
                        <button onClick={()=>toast.info("🔊 "+ko)} className="h-8 w-8 rounded-full bg-slate-100 grid place-items-center"><Volume2 className="h-4 w-4"/></button>
                      </div>
                    ))}
                    <p className="text-xs text-slate-400">To‘liq lug‘atni administrator qo‘shadi.</p>
                  </div>
                )}
                {tab==="grammar" && (
                  <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                    <div className="rounded-xl border border-slate-200 p-3"><div className="font-semibold">은/는 — mavzu yuklamasi</div><div className="text-slate-600 mt-1">저는 학생입니다. — Men talabaman.</div></div>
                    <p className="text-xs text-slate-400">Qolgan grammatikani administrator qo‘shadi.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </Card>

          <div className="flex justify-between gap-3">
            <Link href={idx>0 ? `/lessons/${lessons[idx-1].id}?course=${courseId}` : "#"} onClick={e=>{ if(idx===0) e.preventDefault(); }}><Button variant="outline" disabled={idx===0}><ChevronLeft className="h-4 w-4 mr-1"/> Oldingi</Button></Link>
            {idx < lessons.length-1 ? (
              <Button
                disabled={!canGoNext}
                onClick={()=>{
                  if (!canGoNext) toast.error("Avval joriy darsni yakunlang");
                  else router.push(`/lessons/${lessons[idx+1].id}?course=${courseId}`);
                }}
                title={!canGoNext ? "Avval yakunlang" : ""}
              >
                Keyingi <ChevronRight className="h-4 w-4 ml-1"/>
              </Button>
            ) : <Button variant="outline" disabled>Kurs yakunlandi</Button>}
          </div>
          {!canGoNext && <p className="text-xs text-amber-600 text-center">Keyingi darsga o‘tish uchun “Tugatdim” bosing</p>}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="font-semibold text-slate-900">Darslar ro‘yxati</div>
            <div className="mt-3 space-y-1.5">
              {lessons.map((l,i) => {
                const u = isLessonUnlocked(courseId, i);
                const d = completed.includes(i);
                return (
                  <Link key={l.id} href={u ? `/lessons/${l.id}?course=${courseId}` : "#"} onClick={e=>{ if(!u){ e.preventDefault(); toast.error("Oldin yakunlang"); }}} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${l.id===cur.id ? "bg-[#eff6ff] text-[#2563eb] font-medium border border-blue-200" : !u ? "bg-slate-50 text-slate-400 border border-transparent cursor-not-allowed" : "hover:bg-slate-50 text-slate-700 border border-transparent"}`}>
                    <span className={`h-6 w-6 rounded-full grid place-items-center text-xs shrink-0 ${d ? "bg-emerald-100 text-emerald-600" : !u ? "bg-slate-100 text-slate-400" : "bg-white border border-slate-200"}`}>{!u ? <Lock className="h-3 w-3"/> : d ? "✓" : i+1}</span>
                    <span className="truncate">{l.title}</span>
                  </Link>
                );
              })}
            </div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="text-sm font-semibold text-amber-900">Qoida</div>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">Keyingi darsga faqat joriy darsni “Tugatdim” tugmasi bilan yakunlagach o‘tasiz. Barcha kurslar bepul.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
