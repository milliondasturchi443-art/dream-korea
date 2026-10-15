"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, FileText, PenLine, Headphones, BookOpen, TrendingUp, AlertTriangle } from "lucide-react";

type T = { id: string; title: string; level: string; type: string; questions: number; time: string };
type Attempt = { id: string; testId: string; score: number; total: number; createdAt: string; test?: { title: string; level: string; type: string } };

function gradeTopikI(points: number) { return points >= 140 ? "2급" : points >= 80 ? "1급" : null; }
function gradeTopikII(points: number) { return points >= 230 ? "6급" : points >= 190 ? "5급" : points >= 150 ? "4급" : points >= 120 ? "3급" : null; }

const TOPIC_I_LADDER = [
  { grade: "1급", min: 80 }, { grade: "2급", min: 140 },
];
const TOPIC_II_LADDER = [
  { grade: "3급", min: 120 }, { grade: "4급", min: 150 }, { grade: "5급", min: 190 }, { grade: "6급", min: 230 },
];

function colorFor(level: string, type: string) {
  if (type === "Writing") return "from-rose-600 to-pink-700";
  if (type === "Listening") return "from-emerald-600 to-teal-600";
  if (level === "TOPIK I" && type === "Full") return "from-[#0f1b3d] to-[#2563eb]";
  if (level === "TOPIK II") return "from-violet-600 to-purple-600";
  return "from-blue-600 to-indigo-600";
}

