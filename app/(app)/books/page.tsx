"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BOOK_CATEGORIES, booksData, type Book, type BookCategory } from "@/lib/books-data";
import { BookMarked, Download, Search, Star, Timer, X, Check, Lightbulb } from "lucide-react";

type BookStat = { sec: number; done: boolean };
type BookState = Record<string, BookStat>;

const STORE = "dk_books_v1";
const XP_PER_MINUTE = 1;
const XP_MINUTE_CAP = 20;
const XP_FINISH = 50;
const TIPS = [
  "O'qish paytida yangi so'zlarni daftaringizga yozing.",
  "Bir daqiqada 1 XP — 20 XP gacha bir kitobdan oling.",
  "Kitobni tugagach «O'qib bo'ldim»ni bosing — +50 XP.",
  "Har kuni 15 daqiqa o'qish — odat va streak uchun zo'r.",
  "Ovoz chiqarib o'qish — talaffuzni ham yaxshilaydi.",
];

function loadState(): BookState {
  try { return JSON.parse(localStorage.getItem(STORE) || "{}") as BookState; } catch { return {}; }
}
function saveState(s: BookState) { localStorage.setItem(STORE, JSON.stringify(s)); }
function bookXp(st?: BookStat) {
  if (!st) return 0;
  return Math.min(Math.floor(st.sec / 60), XP_MINUTE_CAP) * XP_PER_MINUTE + (st.done ? XP_FINISH : 0);
}
function fmtTime(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function BooksPage() {
  const [state, setState] = useState<BookState>({});
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BookCategory | "Barchasi">("Barchasi");
  const [openId, setOpenId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [tip, setTip] = useState(0);
  const [books, setBooks] = useState<Book[]>(booksData);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setState(loadState()); setMounted(true); }, []);

  // Admin qo'shgan kitoblar (API) + ichki kitoblar; API ishlamasa — ichki kitoblar qoladi
  useEffect(() => {
    fetch("/api/books")
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => { if (Array.isArray(d.items) && d.items.length) setBooks(d.items as Book[]); })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => books.filter(b =>
    (category === "Barchasi" || b.category === category) &&
    (!query.trim() || `${b.title} ${b.subtitle} ${b.description} ${b.level}`.toLowerCase().includes(query.trim().toLowerCase()))
  ), [query, category, books]);

  const totalXp = useMemo(() => books.reduce((sum, b) => sum + bookXp(state[b.id]), 0), [state, books]);
  const doneCount = useMemo(() => books.filter(b => state[b.id]?.done).length, [state, books]);

  const openBook = books.find(b => b.id === openId);

  useEffect(() => {
    if (!openId) return;
    setTip(Math.floor(Math.random() * TIPS.length));
    tickRef.current = setInterval(() => {
      setState(prev => {
        const cur = prev[openId] || { sec: 0, done: false };
        const next = { ...prev, [openId]: { ...cur, sec: cur.sec + 1 } };
        saveState(next);
        return next;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [openId]);

  function finishBook(id: string) {
    setState(prev => {
      const cur = prev[id] || { sec: 0, done: false };
      if (cur.done) return prev;
      const next = { ...prev, [id]: { ...cur, done: true } };
      saveState(next);
      return next;
    });
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 2200);
  }

  const currentStat = openId ? (state[openId] || { sec: 0, done: false }) : null;
  const currentXp = openId ? bookXp(currentStat ?? undefined) : 0;

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">Kitoblar</h1>
          <p className="text-sm text-slate-500">Haqiqiy darsliklar va imtihon kitoblari — onlayn o‘qing, XP to‘plang.</p>
        </div>
        {mounted && (
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-emerald-700">+{totalXp} XP</span>
            <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 font-semibold text-amber-600">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {doneCount}/{books.length}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Kitob qidirish…" className="pl-9 bg-white" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["Barchasi", ...BOOK_CATEGORIES] as const).map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${category === c ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {!filtered.length && <Card className="p-10 text-center text-slate-500">Bunday kitob topilmadi.</Card>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(b => {
          const st = mounted ? state[b.id] : undefined;
          const progress = st ? Math.min(100, Math.round((st.sec / 3600) * 100)) : 0;
          return (
            <Card key={b.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className={`relative h-36 bg-gradient-to-br ${b.color} p-4 text-white flex flex-col`}>
                <div className="flex items-start justify-between">
                  <BookMarked className="h-6 w-6 opacity-80" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white/70">{b.code}</span>
                </div>
                <div className="mt-auto font-semibold leading-tight line-clamp-2">{b.title}</div>
                <div className="text-xs text-white/80">{b.subtitle}</div>
                {st?.done && <span className="absolute top-3 left-10 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-amber-600"><Check className="h-3 w-3" /> Tugatilgan</span>}
              </div>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">{b.category}</Badge>
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">{b.level}</Badge>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{b.description}</p>
                <p className="text-[11px] text-slate-400">{b.pages} sahifa · {b.sizeMb} MB</p>
                {mounted && st && st.sec > 0 && (
                  <div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{Math.floor(st.sec / 60)} daqiqa o‘qilgan · {bookXp(st)} XP</p>
                  </div>
                )}
                <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
                  <Button size="sm" onClick={() => setOpenId(b.id)}>{st?.sec ? "Davom etish" : "O‘qish"}</Button>
                  <a href={b.file} download className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
                    <Download className="h-4 w-4" /> PDF
                  </a>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {openBook && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 p-0 sm:p-4">
          <div className="bg-white w-full h-full sm:rounded-2xl overflow-hidden flex flex-col sm:max-w-5xl sm:mx-auto sm:max-h-[92vh]">
            <div className={`relative bg-gradient-to-br ${openBook.color} text-white p-4 flex items-center justify-between shrink-0`}>
              <div className="min-w-0">
                <div className="font-bold text-lg leading-tight truncate">{openBook.title}</div>
                <div className="text-xs text-white/80 mt-0.5">{openBook.level} · {openBook.pages} sahifa</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {currentStat && (
                  <span className="hidden sm:flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
                    <Timer className="h-4 w-4" /> {fmtTime(currentStat.sec)} · +{currentXp} XP
                  </span>
                )}
                <button onClick={() => setOpenId(null)} className="p-2 rounded-full hover:bg-white/15" aria-label="Yopish">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {celebrate && (
                <div className="medal-pop absolute inset-0 grid place-items-center bg-black/40 text-2xl font-black">
                  O‘qib bo‘ldingiz! +{XP_FINISH} XP
                </div>
              )}
            </div>
            <iframe src={openBook.file} title={openBook.title} className="flex-1 w-full border-0 min-h-0" />
            <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs text-slate-500"><Lightbulb className="h-3.5 w-3.5" /> {TIPS[tip]}</p>
              <div className="flex items-center gap-2">
                {currentStat?.sec ? (
                  <span className="text-xs text-slate-500 sm:hidden">{fmtTime(currentStat.sec)} · +{currentXp} XP</span>
                ) : null}
                {currentStat?.done ? (
                  <Badge className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200"><Check className="h-3 w-3" /> Tugatilgan</Badge>
                ) : (
                  <Button size="sm" onClick={() => finishBook(openBook.id)}>O‘qib bo‘ldim · +{XP_FINISH} XP</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
