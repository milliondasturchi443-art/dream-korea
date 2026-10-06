"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, FileText } from "lucide-react";
import { motion } from "framer-motion";

type T = { id: string; title: string; level: string; type: string; questions: number; time: string };

const COLORS: Record<string, string> = {
  "TOPIK I": "from-blue-600 to-indigo-600",
  "TOPIK II": "from-violet-600 to-purple-600",
  EPS: "from-amber-600 to-orange-600",
};
function colorFor(level: string, type: string) {
  if (level === "TOPIK I" && type === "Full") return "from-[#0f1b3d] to-[#2563eb]";
  if (type === "Listening") return "from-emerald-600 to-teal-600";
  return COLORS[level as keyof typeof COLORS] ?? "from-slate-600 to-slate-800";
}

export default function TopikPage() {
  const [tests, setTests] = useState<T[]>([]);
  const [filter, setFilter] = useState("Barchasi");
  const [lastScore, setLastScore] = useState<{ correct: number; total: number; pct: number } | null>(null);

  useEffect(() => {
    fetch("/api/topik").then(r => r.json()).then(d => { if (Array.isArray(d.tests)) setTests(d.tests); }).catch(()=>{});
    try {
      const raw = localStorage.getItem("dk_topik_score");
      if (raw) {
        const d = JSON.parse(raw);
        const correct = Number(d.correct ?? 0);
        const total = Number(d.total ?? 1);
        setLastScore({ correct, total, pct: Math.round(correct / total * 100) });
      }
    } catch {}
  }, []);

  const filtered = filter === "Barchasi" ? tests : tests.filter(t => t.level === filter || t.type === filter);

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-[22px] font-bold text-slate-900">TOPIK</h1>
        <p className="text-sm text-slate-500">TOPIK I · TOPIK II · EPS kimyo: Reading / Listening / Full. Savollarni <span className="font-medium">admin</span> qo‘shadi, lekin standart TOPIK I to‘plami allaqachon tayyor.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-3">
        <Card className="p-4 bg-[#eff6ff] border-blue-200">
          <div className="text-xs text-slate-600">So‘nggi natijangiz</div>
          {lastScore ? (
            <>
              <div className="text-xl font-extrabold text-[#0f1b3d]">{lastScore.pct}% · {lastScore.correct}/{lastScore.total}</div>
              <Progress value={lastScore.pct} className="mt-2" />
              <Link href="/topik/result"><Button variant="outline" size="sm" className="mt-3 w-full">Natijani ko‘rish</Button></Link>
            </>
          ) : (
            <>
              <div className="text-xl font-extrabold text-[#0f1b3d]">—</div>
              <p className="text-xs text-slate-500 mt-1">Hali test topshirmadingiz — TOPIK I dan boshlang.</p>
              <Link href="/topik/exam?id=seed_topik1_reading"><Button size="sm" className="mt-3 w-full">TOPIK I — Reading →</Button></Link>
            </>
          )}
        </Card>
        <Card className="p-4">
          <div className="font-semibold text-sm">TOPIK I</div>
          <div className="text-xs text-slate-500">Boshlang‘ich — 2 daraja (1~2급). 30–60 savol, 40–80 daqiqa.</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <span className="rounded-lg bg-slate-100 px-2 py-1.5">Reading 30</span>
            <span className="rounded-lg bg-slate-100 px-2 py-1.5">Listening 30</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="font-semibold text-sm">TOPIK II · EPS</div>
          <div className="text-xs text-slate-500">O‘rta-yuqori va EPS. Yetib kelsa — admin qo‘shadi.</div>
          <Link href="/admin/content"><Button variant="ghost" size="sm" className="mt-3 w-full text-xs">Admin → Kontent</Button></Link>
        </Card>
      </div>

      <div className="flex gap-2 overflow-auto pb-1 -mx-1 px-1">
        {["Barchasi","TOPIK I","TOPIK II","Reading","Listening","Full"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${filter===f ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}>{f}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-500 md:col-span-2 lg:col-span-3">Bu filterda test yo‘q</Card>
        ) : filtered.map(t => (
          <Card key={t.id} className="overflow-hidden flex flex-col hover:shadow-md hover:border-blue-200 transition-all">
            <div className={`h-24 bg-gradient-to-br ${colorFor(t.level, t.type)} p-4 text-white flex flex-col justify-between`}>
              <Badge className="bg-white text-slate-800 w-fit text-[11px]">{t.level} · {t.type}</Badge>
              <div className="font-semibold leading-tight line-clamp-2">{t.title}</div>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5"/> {t.questions} savol</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5"/> {t.time}</span>
              </div>
              <Link href={`/topik/exam?id=${encodeURIComponent(t.id)}`} className="mt-auto"><Button className="w-full">Boshlash →</Button></Link>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-amber-50 border-amber-200 text-sm">
        <span className="font-semibold text-amber-900">Backend: </span>
        <span className="text-amber-800">Testlar MongoDB (`Test`+`Question`) da saqlanadi. Bo‘sh payt /api/topik otomatik 3 ta seed TOPIK I testini qaytaradi; admin POST /api/topik orqali qo‘shadi — darhol ko‘rinadi. Natija localStorage + /api/topik/attempt (agar login bo‘lsa, БД ga yoziladi).</span>
      </Card>
    </div>
  );
}