function Ladder({ title, ladder, points, scale }: { title: string; ladder: { grade: string; min: number }[]; points: number | null; scale: number }) {
  const achieved = points == null ? null : (points >= ladder[ladder.length - 1].min ? ladder[ladder.length - 1].grade : ladder.find(l => points < l.min)?.grade ?? null);
  const best = points ?? 0;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-sm">{title}</span>
        <span className="text-xs text-slate-500">{points != null ? `${points}/${scale} ball` : "test topshirmagan"}</span>
      </div>
      <div className="flex gap-1.5">
        {ladder.map(l => {
          const reached = points != null && best >= l.min;
          return (
            <div key={l.grade} className={`flex-1 rounded-lg py-2 text-center text-xs font-bold transition-colors ${reached ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
              {l.grade}
              <div className="text-[10px] font-medium opacity-80">≥{l.min}</div>
            </div>
          );
        })}
      </div>
      {achieved && <p className="mt-2 text-xs font-medium text-emerald-600">Sizning darajangiz: {achieved}</p>}
      {!points && <p className="mt-2 text-xs text-slate-400">Test topshiring — daraja shu yerda ko‘rinadi.</p>}
    </Card>
  );
}

export default function TopikPage() {
  const [tests, setTests] = useState<T[]>([]);
  const [filter, setFilter] = useState("Barchasi");
  const [history, setHistory] = useState<Attempt[]>([]);
  const [hasAuth, setHasAuth] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/topik", { signal: ac.signal }).then(r => r.json()).then(d => { if (Array.isArray(d.tests)) setTests(d.tests); }).catch(() => {});
    try {
      const token = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token");
      if (token) {
        setHasAuth(true);
        fetch("/api/topik/attempt", { headers: { Authorization: `Bearer ${token}` }, signal: ac.signal })
          .then(r => (r.ok ? r.json() : null))
          .then(d => { if (d && Array.isArray(d.attempts)) setHistory(d.attempts as Attempt[]); })
          .catch(() => {});
      }
    } catch {}
    return () => ac.abort();
  }, []);

  const stats = useMemo(() => {
    const iAttempts = history.filter(a => a.test?.level !== "TOPIK II");
    const iiAttempts = history.filter(a => a.test?.level === "TOPIK II");
    const toPoints = (a: Attempt, scale: number) => a.total ? Math.round((a.score / a.total) * scale) : 0;
    const bestI = iAttempts.length ? Math.max(...iAttempts.map(a => toPoints(a, 200))) : null;
    const bestII = iiAttempts.length ? Math.max(...iiAttempts.map(a => toPoints(a, 300))) : null;
    // Weak section analysis: average % by question type across all attempts
    const byType: Record<string, { sum: number; n: number }> = {};
    for (const a of history) {
      const type = a.test?.type || "Boshqa";
      if (!a.total) continue;
      byType[type] = byType[type] || { sum: 0, n: 0 };
      byType[type].sum += (a.score / a.total) * 100;
      byType[type].n += 1;
    }
    const sections = Object.entries(byType).map(([type, v]) => ({ type, avg: Math.round(v.sum / v.n), n: v.n }));
    const weak = sections.length ? sections.reduce((a, b) => (b.avg < a.avg ? b : a)) : null;
    return { bestI, bestII, sections, weak, total: history.length };
  }, [history]);

  const filtered = filter === "Barchasi" ? tests : tests.filter(t => t.level === filter || t.type === filter);

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div className="anim-fade-up">
        <h1 className="text-[22px] font-bold text-slate-900">TOPIK tayyorgarlik</h1>
        <p className="text-sm text-slate-500">Rasmiy bo‘limlar: o‘qish · tinglash · yozish. Natijangiz daraja (급) bo‘yicha tahlil qilinadi.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Card className="p-4 bg-[#eff6ff] border-blue-200">
          <div className="text-xs text-slate-600">Umumiy natija</div>
          {stats.total ? (
            <>
              <div className="text-xl font-extrabold text-[#0f1b3d]">{stats.total} ta test topshirilgan</div>
              <p className="text-xs text-slate-500 mt-1">TOPIK I: {stats.bestI != null ? `${stats.bestI}/200` : "—"} · TOPIK II: {stats.bestII != null ? `${stats.bestII}/300` : "—"}</p>
              <Link href="/topik/result"><Button variant="outline" size="sm" className="mt-3 w-full">Oxirgi natijani ko‘rish</Button></Link>
            </>
          ) : (
            <>
              <div className="text-xl font-extrabold text-[#0f1b3d]">—</div>
              <p className="text-xs text-slate-500 mt-1">Hali test topshirmadingiz — TOPIK I dan boshlang.</p>
              <Link href="/topik/exam?id=seed_topik1_reading"><Button size="sm" className="mt-3 w-full">TOPIK I — Reading →</Button></Link>
            </>
          )}
        </Card>
        <Ladder title="TOPIK I darajalari" ladder={TOPIC_I_LADDER} points={stats.bestI} scale={200} />
        <Ladder title="TOPIK II darajalari" ladder={TOPIC_II_LADDER} points={stats.bestII} scale={300} />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Link href="/topik/exam?id=seed_topik1_reading"><Card className="p-4 hover:shadow-md transition-shadow cursor-pointer"><BookOpen className="h-5 w-5 text-blue-600 mb-2" /><div className="font-semibold text-sm">O‘qish · Reading</div><p className="text-xs text-slate-500 mt-1">Matnlar va savollar — rasmiy uslubda.</p></Card></Link>
        <Link href="/topik/exam?id=seed_topik1_listening"><Card className="p-4 hover:shadow-md transition-shadow cursor-pointer"><Headphones className="h-5 w-5 text-emerald-600 mb-2" /><div className="font-semibold text-sm">Tinglash · Listening</div><p className="text-xs text-slate-500 mt-1">Ovozli savollar — taymer bilan.</p></Card></Link>
        <Link href="/topik/writing"><Card className="p-4 hover:shadow-md transition-shadow cursor-pointer"><PenLine className="h-5 w-5 text-rose-600 mb-2" /><div className="font-semibold text-sm">Yozish · 쓰기</div><p className="text-xs text-slate-500 mt-1">51/53/54 uslubidagi mashqlar + avto-baholash.</p></Card></Link>
      </div>

      <div className="flex gap-2 overflow-auto pb-1 -mx-1 px-1">
        {["Barchasi", "TOPIK I", "TOPIK II", "Reading", "Listening", "Full"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-medium border transition-colors min-h-[36px] ${filter === f ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}>{f}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-500 md:col-span-2 lg:col-span-3">Bu filterda test yo‘q</Card>
        ) : filtered.map(t => (
          <Card key={t.id} className="overflow-hidden flex flex-col hover:shadow-md hover:border-blue-200 transition">
            <div className={`h-24 bg-gradient-to-br ${colorFor(t.level, t.type)} p-4 text-white flex flex-col justify-between`}>
              <Badge className="bg-white text-slate-800 w-fit text-[11px]">{t.level} · {t.type}</Badge>
              <div className="font-semibold leading-tight line-clamp-2">{t.title}</div>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {t.questions} savol</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t.time}</span>
              </div>
              <Link href={`/topik/exam?id=${encodeURIComponent(t.id)}`} className="mt-auto"><Button className="w-full">Boshlash →</Button></Link>
            </div>
          </Card>
        ))}
      </div>

      {stats.weak && (
        <Card className="p-5">
          <div className="flex items-center gap-2 font-semibold text-slate-900"><AlertTriangle className="h-4 w-4 text-amber-500" /> Xatolar tahlili</div>
          <p className="text-xs text-slate-500 mt-1">Bo‘yicha o‘rtacha natijangiz. Pastki bo‘lim — e’tibor qaratish kerak.</p>
          <div className="mt-3 space-y-2">
            {stats.sections.map(s => (
              <div key={s.type} className="flex items-center gap-3">
                <span className="w-24 text-xs font-medium text-slate-700">{s.type}</span>
                <div className="flex-1"><Progress value={s.avg} className={s.avg < 60 ? "[&>div]:bg-red-500" : s.avg < 80 ? "[&>div]:bg-amber-500" : ""} /></div>
                <span className="w-10 text-right text-xs font-bold text-slate-700">{s.avg}%</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs">
            <b>{stats.weak.type}</b> bo‘yicha o‘rtacha {stats.weak.avg}% —{" "}
            {stats.weak.type === "Listening" ? "ko‘proq audio mashq qiling" : stats.weak.type === "Reading" ? "lug‘at va tez o‘qish mashqlari foydali" : "yozish bo‘yicha <Link className='text-blue-600 underline' href='/topik/writing'>写作 mashqlariga o‘ting</Link>"}
          </p>
        </Card>
      )}

      {history.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-blue-600" /> Oxirgi natijalar</h2>
          {history.slice(0, 8).map(a => {
            const pct = a.total ? Math.round((a.score / a.total) * 100) : 0;
            const scale = a.test?.level === "TOPIK II" ? 300 : 200;
            const points = a.total ? Math.round((a.score / a.total) * scale) : 0;
            const g = scale === 300 ? gradeTopikII(points) : gradeTopikI(points);
            return (
              <Card key={a.id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{a.test?.title ?? a.testId}</div>
                  <div className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleDateString("uz-UZ")}</div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  {g && <Badge className="bg-blue-50 text-blue-700 border border-blue-200">{g}</Badge>}
                  <div>
                    <div className="text-sm font-bold text-[#0f1b3d]">{pct}% · {points}p</div>
                    <Link href="/topik/result" className="text-xs text-[#2563eb] hover:underline">tahlil →</Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
