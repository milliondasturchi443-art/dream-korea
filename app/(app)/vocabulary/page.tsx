"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { vocabulary } from "@/lib/mock-data";
import { Search, Volume2, Heart, Shuffle } from "lucide-react";
import { toast } from "sonner";

export default function VocabularyPage() {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<string>("Barchasi");
  const [flash, setFlash] = useState<number | null>(null);
  const [fav, setFav] = useState<Set<string>>(new Set());

  const filtered = vocabulary.filter(v => {
    if (level !== "Barchasi" && v.level !== level) return false;
    if (q && !(`${v.ko} ${v.uz} ${v.tr}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">Lug‘at</h1>
          <p className="text-sm text-slate-500">5000+ so‘z · flashcards, search, favorites</p>
        </div>
        <Button variant="outline" onClick={() => {
          const rnd = vocabulary[Math.floor(Math.random()*vocabulary.length)];
          toast.info(`Random: ${rnd.ko} — ${rnd.uz}`);
        }}><Shuffle className="h-4 w-4 mr-1"/> Random so‘z</Button>
      </div>

      <Card className="p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="So‘z qidirish — masalan, 사랑" className="pl-9" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["Barchasi","A1","A2","B1"].map(l => (
            <button key={l} onClick={()=>setLevel(l)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${level===l ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : "bg-white text-slate-600 border-slate-200"}`}>{l}</button>
          ))}
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v, idx) => {
          const isFlash = flash === idx;
          const isFav = fav.has(v.ko);
          return (
            <Card key={v.ko+idx} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">{v.level}</Badge>
                <button onClick={()=>{
                  const n = new Set(fav);
                  if (n.has(v.ko)) n.delete(v.ko); else n.add(v.ko);
                  setFav(n);
                }} className={`h-8 w-8 rounded-full grid place-items-center border ${isFav ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-slate-200 text-slate-400"}`}><Heart className={`h-4 w-4 ${isFav?"fill-rose-500":""}`} /></button>
              </div>
              <div className="mt-3">
                {isFlash ? (
                  <div className="rounded-xl bg-[#eff6ff] p-4 text-center">
                    <div className="text-sm text-slate-500">{v.ko} · {v.tr}</div>
                    <div className="text-lg font-bold text-[#0f1b3d] mt-1">{v.uz}</div>
                    <Button size="sm" variant="outline" className="mt-3" onClick={()=>setFlash(null)}>Yopish</Button>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-extrabold text-slate-900">{v.ko}</div>
                    <div className="text-xs text-slate-500">{v.tr}</div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={()=>setFlash(idx)}>Tarjimani ko‘rish</Button>
                      <Button size="sm" variant="outline" onClick={()=>toast.info("🔊 "+v.ko)}><Volume2 className="h-4 w-4"/></Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
