"use client";
import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Play, FileText, Volume2, Download } from "lucide-react";
import { toast } from "sonner";

const lessons = [
  { id: "1", title: "Hangul bilan tanishuv" },
  { id: "2", title: "Unli harflar ㅏ ㅓ ㅗ ㅜ" },
  { id: "3", title: "Undosh harflar ㄱ ㄴ ㄷ" },
  { id: "4", title: "Salomlashish — 안녕하세요" },
  { id: "5", title: "O‘zini tanishtirish" },
  { id: "6", title: "Raqamlar va sana" },
];

export default function LessonPage({ params }: { params: { id: string } }) {
  const idx = lessons.findIndex(l => l.id === params.id);
  const cur = lessons[idx] ?? lessons[3];
  const [tab, setTab] = useState<"konspekt"|"vocab"|"grammar">("konspekt");

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <Link href="/courses/1" className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"><ChevronLeft className="h-4 w-4"/> Kursga qaytish</Link>
        <div className="text-xs text-slate-500">{idx+1} / {lessons.length}</div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-[#0f1b3d] to-[#2563eb] grid place-items-center relative">
              <div className="text-center text-white">
                <div className="mx-auto h-14 w-14 rounded-full bg-white/15 backdrop-blur grid place-items-center"><Play className="h-7 w-7 ml-1" /></div>
                <div className="mt-3 font-semibold">{cur.title}</div>
                <div className="text-xs text-white/70">Video player — mock (YouTube/MP4 ulanadi)</div>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <Progress value={45} className="h-1.5 bg-white/20" />
              </div>
            </div>
            <div className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-bold text-slate-900">{cur.title}</h1>
                <p className="text-xs text-slate-500">Davomiyligi: 15 daqiqa · Ustoz: Kim Ji-Hoon</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={()=>toast.success("Konspekt yuklab olindi (mock)")}><Download className="h-4 w-4 mr-1"/> Material</Button>
                <Button size="sm" onClick={()=>toast.success("Progress saqlandi")}>Tugatdim ✓</Button>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex gap-2 border-b border-slate-200 mb-4">
              {[
                ["konspekt","Konspekt"],
                ["vocab","Lug‘at"],
                ["grammar","Grammatika"],
              ].map(([k,label]) => (
                <button key={k} onClick={()=>setTab(k as any)} className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${tab===k ? "border-[#2563eb] text-[#2563eb]" : "border-transparent text-slate-500"}`}>{label}</button>
              ))}
            </div>
            {tab==="konspekt" && (
              <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2"><FileText className="h-4 w-4"/> Dars konspekti</h3>
                <p>안녕하세요 (annyeonghaseyo) — rasmiy salomlashish. Do‘stona holatda 안녕 (annyeong) deyiladi.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>안녕하세요? — Salomlashish (rasmiy)</li>
                  <li>감사합니다 — Rahmat</li>
                  <li>네 / 아니요 — Ha / Yo‘q</li>
                </ul>
                <div className="mt-3 rounded-xl bg-[#eff6ff] p-3 text-sm"><b>Mashq:</b> Ovoz chiqarib 5 marta takrorlang va yozib oling.</div>
              </div>
            )}
            {tab==="vocab" && (
              <div className="space-y-2">
                {[
                  ["안녕하세요","annyeonghaseyo","salom"],
                  ["감사합니다","kamsahamnida","rahmat"],
                  ["죄송합니다","joesonghamnida","uzr"],
                  ["네","ne","ha"],
                ].map(([ko,tr,uz]) => (
                  <div key={ko} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <div><div className="font-bold">{ko} <span className="text-xs font-normal text-slate-500">· {tr}</span></div><div className="text-xs text-slate-500">{uz}</div></div>
                    <button onClick={()=>toast.info("🔊 "+ko)} className="h-8 w-8 rounded-full bg-slate-100 grid place-items-center"><Volume2 className="h-4 w-4"/></button>
                  </div>
                ))}
              </div>
            )}
            {tab==="grammar" && (
              <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                <div className="rounded-xl border border-slate-200 p-3"><div className="font-semibold">은/는 — mavzu yuklamasi</div><div className="text-slate-600 mt-1">저는 학생입니다. — Men talabaman.</div></div>
                <div className="rounded-xl border border-slate-200 p-3"><div className="font-semibold">입니다 — bo‘lishlik (rasmiy)</div><div className="text-slate-600 mt-1">한국어입니다. — Bu koreys tili.</div></div>
              </div>
            )}
          </Card>

          <div className="flex justify-between gap-3">
            <Link href={`/lessons/${lessons[Math.max(0, idx-1)].id}`}><Button variant="outline"><ChevronLeft className="h-4 w-4 mr-1"/> Oldingi</Button></Link>
            <Link href={`/lessons/${lessons[Math.min(lessons.length-1, idx+1)].id}`}><Button>Keyingi <ChevronRight className="h-4 w-4 ml-1"/></Button></Link>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="font-semibold text-slate-900">Darslar ro‘yxati</div>
            <div className="mt-3 space-y-1.5">
              {lessons.map((l,i) => (
                <Link key={l.id} href={`/lessons/${l.id}`} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${l.id===cur.id ? "bg-[#eff6ff] text-[#2563eb] font-medium border border-blue-200" : "hover:bg-slate-50 text-slate-700 border border-transparent"}`}>
                  <span className="h-6 w-6 rounded-full bg-white border border-slate-200 grid place-items-center text-xs shrink-0">{i+1}</span>
                  <span className="truncate">{l.title}</span>
                </Link>
              ))}
            </div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="text-sm font-semibold text-amber-900">Maslahat</div>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">Har kuni 20 ta so‘z yodlang va streak’ni saqlab qoling. Ertaga test bor!</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
