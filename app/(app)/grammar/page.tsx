"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { grammarFolders, type GrammarExercise, type GrammarTopic } from "@/lib/grammar-data";
import {
  XP, DAILY_TASK, levels, levelOf, achievements, checkAchievements, comboBonus,
  emptyProfile, loadProfile, saveProfile, today, type Profile,
} from "@/lib/grammar-gamify";
import { speak, stopSpeak } from "@/lib/tts";
import { toast } from "sonner";
import {
  Search, CheckCircle2, XCircle, ChevronRight, ChevronLeft, Volume2, Lightbulb,
  Star, RotateCcw, Dices, Eye, EyeOff, Trophy, BookOpen, Layers, Target,
  Check, Sparkles, AlertTriangle, Shuffle,
} from "lucide-react";

type Mode = "lesson" | "test" | "cards" | "profile";
type Floater = { id: number; text: string };
type Level = "all" | "A1" | "A2" | "B1";

const LS = {
  learned: "dk_grammar_learned",
  fav: "dk_grammar_fav",
  picked: "dk_grammar_picked",
  best: "dk_grammar_best",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

type TestQ = { ex: GrammarExercise; key: string; topicTitle: string };

export default function GrammarPage() {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<Level>("all");
  const [folderId, setFolderId] = useState<string>("particles");
  const [topicId, setTopicId] = useState<string>("p-1");
  const [mode, setMode] = useState<Mode>("lesson");
  const [onlyFav, setOnlyFav] = useState(false);
  const [showUz, setShowUz] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);

  // Persistent user state
  const [learned, setLearned] = useState<Record<string, boolean>>({});
  const [fav, setFav] = useState<string[]>([]);
  const [picked, setPicked] = useState<Record<string, number | null>>({});
  const [best, setBest] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);

  // Test state
  const [tIdx, setTIdx] = useState(0);
  const [tPick, setTPick] = useState<Record<number, number | null>>({});
  const [tDone, setTDone] = useState(false);

  // Cards state
  const [cIdx, setCIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Record<number, boolean>>({});

  // O'yinlashgan tizim: ball, daraja, seriya, yutuqlar
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [combo, setCombo] = useState(0);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [retried, setRetried] = useState<Record<string, boolean>>({});
  const floaterId = useRef(0);

  useEffect(() => {
    setLearned(load(LS.learned, {}));
    setFav(load<string[]>(LS.fav, []));
    setPicked(load<Record<string, number | null>>(LS.picked, {}));
    setBest(load<Record<string, number>>(LS.best, {}));
    setProfile(loadProfile());
    setHydrated(true);
  }, []);

  const folder = grammarFolders.find(f => f.id === folderId) ?? grammarFolders[0];
  const topic: GrammarTopic | null = folder?.topics.find(t => t.id === topicId) ?? folder?.topics[0] ?? null;

  const search = q.trim().toLowerCase();

  const filteredFolders = useMemo(() => {
    return grammarFolders
      .map(f => ({
        ...f,
        topics: f.topics.filter(t => {
          if (level !== "all" && t.level !== level) return false;
          if (onlyFav && !fav.includes(t.id)) return false;
          if (!search) return true;
          const hay = `${t.title} ${t.roman ?? ""} ${t.desc} ${t.pattern} ${t.explain} ${t.mistake ?? ""} ${t.examples.map(e => `${e.ko} ${e.uz}`).join(" ")}`.toLowerCase();
          return hay.includes(search) || f.title.toLowerCase().includes(search);
        }),
      }))
      .filter(f => f.topics.length > 0);
  }, [level, onlyFav, fav, search]);

  const totalTopics = grammarFolders.reduce((n, f) => n + f.topics.length, 0);
  const learnedCount = hydrated ? Object.values(learned).filter(Boolean).length : 0;
  const favCount = fav.length;

  const testQs: TestQ[] = useMemo(
    () => (folder ? folder.topics.flatMap(t => t.exercises.map((ex, i) => ({ ex, key: `${t.id}:${i}`, topicTitle: t.title }))) : []),
    [folder]
  );
  const cardQs = useMemo(
    () => (folder ? folder.topics.flatMap(t => t.examples.map(e => ({ ...e, topic: t.title }))) : []),
    [folder]
  );

  const currentTest = testQs[tIdx];
  const testScore = useMemo(() => {
    let right = 0;
    testQs.forEach((t, i) => { if (tPick[i] !== null && tPick[i] !== undefined && tPick[i] === t.ex.correct) right++; });
    return right;
  }, [testQs, tPick]);

  function goFolder(fid: string) {
    setFolderId(fid);
    const f = grammarFolders.find(x => x.id === fid);
    if (f?.topics[0]) setTopicId(f.id === folderId ? topicId : f.topics[0].id);
    setMode("lesson");
    resetTest();
  }
  function resetTest() { setTIdx(0); setTPick({}); setTDone(false); }
  function resetCards() { setCIdx(0); setFlipped(false); setKnownCards({}); }

  function float(text: string) {
    const id = ++floaterId.current;
    setFloaters(f => [...f, { id, text }]);
    setTimeout(() => setFloaters(f => f.filter(x => x.id !== id)), 1200);
  }

  /** Profilni saqlaydi va yangi yutuqlarni ochadi */
  function commit(p: Profile, L?: Record<string, boolean>, B?: Record<string, number>) {
    const learnedMap = L ?? learned;
    const bestMap = B ?? best;
    const folderDone = grammarFolders.filter(f => f.topics.every(t => learnedMap[t.id])).map(f => f.id);
    const newly = checkAchievements({ profile: p, learned: learnedMap, best: bestMap, folderDone, folderId });
    const final = newly.length ? { ...p, achievements: [...p.achievements, ...newly.map(a => a.id)] } : p;
    saveProfile(final);
    setProfile(final);
    newly.forEach((a, i) => setTimeout(() =>
      toast.success(`Yutuq ochildi — ${a.title}`, { description: a.desc, duration: 4000 }), i * 450));
    return final;
  }

  /** To'g'ri/noto'g'ri javob uchun ball beradi */
  function award(correct: boolean, firstTry = true) {
    const p: Profile = { ...profile, answered: profile.answered + 1 };
    let gain = 0;
    if (correct) {
      p.correct = profile.correct + 1;
      const c = combo + 1;
      setCombo(c);
      p.bestCombo = Math.max(profile.bestCombo, c);
      gain = (firstTry ? XP.correct : XP.correctRetry) + comboBonus(c);
      if (c === 3 || c === 5 || c === 10 || c === 15) toast.success(`Combo x${c} — bonus +${comboBonus(c)} XP`);
    } else {
      if (combo >= 3) toast.info(`Combo uzildi (${combo}) — qayta urinib ko'ring`);
      setCombo(0);
    }

    // kunlik vazifa
    const t = today();
    const d = profile.daily.day === t ? profile.daily : { day: t, count: 0, claimed: false };
    const count = d.count + 1;
    p.daily = { day: t, count, claimed: d.claimed };
    if (count >= DAILY_TASK && !d.claimed) {
      p.daily.claimed = true;
      gain += XP.daily;
      toast.success(`Kunlik vazifa bajarildi! +${XP.daily} XP`, { duration: 4000 });
    }

    if (gain > 0) { p.xp = profile.xp + gain; float(`+${gain}`); }
    commit(p);
  }

  function toggleLearn(id: string) {
    if (!hydrated) return;
    const was = !!learned[id];
    const next = { ...learned, [id]: !was };
    setLearned(next);
    save(LS.learned, next);

    const learnedNext = Object.values(next).filter(Boolean).length;
    const p: Profile = { ...profile, topicsLearned: learnedNext };
    if (!was) {
      p.xp = profile.xp + XP.learn;
      float(`+${XP.learn}`);
      const f = grammarFolders.find(x => x.topics.some(t => t.id === id));
      if (f && f.topics.every(t => next[t.id])) {
        toast.success(`Ajoyib! "${f.title}" papkasini to'liq o'zlashtirdingiz!`, { description: `+${XP.learn} XP`, duration: 4000 });
      } else {
        toast.success(`Mavzu o'zlashtirildi ✓ +${XP.learn} XP`);
      }
    }
    commit(p, next);
  }

  function toggleFav(id: string) {
    if (!hydrated) return;
    setFav(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      save(LS.fav, next);
      return next;
    });
  }

  function answerExercise(key: string, oi: number, correct: number) {
    if (picked[key] !== null && picked[key] !== undefined) return;
    setPicked(prev => {
      const next = { ...prev, [key]: oi };
      save(LS.picked, next);
      return next;
    });
    award(oi === correct, !retried[key]);
  }
  function retryExercise(key: string) {
    setRetried(r => ({ ...r, [key]: true }));
    setPicked(prev => { const n = { ...prev }; delete n[key]; save(LS.picked, n); return n; });
  }

  function say(text: string, key: string) {
    const t = (text || "").trim();
    if (!t) return;
    if (speaking === key) { stopSpeak(); setSpeaking(null); return; }
    stopSpeak();
    setSpeaking(key);
    const ok = speak(t);
    if (!ok) { setSpeaking(null); return; }
    setTimeout(() => setSpeaking(cur => (cur === key ? null : cur)), Math.max(1500, t.length * 140));
  }

  function randomTopic() {
    const pool = filteredFolders.flatMap(f => f.topics.map(t => ({ t, fid: f.id })));
    if (!pool.length) { toast.error("Qidiruv bo'yicha mavzu topilmadi"); return; }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setFolderId(pick.fid);
    setTopicId(pick.t.id);
    setMode("lesson");
    resetTest();
    toast.info(`Tasodifiy mavzu: ${pick.t.title}`);
  }

  function stepTopic(dir: 1 | -1) {
    if (!folder || !topic) return;
    const i = folder.topics.findIndex(t => t.id === topic.id);
    const n = i + dir;
    if (n < 0 || n >= folder.topics.length) return;
    setTopicId(folder.topics[n].id);
  }

  function finishTest() {
    const pct = testQs.length ? Math.round((testScore / testQs.length) * 100) : 0;
    setTDone(true);
    let gain = Math.round(pct * 1.5) + (pct === 100 ? XP.testPerfect : 0);
    gain = Math.min(300, gain);
    const p: Profile = { ...profile, xp: profile.xp + gain };
    let bestMap = best;
    if (folder) {
      bestMap = { ...best, [folder.id]: Math.max(best[folder.id] ?? 0, pct) };
      setBest(bestMap);
      save(LS.best, bestMap);
      p.history = [{ at: Date.now(), pct, score: testScore, total: testQs.length, folderId: folder.id, folderTitle: folder.title }, ...profile.history].slice(0, 20);
    }
    if (gain > 0) float(`+${gain}`);
    commit(p, learned, bestMap);
    if (pct >= 80) toast.success(`Ajoyib! ${pct} ball  ·  +${gain} XP`);
    else if (pct >= 50) toast.info(`${pct} ball — yaxshi, biroz ko'proq mashq qiling (+${gain} XP)`);
    else toast.error(`${pct} ball — mavzuni qayta o'qing (+${gain} XP)`);
  }

  function pickTest(i: number, oi: number, correct: number) {
    if (tPick[i] !== null && tPick[i] !== undefined) return;
    setTPick(prev => ({ ...prev, [i]: oi }));
    award(oi === correct, true);
  }

  function resetAll() {
    if (!confirm("Barcha grammatika progressi (ball, mavzu, yutuqlar) o'chirilsinmi?")) return;
    [LS.learned, LS.fav, LS.picked, LS.best, "dk_grammar_profile"].forEach(k => localStorage.removeItem(k));
    setLearned({}); setFav([]); setPicked({}); setBest({});
    setProfile(emptyProfile()); setCombo(0);
    toast.success("Progress tozalandi");
  }

  const pctAll = totalTopics ? Math.round((learnedCount / totalTopics) * 100) : 0;
  const lvl = levelOf(profile.xp);
  const unlocked = profile.achievements.length;
  const accuracy = profile.answered ? Math.round((profile.correct / profile.answered) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1180px] p-4 lg:p-6 space-y-5">
      {/* ── Sarlavha — легко и чисто ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-[#2563eb] text-white grid place-items-center text-[16px]">문</span>
            Grammatika
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            <span className="font-semibold text-slate-700">{grammarFolders.length} papka</span> · {totalTopics} mavzu · {grammarFolders.reduce((n, f) => n + f.topics.reduce((m, t) => m + t.exercises.length, 0), 0)} mashq
            <span className="hidden sm:inline"> — har bir qoida formula + misol + xato</span>
          </p>
        </div>
        <button onClick={() => setMode("profile")}
          className="text-xs font-semibold text-[#2563eb] hover:underline hidden sm:inline-flex items-center gap-1">
          Yutuqlar va statistika <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Герой: уровень + общий прогресс — всего 2 элемента ── */}
      <div className="rounded-[20px] border border-slate-200 bg-white p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 shadow-sm">
        {/* Level — компактно, с полётом XP */}
        <div className="relative flex items-center gap-3 min-w-0 flex-1">
          <div className="h-12 w-12 rounded-2xl grid place-items-center text-2xl shrink-0" style={{ background: `${lvl.cur.color}14`, border: `1px solid ${lvl.cur.color}22` }}>{lvl.cur.icon}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-black" style={{ color: lvl.cur.color }}>{lvl.cur.name}</span>
              <span className="text-xs font-bold text-slate-400">{profile.xp} XP</span>
              {combo >= 3 && <span className="text-[11px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700"> x{combo}</span>}
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden max-w-[260px]">
              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${lvl.pct}%`, background: lvl.cur.color }} />
            </div>
            <div className="text-[11px] text-slate-400 mt-1 leading-none">
              {lvl.next ? <><span className="font-semibold text-slate-600">{lvl.toNext} XP</span> → {lvl.next.icon} {lvl.next.name}</> : "Maksimal daraja 👑"}
              <span className="mx-1.5 text-slate-300">·</span>
              <button onClick={() => setMode("profile")} className="font-semibold text-[#2563eb] hover:underline">batafsil →</button>
            </div>
          </div>
          {/* XP вспышка */}
          {floaters.map(f => (
            <span key={f.id}
              className="xp-float absolute left-14 -top-1 z-30 pointer-events-none text-sm font-black text-emerald-600 whitespace-nowrap"
              style={{ textShadow: "0 1px 0 #fff, 0 0 10px #d1fae5" }}>
              {f.text}
            </span>
          ))}
        </div>

        {/* Общий прогресс — круг + цифры */}
        <div className="flex items-center gap-3 sm:border-l sm:border-slate-100 sm:pl-4 shrink-0">
          <div className="relative h-14 w-14 shrink-0">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="4" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${pctAll} 100`} className="transition-[stroke-dasharray] duration-700" />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-[11px] font-black text-[#2563eb]">{pctAll}%</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-black text-slate-900">{learnedCount} / {totalTopics}</div>
            <div className="text-[11px] font-semibold text-slate-400">mavzu o&apos;zlashtirildi</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" /> {favCount} sevimli</span>
              {profile.streak > 0 && <span className="inline-flex items-center gap-1"><span className="streak-flame">🔥</span> {profile.streak} kun</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Qidiruv + filtrlar ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Qidirish — 입니다, 에, «bor» …"
            className="pl-9"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
          {(["all", "A1", "A2", "B1"] as Level[]).map(l => (
            <button key={l} onClick={() => setLevel(l)}
              className={`px-3 h-9 text-xs font-semibold transition ${level === l ? "bg-[#0f1b3d] text-white" : "text-slate-500 hover:bg-slate-50"}`}>
              {l === "all" ? "Barchasi" : l}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" className="h-9" onClick={() => setOnlyFav(v => !v)}>
          <Star className={`h-4 w-4 mr-1 ${onlyFav ? "fill-amber-400 text-amber-500" : ""}`} /> Sevimlilar
        </Button>
        <Button size="sm" variant="outline" className="h-9" onClick={randomTopic}>
          <Dices className="h-4 w-4 mr-1" /> Tasodifiy
        </Button>
      </div>

      {/* ── Papkalar ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredFolders.map(f => {
          const done = f.topics.filter(t => learned[t.id]).length;
          const p = f.topics.length ? Math.round((done / f.topics.length) * 100) : 0;
          const active = folderId === f.id;
          return (
            <button key={f.id} onClick={() => goFolder(f.id)}
              className={`text-left rounded-2xl border p-4 flex flex-col gap-2.5 transition ${active ? "shadow-md border-transparent" : "bg-white border-slate-200 hover:border-slate-300"}`}
              style={active ? { borderColor: f.accent, background: f.soft } : undefined}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl leading-none">{f.icon}</span>
                  <span className="font-bold text-sm text-slate-900 truncate">{f.title}</span>
                </div>
                {p === 100 && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
              </div>
              <div className="text-xs text-slate-500 leading-relaxed line-clamp-2">{f.desc}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-[width]" style={{ width: `${p}%`, background: f.accent }} />
                </div>
                <span className="text-[11px] font-semibold text-slate-500">{done}/{f.topics.length}</span>
              </div>
              {best[f.id] !== undefined && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                  <Trophy className="h-3 w-3" /> Eng yaxshi: {best[f.id]}%
                </div>
              )}
            </button>
          );
        })}
        {filteredFolders.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-4 text-center text-sm text-slate-500 py-8">
            Hech narsa topilmadi — qidiruvni tozalang
          </div>
        )}
      </div>

      {/* ── Rejimlar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
          {([
            { id: "lesson", label: "Mavzu", icon: BookOpen },
            { id: "test", label: "Test", icon: Target },
            { id: "cards", label: "Kartalar", icon: Layers },
            { id: "profile", label: `Yutuqlar${unlocked ? ` (${unlocked})` : ""}`, icon: Trophy },
          ] as { id: Mode; label: string; icon: typeof BookOpen }[]).map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); if (m.id === "test") resetTest(); if (m.id === "cards") resetCards(); }}
              className={`px-4 h-9 text-xs font-bold flex items-center gap-1.5 transition ${mode === m.id ? "bg-[#0f1b3d] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              {m.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">
          {mode === "lesson" && "Mavzu-qoida misollar bilan"}
          {mode === "test" && `${testQs.length} savollik test`}
          {mode === "cards" && `${cardQs.length} karta — tarjimani yashirib mashq qiling`}
          {mode === "profile" && `${unlocked}/${achievements.length} yutuq ochildi`}
        </span>
        <Button size="sm" variant="ghost" className="h-9 ml-auto" onClick={() => setShowUz(v => !v)}>
          {showUz ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          {showUz ? "Tarjimani yashirish" : "Tarjimani ko'rsatish"}
        </Button>
      </div>

      {/* ══ Mavzu rejimi ══ */}
      {mode === "lesson" && (
        <div className="grid lg:grid-cols-[300px_1fr] gap-4">
          {/* Mavzular ro'yxati */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">{folder.title}</div>
            {folder.topics.map(t => {
              const active = topicId === t.id;
              const isLearned = !!learned[t.id];
              const isFav = fav.includes(t.id);
              return (
                <button key={t.id} onClick={() => setTopicId(t.id)}
                  className={`w-full text-left rounded-2xl border p-3 flex items-center justify-between gap-2 transition ${active ? "text-white border-transparent shadow" : "bg-white border-slate-200 hover:border-slate-300"}`}
                  style={active ? { background: folder.accent } : undefined}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-sm truncate ${active ? "text-white" : "text-slate-900"}`}>{t.title}</span>
                      {isFav && <Star className={`h-3 w-3 shrink-0 fill-amber-400 ${active ? "" : "text-amber-500"}`} />}
                    </div>
                    <div className={`text-xs truncate ${active ? "text-white/75" : "text-slate-500"}`}>{t.desc}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isLearned ? (
                      <CheckCircle2 className={`h-4 w-4 ${active ? "text-white" : "text-emerald-500"}`} />
                    ) : (
                      <Badge className={`text-[10px] ${active ? "bg-white/20 text-white border-white/30" : "bg-slate-50 border-slate-200 text-slate-500"}`}>{t.level}</Badge>
                    )}
                    <ChevronRight className={`h-3.5 w-3.5 ${active ? "text-white/70" : "text-slate-300"}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mavzu kontenti */}
          <Card className="p-5 lg:p-6">
            {!topic ? (
              <div className="text-sm text-slate-500">Mavzuni tanlang</div>
            ) : (
              <div className="space-y-5">
                {/* Sarlavha + amallar */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {topic.title}
                      {topic.roman && <span className="font-normal text-slate-400 text-sm ml-2">· {topic.roman}</span>}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[11px]">{topic.level}</Badge>
                      <span className="text-sm text-slate-500">{topic.desc}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleFav(topic.id)}>
                      <Star className={`h-4 w-4 mr-1 ${fav.includes(topic.id) ? "fill-amber-400 text-amber-500" : ""}`} />
                      {fav.includes(topic.id) ? "Saqlangan" : "Sevimli"}
                    </Button>
                    <Button size="sm" variant={learned[topic.id] ? "default" : "outline"}
                      className={learned[topic.id] ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                      onClick={() => toggleLearn(topic.id)}>
                      <Check className="h-4 w-4 mr-1" /> {learned[topic.id] ? "O'zlashtirildi" : "O'zlashtirdim"}
                    </Button>
                  </div>
                </div>

                {/* Formula */}
                <div className="rounded-2xl p-4 border-2 flex items-start gap-3" style={{ background: folder.soft, borderColor: folder.accent }}>
                  <div className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: folder.accent }}>
                    f
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: folder.accent }}>Qoida / Formula</div>
                    <div className="text-lg font-extrabold text-slate-900 break-words">{topic.pattern}</div>
                  </div>
                </div>

                {/* Izoh */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                    <Lightbulb className="h-4 w-4 text-amber-500" /> Tushuntirish
                  </div>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{topic.explain}</p>
                </div>

                {/* Misollar */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">Misollar</span>
                    <button onClick={() => setShowUz(v => !v)} className="text-xs text-[#2563eb] font-semibold flex items-center gap-1 hover:underline">
                      {showUz ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showUz ? "Yashirish" : "Tarjimani ochish"}
                    </button>
                  </div>
                  {topic.examples.map((ex, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 flex items-start gap-3 hover:border-slate-300 transition">
                      <button onClick={() => say(ex.ko, `${topic.id}-${i}`)}
                        className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition ${speaking === `${topic.id}-${i}` ? "bg-emerald-500 text-white" : "bg-[#eff6ff] text-[#2563eb] hover:bg-blue-100"}`}
                        title="Tinglash">
                        <Volume2 className="h-4 w-4" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-semibold text-slate-900 break-words">{ex.ko}</div>
                        <div className={`text-sm mt-0.5 transition-[color,filter] ${showUz ? "text-slate-500" : "text-slate-300 select-none blur-[3px]"}`}>
                          {showUz ? `— ${ex.uz}` : "— tarjima yashirilgan"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ko'p xato */}
                {topic.mistake && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-amber-800">
                      <AlertTriangle className="h-4 w-4" /> Ko&apos;p uchraydigan xato
                    </div>
                    <p className="text-sm text-amber-900/80 mt-1.5 leading-relaxed">{topic.mistake}</p>
                  </div>
                )}

                {/* Mashqlar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#0f1b3d]">Mashqlar ({topic.exercises.length})</span>
                    <span className="text-xs text-slate-400">
                      {topic.exercises.filter((_, i) => picked[`${topic.id}:${i}`] === (topic.exercises[i].correct)).length} / {topic.exercises.length} to&apos;g&apos;ri
                    </span>
                  </div>
                  {topic.exercises.map((ex, ei) => {
                    const key = `${topic.id}:${ei}`;
                    const myPick = picked[key] ?? null;
                    const answered = myPick !== null;
                    const isRight = answered && myPick === ex.correct;
                    return (
                      <div key={ei} className="rounded-xl border p-4" style={{ background: folder.soft, borderColor: `${folder.accent}33` }}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{ei + 1}. {ex.q}</p>
                          {answered && (
                            <button onClick={() => retryExercise(key)} className="shrink-0 text-[11px] font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1">
                              <RotateCcw className="h-3 w-3" /> Qayta
                            </button>
                          )}
                        </div>
                        {ex.hint && !answered && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Lightbulb className="h-3 w-3" /> {ex.hint}</p>
                        )}
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {ex.options.map((opt, oi) => {
                            const isCorrect = ex.correct === oi;
                            const chosen = myPick === oi;
                            let cls = "bg-white border-slate-200 text-slate-800 hover:border-slate-300";
                            if (answered) {
                              if (isCorrect) cls = "bg-emerald-50 border-emerald-300 text-emerald-700";
                              else if (chosen) cls = "bg-red-50 border-red-300 text-red-600";
                              else cls = "bg-white border-slate-200 text-slate-400";
                            }
                            return (
                              <Button key={oi} size="sm" variant="outline" className={cls}
                                onClick={() => answerExercise(key, oi, ex.correct)}>
                                {opt}
                                {answered && isCorrect && <CheckCircle2 className="h-4 w-4 ml-1" />}
                                {answered && chosen && !isCorrect && <XCircle className="h-4 w-4 ml-1" />}
                              </Button>
                            );
                          })}
                        </div>
                        {answered && (
                          <p className={`text-sm mt-2.5 font-semibold ${isRight ? "text-emerald-600" : "text-red-600"}`}>
                            {isRight ? "To'g'ri! ✓" : `Noto'g'ri. To'g'ri javob: ${ex.options[ex.correct]}`}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Navigatsiya */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <Button size="sm" variant="outline" disabled={folder.topics.findIndex(t => t.id === topic.id) === 0}
                    onClick={() => stepTopic(-1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Oldingi
                  </Button>
                  <span className="text-xs text-slate-400">
                    {folder.topics.findIndex(t => t.id === topic.id) + 1} / {folder.topics.length}
                  </span>
                  <Button size="sm" variant="outline"
                    disabled={folder.topics.findIndex(t => t.id === topic.id) === folder.topics.length - 1}
                    onClick={() => stepTopic(1)}>
                    Keyingi <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ══ Test rejimi ══ */}
      {mode === "test" && (
        <Card className="p-5 lg:p-7">
          {!tDone && currentTest && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">{folder.title} — Test</div>
                  <div className="text-xs text-slate-500">{currentTest.topicTitle}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#2563eb]">{tIdx + 1} / {testQs.length}</span>
                  <div className="w-32"><Progress value={((tIdx + 1) / testQs.length) * 100} /></div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#eff6ff] border border-blue-200 p-5">
                <p className="text-[15px] font-semibold text-slate-900">{currentTest.ex.q}</p>
                {currentTest.ex.hint && tPick[tIdx] == null && (
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1"><Lightbulb className="h-3 w-3" /> {currentTest.ex.hint}</p>
                )}
                <div className="mt-4 grid gap-2.5">
                  {currentTest.ex.options.map((opt, oi) => {
                    const answered = tPick[tIdx] != null;
                    const isCorrect = currentTest.ex.correct === oi;
                    const chosen = tPick[tIdx] === oi;
                    let cls = "bg-white border-slate-200 text-slate-800 hover:border-blue-300";
                    if (answered) {
                      if (isCorrect) cls = "bg-emerald-50 border-emerald-300 text-emerald-700";
                      else if (chosen) cls = "bg-red-50 border-red-300 text-red-600";
                      else cls = "bg-white border-slate-200 text-slate-400";
                    }
                    return (
                      <button key={oi} onClick={() => pickTest(tIdx, oi, currentTest.ex.correct)}
                        className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${cls}`}>
                        <span className="font-bold mr-2 text-slate-400">{String.fromCharCode(65 + oi)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button size="sm" variant="outline" disabled={tIdx === 0} onClick={() => setTIdx(i => Math.max(0, i - 1))}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Oldingi
                </Button>
                {tIdx < testQs.length - 1 ? (
                  <Button size="sm" onClick={() => setTIdx(i => i + 1)} disabled={tPick[tIdx] == null}>
                    Keyingi <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={finishTest} disabled={tPick[tIdx] == null}>
                    <Trophy className="h-4 w-4 mr-1" /> Yakunlash
                  </Button>
                )}
              </div>
            </div>
          )}

          {tDone && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                <Trophy className="h-10 w-10 text-emerald-500" />
              </div>
              <div>
                <div className="text-4xl font-extrabold text-slate-900">{Math.round((testScore / testQs.length) * 100)}%</div>
                <div className="text-sm text-slate-500 mt-1">{testScore} / {testQs.length} to&apos;g&apos;ri javob</div>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => { resetTest(); setMode("lesson"); }} variant="outline">
                  <BookOpen className="h-4 w-4 mr-1" /> Mavzuni qayta o&apos;qish
                </Button>
                <Button onClick={resetTest}><Shuffle className="h-4 w-4 mr-1" /> Qayta test</Button>
              </div>
              <div className="text-left space-y-2 pt-3 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Javoblar</div>
                {testQs.map((t, i) => {
                  const ok = tPick[i] === t.ex.correct;
                  const answered = tPick[i] != null;
                  return (
                    <div key={i} className={`rounded-lg border p-3 text-sm ${ok ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                      <div className="font-medium text-slate-900">{i + 1}. {t.ex.q}</div>
                      <div className="text-xs mt-1">
                        {answered && !ok && <span className="text-red-600">Siz: {t.ex.options[tPick[i] as number]} · </span>}
                        <span className="text-emerald-700 font-semibold">To&apos;g&apos;ri: {t.ex.options[t.ex.correct]}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{t.topicTitle}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ══ Kartalar rejimi ══ */}
      {mode === "cards" && (
        <Card className="p-5 lg:p-7">
          {cardQs.length === 0 ? (
            <div className="text-center text-sm text-slate-500 py-8">Kartalar yo&apos;q</div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Layers className="h-4 w-4 text-[#2563eb]" /> Kartalar
                  <span className="text-slate-400 font-normal">· {folder.title}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-emerald-600">{Object.values(knownCards).filter(Boolean).length} bilaman</span>
                  <span className="text-slate-300">|</span>
                  <span>{cIdx + 1}/{cardQs.length}</span>
                </div>
              </div>

              <Progress value={((cIdx + 1) / cardQs.length) * 100} className="h-2" />

              <button onClick={() => setFlipped(f => !f)}
                className="w-full min-h-[190px] rounded-3xl border-2 p-6 flex flex-col items-center justify-center gap-3 transition hover:shadow-md"
                style={{ background: flipped ? folder.accent : folder.soft, borderColor: folder.accent, color: flipped ? "#fff" : "#0f1b3d" }}>
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                  {flipped ? "Tarjima" : "Koreyscha"}
                </span>
                <span className="text-2xl font-extrabold text-center break-words">
                  {flipped ? cardQs[cIdx].uz : cardQs[cIdx].ko}
                </span>
                <span className="text-[11px] opacity-70 flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" /> {flipped ? "Koreyschaga qaytarish" : "Tarjimani ko'rish"}
                </span>
                <button onClick={e => { e.stopPropagation(); say(cardQs[cIdx].ko, `card-${cIdx}`); }}
                  className="mt-1 h-9 w-9 rounded-full flex items-center justify-center transition"
                  style={{ background: flipped ? "rgba(255,255,255,.2)" : "#fff" }}>
                  <Volume2 className="h-4 w-4" />
                </button>
              </button>

              <div className="flex flex-wrap items-center gap-2 justify-center">
                <Button size="sm" variant="outline" disabled={cIdx === 0}
                  onClick={() => { setCIdx(i => Math.max(0, i - 1)); setFlipped(false); }}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Oldingi
                </Button>
                <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setKnownCards(p => ({ ...p, [cIdx]: false }));
                    setFlipped(false);
                    if (cIdx < cardQs.length - 1) setCIdx(i => i + 1);
                  }}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Yana ko&apos;rish
                </Button>
                <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  onClick={() => {
                    const fresh = knownCards[cIdx] !== true;
                    setKnownCards(p => ({ ...p, [cIdx]: true }));
                    if (fresh) {
                      const p = { ...profile, cardsKnown: profile.cardsKnown + 1, xp: profile.xp + XP.card };
                      float(`+${XP.card}`);
                      commit(p);
                    }
                    setFlipped(false);
                    if (cIdx < cardQs.length - 1) setCIdx(i => i + 1);
                  }}>
                  <Check className="h-4 w-4 mr-1" /> Bilaman
                </Button>
                <Button size="sm" variant="outline" disabled={cIdx >= cardQs.length - 1}
                  onClick={() => { setCIdx(i => Math.min(cardQs.length - 1, i + 1)); setFlipped(false); }}>
                  Keyingi <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center pt-2 border-t border-slate-100">
                {cardQs.map((_, i) => (
                  <button key={i} onClick={() => { setCIdx(i); setFlipped(false); }}
                    className={`h-6 w-6 rounded-md text-[10px] font-bold transition ${
                      i === cIdx ? "bg-[#0f1b3d] text-white"
                        : knownCards[i] === true ? "bg-emerald-100 text-emerald-700"
                        : knownCards[i] === false ? "bg-red-100 text-red-600"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>

              <div className="text-center">
                <Button variant="ghost" size="sm" onClick={() => { setKnownCards({}); setCIdx(0); setFlipped(false); }}>
                  <Sparkles className="h-4 w-4 mr-1" /> Qaytadan boshlash
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
      {/* ══ Yutuqlar / profil ══ */}
      {mode === "profile" && (
        <div className="space-y-4">
          {/* Daraja kartasi */}
          <Card className="p-5 overflow-hidden relative">
            <div className="absolute inset-0 xp-shine opacity-30 pointer-events-none" />
            <div className="relative flex flex-wrap items-center gap-4">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ background: `${lvl.cur.color}1f` }}>{lvl.cur.icon}</div>
              <div className="min-w-[200px] flex-1">
                <div className="text-xs font-extrabold uppercase tracking-wider" style={{ color: lvl.cur.color }}>
                  {lvl.cur.name} daraja
                </div>
                <div className="text-2xl font-extrabold text-slate-900 leading-tight">
                  {profile.xp} <span className="text-sm font-bold text-slate-400">XP</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${lvl.pct}%`, background: lvl.cur.color }} />
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {lvl.next
                    ? <>Keyingi: {lvl.next.icon} {lvl.next.name} — yana <b className="text-slate-700">{lvl.toNext} XP</b></>
                    : "Maksimal darajaga yetdingiz 👑"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatTile icon="S" label="Seriya" value={`${profile.streak} kun`} color="#ea580c" />
                <StatTile icon="%" label="Aniqlik" value={`${accuracy}%`} color="#059669" />
                <StatTile icon="x" label="Combo" value={`x${profile.bestCombo}`} color="#7c3aed" />
              </div>
            </div>
          </Card>

          {/* Darajalar zinapoyasi */}
          <Card className="p-4">
            <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wide mb-2.5">Darajalar</div>
            <div className="flex flex-wrap gap-2">
              {levels.map((l, i) => {
                const reached = i <= lvl.idx;
                return (
                  <div key={l.name}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 ${reached ? "" : "bg-white border-slate-200 opacity-45"}`}
                    style={reached ? { borderColor: `${l.color}66`, background: `${l.color}14` } : undefined}>
                    <span className="text-base leading-none">{l.icon}</span>
                    <span className="text-xs font-extrabold" style={{ color: l.color }}>{l.name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{l.min}+</span>
                    {i === lvl.idx && <span className="text-[10px] font-extrabold text-slate-900">· siz</span>}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Statistika */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatTile icon="+" label="To'g'ri javob" value={`${profile.correct}`} sub={`${profile.answered} urinish`} color="#059669" />
            <StatTile icon="%" label="Aniqlik" value={`${accuracy}%`} color="#2563eb" />
            <StatTile icon="x" label="Eng uzun combo" value={`x${profile.bestCombo}`} color="#7c3aed" />
            <StatTile icon="M" label="Mavzu" value={`${learnedCount}/${totalTopics}`} color="#0f766e" />
            <StatTile icon="K" label="Kartani bildim" value={`${profile.cardsKnown}`} color="#0891b2" />
            <StatTile icon="Y" label="Yutuq" value={`${unlocked}/${achievements.length}`} color="#d97706" />
          </div>

          {/* Yutuqlar */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-extrabold text-slate-900">Yutuqlar</span>
              <div className="w-40"><Progress value={achievements.length ? (unlocked / achievements.length) * 100 : 0} /></div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {achievements.map(a => {
                const got = profile.achievements.includes(a.id);
                return (
                  <div key={a.id}
                    className={`rounded-2xl border p-3 flex items-start gap-3 transition ${got ? "" : "bg-white border-slate-200 opacity-55"}`}
                    style={got ? { borderColor: `${a.color}55`, background: `${a.color}0f` } : undefined}>
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${got ? "medal-pop" : ""}`}
                      style={{ background: got ? `${a.color}1f` : "#f1f5f9" }}>{got ? a.icon : "×"}</div>
                    <div className="min-w-0">
                      <div className={`font-bold text-sm ${got ? "text-slate-900" : "text-slate-500"}`}>{a.title}</div>
                      <div className="text-xs text-slate-500 leading-snug mt-0.5">{a.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test tarixi */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-extrabold text-slate-900">📈 Oxirgi testlar</span>
              {profile.history.length > 0 && (
                <button onClick={() => setProfile(p => { const n = { ...p, history: [] }; saveProfile(n); return n; })}
                  className="text-xs text-slate-400 hover:text-slate-600">Tarixni tozalash</button>
              )}
            </div>
            {profile.history.length === 0 ? (
              <p className="text-sm text-slate-400">Hozircha test topshirmagansiz — «Test» rejimini sinab ko&apos;ring.</p>
            ) : (
              <div className="space-y-2">
                {profile.history.map(h => (
                  <div key={h.at} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                    <span className="text-lg leading-none">{h.pct >= 80 ? "A" : h.pct >= 50 ? "Y" : "K"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-800 truncate">{h.folderTitle}</div>
                      <div className="text-[11px] text-slate-400">{new Date(h.at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold" style={{ color: h.pct >= 80 ? "#059669" : h.pct >= 50 ? "#d97706" : "#dc2626" }}>{h.pct}%</div>
                      <div className="text-[11px] text-slate-400">{h.score}/{h.total}</div>
                    </div>
                    <div className="w-24 hidden sm:block"><Progress value={h.pct} /></div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Xavfli zona */}
          <div className="flex justify-end">
            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={resetAll}>
              <RotateCcw className="h-4 w-4 mr-1" /> Progressni tozalash
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatChip({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 flex items-center gap-2">
      <span className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${color}1a`, color }}>{icon}</span>
      <div className="leading-tight">
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{label}</div>
        <div className="text-sm font-extrabold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="h-8 w-8 rounded-lg flex items-center justify-center text-base mb-1.5" style={{ background: `${color}18` }}>{icon}</div>
      <div className="text-lg font-extrabold text-slate-900 leading-tight">{value}</div>
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      {sub && <div className="text-[10px] text-slate-400">{sub}</div>}
    </div>
  );
}
