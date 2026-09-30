"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { universities } from "@/lib/mock-data";
import { Building2, MapPin, Search } from "lucide-react";
import Link from "next/link";

export default function UniversitiesPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("Barchasi");
  const cities = ["Barchasi", ...Array.from(new Set(universities.map(u=>u.city)))];
  const filtered = universities.filter(u => {
    if (city !== "Barchasi" && u.city !== city) return false;
    if (q && !u.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Universitetlar</h1>
        <p className="text-sm text-slate-500">Koreya universitetlari — shahar, dastur, TOPIK talabi va kontrakt</p>
      </div>

      <Card className="p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Universitet qidirish..." className="pl-9" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {cities.map(c => (
            <button key={c} onClick={()=>setCity(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${city===c ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : "bg-white text-slate-600 border-slate-200"}`}>{c}</button>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(u => (
          <Card key={u.id} className="p-5">
            <div className="flex gap-3">
              <div className="h-12 w-12 rounded-xl bg-[#eff6ff] grid place-items-center shrink-0"><Building2 className="h-6 w-6 text-[#2563eb]" /></div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 leading-tight">{u.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3"/> {u.city}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {u.programs.map(p => <Badge key={p} className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">{p}</Badge>)}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5"><div className="text-slate-500">TOPIK</div><div className="font-semibold">{u.topik}</div></div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5"><div className="text-slate-500">Kontrakt</div><div className="font-semibold">{u.tuition}</div></div>
                </div>
                <Link href="/admission"><Button size="sm" className="mt-3 w-full">Qabulga ariza</Button></Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
