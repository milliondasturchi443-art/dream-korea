"use client";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, FileText, Headphones, BookOpen, PenLine, Trophy } from "lucide-react";

const tests = [
  { id: "topik1-reading", title: "TOPIK I — Reading", level: "TOPIK I", type: "Reading", questions: 30, time: "40 daq", color: "from-blue-600 to-indigo-600" },
  { id: "topik1-listening", title: "TOPIK I — Listening", level: "TOPIK I", type: "Listening", questions: 30, time: "35 daq", color: "from-emerald-600 to-teal-600" },
  { id: "topik1-full", title: "TOPIK I — Full Mock", level: "TOPIK I", type: "Full", questions: 60, time: "80 daq", color: "from-[#0f1b3d] to-[#2563eb]" },
  { id: "topik2-reading", title: "TOPIK II — Reading", level: "TOPIK II", type: "Reading", questions: 50, time: "70 daq", color: "from-violet-600 to-purple-600" },
  { id: "topik2-listening", title: "TOPIK II — Listening", level: "TOPIK II", type: "Listening", questions: 50, time: "60 daq", color: "from-rose-600 to-pink-600" },
  { id: "eps-topik", title: "EPS-TOPIK — Mock", level: "EPS", type: "Full", questions: 40, time: "50 daq", color: "from-amber-600 to-orange-600" },
];

export default function TopikPage() {
  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">TOPIK testlar</h1>
        <p className="text-sm text-slate-500">Reading, Listening, Vocabulary, Grammar va Full mock testlar</p>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Card className="p-4 bg-[#eff6ff] border-blue-200">
          <div className="text-xs text-slate-600">So‘nggi natija</div>
          <div className="text-xl font-extrabold text-[#0f1b3d]">78% · 23/30</div>
          <Progress value={78} className="mt-2" />
          <Link href="/topik/result"><Button variant="outline" size="sm" className="mt-3 w-full">Natijani ko‘rish</Button></Link>
        </Card>
        <Card className="p-4">
          <div className="font-semibold text-sm">TOPIK I</div>
          <div className="text-xs text-slate-500">Boshlang‘ich — 2 daraja</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <span className="rounded-lg bg-slate-100 px-2 py-1.5">Reading 82%</span>
            <span className="rounded-lg bg-slate-100 px-2 py-1.5">Listening 74%</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="font-semibold text-sm">TOPIK II</div>
          <div className="text-xs text-slate-500">O‘rta-yuqori daraja</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <span className="rounded-lg bg-slate-100 px-2 py-1.5">Vocab 80%</span>
            <span className="rounded-lg bg-slate-100 px-2 py-1.5">Grammar 76%</span>
          </div>
        </Card>
      </div>

      <div className="flex gap-2 overflow-auto pb-1">
        {["Barchasi","TOPIK I","TOPIK II","EPS-TOPIK","Reading","Listening"].map(f => (
          <Badge key={f} className="bg-white border border-slate-200 text-slate-700 shrink-0 cursor-pointer hover:bg-slate-50">{f}</Badge>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tests.map(t => (
          <Card key={t.id} className="overflow-hidden flex flex-col">
            <div className={`h-24 bg-gradient-to-br ${t.color} p-4 text-white flex flex-col justify-between`}>
              <Badge className="bg-white text-slate-800 w-fit text-[11px]">{t.level} · {t.type}</Badge>
              <div className="font-semibold leading-tight">{t.title}</div>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5"/> {t.questions} savol</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5"/> {t.time}</span>
              </div>
              <Link href="/topik/exam" className="mt-auto"><Button className="w-full">Boshlash</Button></Link>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="font-semibold text-slate-900 flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500"/> Qaysi mavzularni yaxshilash kerak?</div>
        <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-sm text-slate-600">
          <li>• Listening — tez nutqni tushunish</li>
          <li>• Grammar — 은/는 vs 이/가</li>
          <li>• Vocabulary — kundalik so‘zlar</li>
          <li>• Reading — uzun matnlar</li>
        </ul>
      </Card>
    </div>
  );
}
