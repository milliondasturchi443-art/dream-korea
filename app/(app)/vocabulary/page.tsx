"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { words, categories } from "@/lib/vocabulary-data";
import { Search, Volume2, Heart, Shuffle, Layers, Gamepad2, Eye, EyeOff, CheckCircle2, XCircle, Trophy } from "lucide-react";
import { toast } from "sonner";
import { speak, stopSpeak } from "@/lib/tts";

type Mode = "list" | "cards" | "quiz";

export default function VocabularyPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Barchasi");
  const [level, setLevel] = useState("Barchasi");
  const [mode, setMode] = useState<Mode>("list");
  const [showTr, setShowTr] = useState(true);
  const [fav, setFav] = useState<Set<string>>(new Set());
  const [learned, setLearned] = useState<Set<string>>(new Set());

  // flashcard
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // quiz
  const [quizSet, setQuizSet] = useState<number[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const f = localStorage.getItem("dk_vocab_fav");
      if (f) setFav(new Set(JSON.parse(f)));
      const l = localStorage.getItem("dk_vocab_learned");
      if (l) setLearned(new Set(JSON.parse(l)));
    } catch {}
  }, []);
  function save(key: string, s: Set<string>) { try { localStorage.setItem(key, JSON.stringify([...s])); } catch {} }

  const filtered = useMemo(() => words.filter(v => {
    if (cat !== "Barchasi" && v.cat !== cat) return false;
    if (level !== "Barchasi" && v.level !== level) return false;
    if (q && !(`${v.ko} ${v.uz} ${v.tr}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [q, cat, level]);

  function pickRandom() {
    const rnd = words[Math.floor(Math.random() * words.length)];
    speak(rnd.ko);
    toast.info(`${rnd.ko} (${rnd.tr}) — ${rnd.uz}`);
  }

  function toggleFav(ko: string) { const n = new Set(fav); n.has(ko) ? n.delete(ko) : n.add(ko); setFav(n); save("dk_vocab_fav", n); }
  function toggleLearned(ko: string) { const n = new Set(learned); n.has(ko) ? n.delete(ko) : n.add(ko); setLearned(n); save("dk_vocab_learned", n); }

  // --- flashcards ---
  function startCards() {
    if (!filtered.length) { toast.error("So'z topilmadi"); return; }
    setMode("cards"); setCardIdx(0); setFlipped(false);
  }
  function cardNext() { setFlipped(false); setCardIdx(i => (i + 1) % filtered.length); markLearnedCard(); }
  function cardPrev() { setFlipped(false); setCardIdx(i => (i - 1 + filtered.length) % filtered.length); }
  function markLearnedCard() { const w = filtered[cardIdx]; if (w) toggleLearned(w.ko); }

  // --- quiz ---
  function buildQuiz() {
    if (filtered.length < 4) { toast.error("Kamida 4 ta so'z kerak"); return; }
    const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, Math.min(10, filtered.length));
    setQuizSet(shuffled.map(w => filtered.indexOf(w))); setQuizIdx(0); setPicked(null); setScore(0); setDone(false); setMode("quiz");
  }
  const curQ = quizSet.length ? filtered[quizSet[quizIdx]] : null;
  const options = useMemo(() => {
    if (!curQ) return [];
    const pool = words.filter(w => w.uz !== curQ.uz);
    const others: string[] = [];
    while (others.length < 3 && pool.length) {
      const r = pool[Math.floor(Math.random() * pool.length)];
      if (r && !others.includes(r.uz)) others.push(r.uz);
    }
    return [...others, curQ.uz].sort(() => Math.random() - 0.5);
  }, [curQ, quizIdx]);

  function answerQuiz(opt: string) {
    if (picked !== null) return;
    setPicked(opt);
    const ok = curQ && opt === curQ.uz;
    if (ok) setScore(s => s + 1);
    if (curQ) speak(curQ.ko);
    setTimeout(() => {
      if (quizIdx + 1 >= quizSet.length) { setDone(true); return; }
      setQuizIdx(i => i + 1); setPicked(null);
    }, 1100);
  }

  const pctLearned = filtered.length ? Math.round([...filtered].filter(w => learned.has(w.ko)).length / filtered.length * 100) : 0;

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">Lug‘at</h1>
          <p className="text-sm text-slate-500">220+ so‘z · 16 kategoriya · ovoz, kartochkalar, test, saqlanganlar</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={pickRandom}><Shuffle className="h-4 w-4 mr-1"/> Tasodifiy</Button>
          <Button variant="outline" onClick={startCards}><Layers className="h-4 w-4 mr-1"/> Kartochka</Button>
          <Button onClick={buildQuiz}><Gamepad2 className="h-4 w-4 mr-1"/> Test</Button>
        </div>
      </div>

      {/* mode tabs */}
      <div className="flex gap-2">
        {(["list", "cards", "quiz"] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${mode===m ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : "bg-white border-slate-200 text-slate-600"}`}>
            {m === "list" ? "Ro'yxat" : m === "cards" ? "Kartochka" : "Test"}
          </button>
        ))}
      </div>

      {/* filters */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Qidiruv — 사랑, do'st, ..." className="pl-9" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <button onClick={() => setShowTr(s => !s)} className="px-3 py-1.5 rounded-full text-xs font-medium border bg-white border-slate-200 text-slate-600 flex items-center gap-1">
            {showTr ? <Eye className="h-3.5 w-3.5"/> : <EyeOff className="h-3.5 w-3.5"/>} Transliteration
          </button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["Barchasi", ...["A1", "A2", "B1"]].map(l => (
            <button key={l} onClick={() => setLevel(l)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${level===l ? "bg-[#2563eb] text-white border-[#2563eb]" : "bg-white border-slate-200 text-slate-600"}`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["Barchasi", ...categories.map(c => c.id)].map(cid => {
            const c = categories.find(x => x.id === cid);
            const label = cid === "Barchasi" ? "Barchasi" : `${c?.icon} ${c?.title}`;
            return (
              <button key={cid} onClick={() => setCat(cid)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${cat===cid ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : "bg-white border-slate-200 text-slate-600"}`}>{label}</button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 shrink-0">O'zlashtirilgan: {pctLearned}%</span>
          <Progress value={pctLearned} className="flex-1" />
          <span className="text-xs text-slate-500 shrink-0">{filtered.length} so'z</span>
        </div>
      </Card>

      {/* LIST MODE */}
      {mode === "list" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 && <Card className="p-8 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">So'z topilmadi</Card>}
          {filtered.map((v) => {
            const isFav = fav.has(v.ko);
            const isLearned = learned.has(v.ko);
            return (
              <Card key={v.ko+v.cat} className={`p-4 hover:shadow-md transition-shadow ${isLearned ? "border-emerald-200 bg-emerald-50/30" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">{v.level}</Badge>
                  <div className="flex gap-1">
                    <button onClick={() => toggleLearned(v.ko)} className={`h-8 w-8 rounded-full grid place-items-center border ${isLearned ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-white border-slate-200 text-slate-400"}`}><CheckCircle2 className={`h-4 w-4 ${isLearned?"text-emerald-600":""}`}/></button>
                    <button onClick={() => toggleFav(v.ko)} className={`h-8 w-8 rounded-full grid place-items-center border ${isFav ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-slate-200 text-slate-400"}`}><Heart className={`h-4 w-4 ${isFav?"fill-rose-500":""}`}/></button>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                    {v.ko}
                    <button onClick={() => { stopSpeak(); speak(v.ko); }} className="h-7 w-7 rounded-full bg-[#2563eb] text-white grid place-items-center hover:bg-[#1d4ed8]"><Volume2 className="h-3.5 w-3.5"/></button>
                  </div>
                  {showTr && <div className="text-xs text-slate-400 mt-0.5">{v.tr}</div>}
                  <div className="text-sm font-medium text-slate-700 mt-1">{v.uz}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CARDS MODE */}
      {mode === "cards" && filtered[cardIdx] && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{cardIdx + 1} / {filtered.length}</span>
            <Progress value={(cardIdx / filtered.length) * 100} className="w-40" />
          </div>
          <div onClick={() => { setFlipped(f => !f); speak(filtered[cardIdx].ko); }} className="cursor-pointer select-none">
            <Card className={`p-8 min-h-[240px] grid place-items-center text-center transition-colors ${flipped ? "bg-[#0f1b3d]" : "bg-white"}`}>
              {!flipped ? (
                <div>
                  <div className="text-5xl font-extrabold text-slate-900">{filtered[cardIdx].ko}</div>
                  {showTr && <div className="text-sm text-slate-400 mt-2">{filtered[cardIdx].tr}</div>}
                  <div className="text-xs text-slate-400 mt-6">Ochish uchun bosing</div>
                </div>
              ) : (
                <div>
                  <div className="text-3xl font-bold text-white">{filtered[cardIdx].uz}</div>
                  <div className="text-sm text-blue-200 mt-2">{filtered[cardIdx].ko} · {filtered[cardIdx].tr}</div>
                  <div className="text-xs text-white/50 mt-6">Keyingisiga o'tish uchun bosing</div>
                </div>
              )}
            </Card>
          </div>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={cardPrev}>◀ Oldingi</Button>
            <Button variant="outline" onClick={() => { stopSpeak(); speak(filtered[cardIdx].ko); }}><Volume2 className="h-4 w-4 mr-1"/> Eshitish</Button>
            <Button variant="outline" onClick={() => toggleLearned(filtered[cardIdx].ko)} className={learned.has(filtered[cardIdx].ko) ? "border-emerald-300 text-emerald-600" : ""}><CheckCircle2 className="h-4 w-4 mr-1"/> O'zlashtirdim</Button>
            <Button onClick={cardNext}>Keyingi ▶</Button>
          </div>
        </div>
      )}

      {/* QUIZ MODE */}
      {mode === "quiz" && (
        <Card className="p-6">
          {done ? (
            <div className="text-center py-6 space-y-3">
              <Trophy className="h-12 w-12 mx-auto text-amber-500" />
              <div className="text-3xl font-extrabold text-slate-900">{score} / {quizSet.length}</div>
              <p className="text-sm text-slate-500">{score >= quizSet.length * 0.8 ? "Ajoyib! 🎉" : score >= quizSet.length * 0.5 ? "Yaxshi!" : "Yana bir bor urinib ko'ring."}</p>
              <div className="flex justify-center gap-2 pt-2">
                <Button variant="outline" onClick={buildQuiz}>Qayta ishlash</Button>
                <Button onClick={() => setMode("list")}>Lug'atga qaytish</Button>
              </div>
            </div>
          ) : curQ ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Savol {quizIdx + 1} / {quizSet.length}</span>
                <span className="font-semibold text-[#0f1b3d]">Ball: {score}</span>
              </div>
              <Progress value={(quizIdx / quizSet.length) * 100} />
              <div className="text-center py-4">
                <div className="text-4xl font-extrabold text-slate-900">{curQ.ko}</div>
                {showTr && <div className="text-sm text-slate-400 mt-1">{curQ.tr}</div>}
                <p className="text-sm text-slate-500 mt-2">Bu so'zning ma'nosi qaysi?</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => { stopSpeak(); speak(curQ.ko); }}><Volume2 className="h-4 w-4 mr-1"/> Eshitish</Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {options.map((o, i) => {
                  const isRight = o === curQ.uz;
                  const isPicked = picked === o;
                  let cls = "border-slate-200 bg-white hover:border-blue-300 text-slate-800";
                  if (picked !== null) {
                    if (isRight) cls = "border-emerald-300 bg-emerald-50 text-emerald-700";
                    else if (isPicked) cls = "border-red-300 bg-red-50 text-red-600";
                    else cls = "border-slate-200 bg-white text-slate-400";
                  }
                  return (
                    <button key={i} onClick={() => answerQuiz(o)} disabled={picked !== null}
                      className={`text-left rounded-xl border-2 p-3 text-sm font-medium flex items-center gap-2 transition-colors ${cls}`}>
                      {picked !== null && isRight && <CheckCircle2 className="h-4 w-4 shrink-0"/>}
                      {picked !== null && isPicked && !isRight && <XCircle className="h-4 w-4 shrink-0"/>}
                      {o}
                    </button>
                  );
                })}
              </div>
              {picked !== null && <p className={`text-sm font-medium text-center ${picked === curQ.uz ? "text-emerald-600" : "text-red-600"}`}>{picked === curQ.uz ? "To'g'ri! ✓" : `Noto'g'ri. To'g'ri: ${curQ.uz}`}</p>}
            </div>
          ) : <p className="text-sm text-slate-500">Test tayyorlanmoqda…</p>}
        </Card>
      )}
    </div>
  );
}
