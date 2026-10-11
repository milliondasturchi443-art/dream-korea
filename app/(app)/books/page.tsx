"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { books } from "@/lib/mock-data";
import { BookMarked, FileText, X } from "lucide-react";

type Chapter = { title: string; body: string[] };

const bookContent: Record<string, Chapter[]> = {
  "1": [
    { title: "1-dars: O‘qish asoslari", body: [
      "Koreys tilida o‘qish — bu harflarni to‘g‘ri ovoz chiqarish va ma’noni tushunishdir.",
      "Misol: 나는 학생입니다. — Men talabaman.",
      "Mashq: 읽다 (o‘qish) fe’lini lug‘at yozing va uchta gap tuzing.",
    ]},
    { title: "2-dars: TOPIK I lug‘ati", body: [
      "Asosiy so‘zlar: 사람 (odam), 책 (kitob), 물 (suv), 학생 (talaba).",
      "Har bir so‘zni gap ichida ishlating.",
      "Mashq: Quyidagi so‘zlarni juftlang — 사람 / 책 / 물.",
    ]},
  ],
  "2": [
    { title: " Beginner: 입니다 / 아닙니다", body: [
      "입니다 — rasmiy ‘bo‘lish’ formasi.学生입니다 — (U) talaba.",
      "아닙니다 — ‘emas’. 학생이 아닙니다 — (U) talaba emas.",
      "Mashq: 저는 선생님___ (to‘g‘ri qo‘shimchani tanlang).",
    ]},
    { title: "은 / 는 — mavzu yuklamasi", body: [
      "Gap mavzusini bildiradi. Undosh bilan tugasa 은, unli bilan 는.",
      "Misol: 나는 밥을 먹어요.",
      "Mashq: 은 va 는 dan to‘g‘risini tanlang.",
    ]},
  ],
  "3": [
    { title: "EPS-TOPIK: ish so‘zlari", body: [
      "공장 (zavod), 일 (ish), 시간 (vaqt), 돈 (pul).",
      "Mashq: Bu so‘zlarni o‘zbekchaga tarjima qiling.",
      "Qo‘shimcha: 현장 (maydon / ish joyi).",
    ]},
  ],
  "4": [
    { title: "Asosiy 2000 so‘z — 1-qism", body: [
      "가다 (borish), 오다 (kelish), 먹yes (yeyish), 마시a (ichish).",
      "Har kuni 10 ta so‘z yodlang.",
      "Mashq: 5 ta so‘zdan gap tuzing.",
    ]},
  ],
};

export default function BooksPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const book = books.find(b => b.id === openId);
  const chapters = openId ? bookContent[openId] ?? [] : [];

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Kitoblar</h1>
        <p className="text-sm text-slate-500">TOPIK, grammatika, lug‘at va beginner kitoblari</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {books.map(b => (
          <Card key={b.id} className="overflow-hidden flex flex-col">
            <div className={`h-36 bg-gradient-to-br ${b.color} p-4 text-white flex flex-col`}>
              <BookMarked className="h-6 w-6 opacity-80" />
              <div className="mt-auto font-semibold leading-tight">{b.title}</div>
              <div className="text-xs text-white/80">{b.pages} sahifa</div>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-2">
              <Badge className="bg-slate-100 text-slate-700 border border-slate-200 w-fit text-[11px]">{b.level}</Badge>
              <p className="text-xs text-slate-500 leading-relaxed">PDF va audio materiallar bilan. Boshlang‘ichdan professionalgacha.</p>
              <Button size="sm" className="mt-auto w-full" onClick={() => setOpenId(b.id)}>
                <FileText className="h-4 w-4 mr-1"/> Ochish
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {book && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setOpenId(null)}>
          <div className="bg-white w-full sm:max-w-lg max-h-[85vh] sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className={`bg-gradient-to-br ${book.color} text-white p-4 flex items-start justify-between`}>
              <div>
                <div className="font-bold text-lg leading-tight">{book.title}</div>
                <div className="text-xs text-white/80 mt-1">{book.level} · {book.pages} sahifa</div>
              </div>
              <button onClick={() => setOpenId(null)} className="p-1 rounded-full hover:bg-white/15" aria-label="Yopish">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {chapters.length === 0 && <p className="text-sm text-slate-500">Bu kitob uchun kontent hozircha yo‘q.</p>}
              {chapters.map((ch, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-4">
                  <div className="font-semibold text-slate-900">{ch.title}</div>
                  <div className="mt-2 space-y-2">
                    {ch.body.map((line, j) => (
                      <p key={j} className="text-sm text-slate-600 leading-relaxed">{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
