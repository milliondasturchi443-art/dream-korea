"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { topikQuestions } from "@/lib/mock-data";
import { Trophy, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function ResultPage() {
  const [data, setData] = useState<{ correct: number; total: number } | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("dk_topik_score");
      if (raw) setData(JSON.parse(raw));
      else setData({ correct: 23, total: 30 });
    } catch { setData({ correct: 23, total: 30 }); }
  }, []);
  if (!data) return null;
  const pct = Math.round((data.correct / data.total) * 100);
  const chartData = [
    { name: "Reading", value: 82 },
    { name: "Listening", value: 74 },
    { name: "Vocabulary", value: 80 },
    { name: "Grammar", value: 76 },
  ];
  const pieData = [{ name: "To‘g‘ri", value: data.correct }, { name: "Noto‘g‘ri", value: data.total - data.correct }];
  const COLORS = ["#2563eb", "#e2e8f0"];

  return (
    <div className="mx-auto max-w-[900px] p-4 lg:p-6 space-y-5">
      <Card className="p-6 lg:p-8 text-center bg-gradient-to-br from-[#0f1b3d] to-[#2563eb] text-white border-0">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-white/15 grid place-items-center"><Trophy className="h-7 w-7" /></div>
        <h1 className="mt-3 text-2xl font-bold">Test natijasi</h1>
        <div className="mt-2 text-5xl font-extrabold">{pct}%</div>
        <div className="text-white/80 text-sm mt-1">To‘g‘ri: {data.correct} / {data.total}</div>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/topik/exam"><Button className="bg-white text-[#0f1b3d] hover:bg-slate-100">Qayta topshirish</Button></Link>
          <Link href="/topik"><Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">Barcha testlar</Button></Link>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="font-semibold text-slate-900">Bo‘limlar bo‘yicha</div>
          <div className="h-[220px] mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-semibold text-slate-900">Umumiy</div>
          <div className="h-[220px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={4}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]"/> To‘g‘ri</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-200"/> Noto‘g‘ri</span>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="font-semibold text-slate-900">Qaysi mavzularni yaxshilash kerak</div>
        <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">Listening — 74% · tez nutqni tushunish mashqlari</div>
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">Grammar — 76% · 은/는 vs 이/가</div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">Reading — 82% · yaxshi natija!</div>
          <div className="rounded-xl bg-violet-50 border border-violet-200 p-3">Vocabulary — 80% · kundalik so‘zlar</div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="font-semibold text-slate-900">Savollar tahlili</div>
        <div className="mt-3 space-y-2">
          {topikQuestions.map((q, i) => (
            <div key={q.id} className="flex gap-3 rounded-xl border border-slate-200 p-3">
              <span className="h-7 w-7 rounded-full bg-slate-100 grid place-items-center text-xs font-bold shrink-0">{i+1}</span>
              <div className="flex-1 min-w-0"><div className="text-sm text-slate-800 truncate">{q.text}</div><div className="text-xs text-slate-500">To‘g‘ri: {q.correct}</div></div>
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
