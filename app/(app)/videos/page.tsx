"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Video = { id: string; title: string; category: string; duration: string; videoUrl: string | null };

const cats = ["Barchasi", "Koreys tili", "TOPIK", "Grammatik", "Talaffuz", "Listening"] as const;

export default function VideosPage() {
  const [cat, setCat] = useState<string>("Barchasi");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/videos")
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Xato");
        setVideos(Array.isArray(d.videos) ? d.videos : []);
      })
      .catch(e => setErr(e.message || "Yuklab bo‘lmadi"))
      .finally(() => setLoading(false));
  }, []);

  const list = cat === "Barchasi" ? videos : videos.filter(v => v.category === cat);

  function open(v: Video) {
    if (v.videoUrl) window.open(v.videoUrl, "_blank", "noopener");
    else toast.info("Video fayli hozircha qo‘shilmagan — administrator qo‘shadi");
  }

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Videodarslar</h1>
        <p className="text-sm text-slate-500">Базадagi videolar — admin qo‘shadi</p>
      </div>
      <div className="flex gap-1.5 overflow-auto pb-1">
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${cat === c ? "bg-[#0f1b3d] text-white border-[#0f1b3d]" : "bg-white text-slate-600 border-slate-200"}`}>{c}</button>
        ))}
      </div>

      {loading ? (
        <Card className="p-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</Card>
      ) : err ? (
        <Card className="p-8 text-center text-sm text-amber-700 bg-amber-50 border-amber-200">{err}</Card>
      ) : list.length === 0 ? (
        <Card className="p-10 text-center">
          <Play className="h-8 w-8 mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">Bu bo‘limda hali video yo‘q</p>
          <p className="text-xs text-slate-500 mt-1">Videolarni administrator qo‘shadi (/admin/content → Videolar)</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(v => (
            <Card key={v.id} className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow" onClick={() => open(v)}>
              <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-700 relative grid place-items-center">
                <div className="h-12 w-12 rounded-full bg-white/90 grid place-items-center group-hover:scale-105 transition-transform"><Play className="h-6 w-6 text-slate-900 ml-0.5" /></div>
                <span className="absolute bottom-2 right-2 rounded-full bg-black/70 text-white text-[11px] px-2 py-1">{v.duration}</span>
                <Badge className="absolute top-2 left-2 bg-white text-slate-800 text-[11px]">{v.category}</Badge>
                {v.videoUrl && <ExternalLink className="absolute top-2 right-2 h-3.5 w-3.5 text-white/70" />}
              </div>
              <div className="p-4">
                <div className="font-medium text-slate-900 leading-tight line-clamp-2">{v.title}</div>
                <div className="text-xs text-slate-500 mt-1">{v.videoUrl ? "Havola ochiladi" : "Havola qo‘shilmagan"}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
