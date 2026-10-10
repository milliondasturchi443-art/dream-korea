"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type Score = { correct: number; total: number; pct?: number; testId?: string };

export default function ResultPage() {
  const [data, setData] = useState<Score | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [qs, setQs] = useState<{ id: string; text: string; correct: string }[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dk_topik_score");
      if (raw) {
        const d = JSON.parse(raw);
        const correct = Number(d.correct ?? 0), total = Number(d.total ?? 1);
        setData({ correct, total, pct: Number(d.pct ?? Math.round((correct / total) * 100)), testId: d.testId });
        setAnswers(d.answers ?? {});
      }
    } catch {}
  }, []);

  // Tahlilni faqat admin ko'ra oladi. Talaba uchun — faqat o'zi belgilagan javob, to'g'risi ko'rsatilmaydi (server-correct).
  useEffect(() => {
    if (!data?.testId) return;
    const token = localStorage.getItem("dk_token") || sessionStorage.getItem("dk_token");
    fetch(`/api/topik/${encodeURIComponent(data.testId)}?solutions=1`, token ? { headers: { Authorization: `Bearer ${token}` } } : {})
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d && Array.isArray((d as { questions?: unknown[] }).questions)) {
          const v = d as { questions: { id: string; text: string; correct: string }[] };
          setQs(v.questions.map(q => ({ id: String(q.id), text: q.text, correct: String(q.correct ?? "") })));
        }
      })
      .catch(() => {});
  }, [data?.testId]);

  if (!data) return <div className="p-8 text-center text-slate-500">Yuklanmoqda…</div>;
  const pct = data.pct ?? (data.total ? Math.round((data.correct / data.total) * 100) : 0);
  const pieData = [{ name: "To‘g‘ri", value: data.correct }, { name: "Noto‘g‘ri", value: data.total - data.correct }];
  const COLORS = ["#2563eb", "#e2e8f0"];
  const level = pct >= 80 ? "Ajoyib!" : pct >= 60 ? "Yaxshi" : pct >= 40 ? "O‘rtacha" : "Qayta urinib ko‘ring";

  return (
    <div className="mx-auto max-w-[900px] p-4 lg:p-6 space-y-5">
      <Card className="p-6 lg:p-8 text-center bg-gradient-to-br from-[#0f1b3d] to-[#2563eb] text-white border-0">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-white/15 grid place-items-center"><Trophy className="h-7 w-7" /></div>
        <h1 className="mt-3 text-2xl font-bold">Test natijasi</h1>
        <div className="mt-1 text-sm text-white/80">{level}</div>
        <div className="mt-2 text-5xl font-extrabold">{pct}%</div>
        <div className="text-white/80 text-sm mt-1">To‘g‘ri: {data.correct} / {data.total}</div>
        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          <Link href={data.testId ? `/topik/exam?id=${encodeURIComponent(data.testId)}` : "/topik/exam"}><Button className="bg-white text-[#0f1b3d] hover:bg-slate-100">Qayta topshirish</Button></Link>
          <Link href="/topik"><Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">Barcha testlar</Button></Link>
          <Link href="/dashboard"><Button variant="ghost" className="text-white hover:bg-white/10">Dashboard →</Button></Link>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
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
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" /> To‘g‘ri</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-200" /> Noto‘g‘ri</span>
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-semibold text-slate-900">Bo‘limlar</div>
          <div className="h-[220px] mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: "To‘g‘ri", value: pct }, { name: "Noto‘g‘ri", value: 100 - pct }]}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {qs.length > 0 && data && (
        <Card className="p-5">
          <div className="font-semibold text-slate-900">Savollar tahlili {qs.length === 0 ? "" : `(admin — correct ko'rinadi)`}</div>
          <p className="text-xs text-slate-500 mt-1">Tahlil faqat admin ruxsati bilan (solutions=1) ko‘rinadi. Talaba uchun — faqat siz bergan javoblar.</p>
          <div className="mt-3 space-y-2">
            {qs.map((q, i) => {
              const mine = answers[String(q.id)];
              const ok = mine != null && String(mine).toUpperCase() === String(q.correct).toUpperCase();
              return (
                <div key={q.id} className={`flex gap-3 rounded-xl border p-3 ${ok ? "border-emerald-200 bg-emerald-50/50" : mine ? "border-red-200 bg-red-50/50" : "border-slate-200"}`}>
                  <span className={`h-7 w-7 rounded-full grid place-items-center text-xs font-bold shrink-0 ${ok ? "bg-emerald-100 text-emerald-700" : mine ? "bg-red-100 text-red-700" : "bg-slate-100"}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-800 line-clamp-2">{q.text}</div>
                    <div className="text-xs mt-1">Siz: <b>{mine ?? "—"}</b>{q.correct ? <> · To‘g‘ri: <b className="text-emerald-700">{q.correct}</b></> : ""}</div>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${ok ? "text-emerald-600" : "text-red-600"}`}>{ok ? "✓" : mine ? "✗" : ""}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
