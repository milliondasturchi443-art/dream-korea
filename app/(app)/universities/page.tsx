"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { universities } from "@/lib/mock-data";
import { Building2, MapPin, Search, Star, Calendar, Home, Globe, GraduationCap, FileText, Award, Info } from "lucide-react";
import Link from "next/link";

export default function UniversitiesPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("Barchasi");
  const [openId, setOpenId] = useState<string | null>(null);
  const cities = ["Barchasi", ...Array.from(new Set(universities.map(u=>u.city)))];
  const filtered = universities.filter(u => {
    if (city !== "Barchasi" && u.city !== city) return false;
    if (q && !(u.name.toLowerCase().includes(q.toLowerCase()) || u.description.toLowerCase().includes(q.toLowerCase()) || u.about.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Universitetlar — batafsil</h1>
        <p className="text-sm text-slate-500">18 ta top universitet · reyting, fakultetlar, TOPIK, kontrakt, yotoqxona, dedlayn, qabul shartlari va stipendiyalar. «Batafsil» tugmasini bosing.</p>
      </div>

      <Card className="p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Universitet yoki tavsif qidirish..." className="pl-9" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {cities.map(c => (
            <button key={c} onClick={()=>setCity(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${city===c ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : "bg-white text-slate-600 border-slate-200"}`}>{c}</button>
          ))}
        </div>
      </Card>
      <div className="text-xs text-slate-500">{filtered.length} ta universitet topildi</div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(u => {
          const expanded = openId === u.id;
          return (
            <Card key={u.id} className="p-5 flex flex-col">
              <div className="flex gap-3">
                <div className="h-12 w-12 rounded-xl bg-[#eff6ff] grid place-items-center shrink-0"><Building2 className="h-6 w-6 text-[#2563eb]" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-slate-900 leading-tight text-sm">{u.name}</div>
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] shrink-0 flex items-center gap-0.5"><Star className="h-3 w-3" /> #{u.ranking}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3"/> {u.city}</div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{u.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {u.programs.map(p => <Badge key={p} className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">{p}</Badge>)}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5"><div className="text-slate-500">TOPIK</div><div className="font-semibold">{u.topik}</div></div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5"><div className="text-slate-500">Kontrakt</div><div className="font-semibold">{u.tuition}</div></div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 flex items-start gap-1.5"><Calendar className="h-3.5 w-3.5 mt-0.5 text-slate-400" /><div><div className="text-slate-500">Dedlayn</div><div className="font-semibold">{u.deadline}</div></div></div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 flex items-start gap-1.5"><Home className="h-3.5 w-3.5 mt-0.5 text-slate-400" /><div><div className="text-slate-500">Yotoqxona</div><div className="font-semibold leading-tight">{u.dorm}</div></div></div>
                  </div>
                  {expanded && (
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="rounded-xl bg-[#eff6ff] border border-blue-200 p-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1"><Info className="h-3.5 w-3.5" /> Universitet haqida</div>
                        <p className="mt-1.5 text-slate-700 leading-relaxed">{u.about}</p>
                      </div>
                      <div className="rounded-xl bg-[#eff6ff] border border-blue-200 p-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> Fakultetlar</div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">{u.faculties.map(f => <Badge key={f} className="bg-white text-slate-700 border text-[11px]">{f}</Badge>)}</div>
                      </div>
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Qabul shartlari va hujjatlar</div>
                        <p className="mt-1.5 text-slate-700 leading-relaxed">{u.admission}</p>
                      </div>
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1"><Award className="h-3.5 w-3.5" /> Stipendiyalar va moliyaviy yordam</div>
                        <p className="mt-1.5 text-slate-700 leading-relaxed">{u.scholarship}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-slate-600">
                        <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> {u.language}</span>
                        <a href={`https://${u.website}`} target="_blank" rel="noopener noreferrer" className="text-[#2563eb] hover:underline">{u.website}</a>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Link href="/admission" className="flex-1"><Button size="sm" className="w-full">Qabulga ariza</Button></Link>
                    <Button variant="outline" size="sm" className="flex-1" onClick={()=> setOpenId(expanded ? null : u.id)}>{expanded ? "Yopish" : "Batafsil"}</Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
