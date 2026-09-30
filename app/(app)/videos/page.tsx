"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { videos } from "@/lib/mock-data";
import { Play, Eye } from "lucide-react";

const cats = ["Barchasi","Koreys tili","TOPIK","Grammatik","Talaffuz","Listening"] as const;

export default function VideosPage() {
  const [cat, setCat] = useState<string>("Barchasi");
  const list = cat==="Barchasi" ? videos : videos.filter(v => v.category===cat);
  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Videodarslar</h1>
        <p className="text-sm text-slate-500">Koreys tili, TOPIK, grammatika va talaffuz</p>
      </div>
      <div className="flex gap-1.5 overflow-auto pb-1">
        {cats.map(c => (
          <button key={c} onClick={()=>setCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${cat===c ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : "bg-white text-slate-600 border-slate-200"}`}>{c}</button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(v => (
          <Card key={v.id} className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
            <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-700 relative grid place-items-center">
              <div className="h-12 w-12 rounded-full bg-white/90 grid place-items-center group-hover:scale-105 transition-transform"><Play className="h-6 w-6 text-slate-900 ml-0.5" /></div>
              <span className="absolute bottom-2 right-2 rounded-full bg-black/70 text-white text-[11px] px-2 py-1">{v.duration}</span>
              <Badge className="absolute top-2 left-2 bg-white text-slate-800 text-[11px]">{v.category}</Badge>
            </div>
            <div className="p-4">
              <div className="font-medium text-slate-900 leading-tight line-clamp-2">{v.title}</div>
              <div className="text-xs text-slate-500 mt-1">{v.teacher} · <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3"/>{v.views}</span></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
