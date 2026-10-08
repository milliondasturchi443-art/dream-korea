"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Video = { id: string; title: string; category: string; duration: string; videoUrl: string | null };

const MEDIA_CATS = ["Kino", "Serial", "Clip", "Drama"];

export default function MediaPage() {
  const [items, setItems] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/videos")
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Xato");
        const all: Video[] = Array.isArray(d.videos) ? d.videos : [];
        setItems(all.filter(v => MEDIA_CATS.some(c => v.category.toLowerCase() === c.toLowerCase())));
      })
      .catch(e => setErr(e.message || "Yuklab bo‘lmadi"))
      .finally(() => setLoading(false));
  }, []);

  function open(v: Video) {
    if (v.videoUrl) window.open(v.videoUrl, "_blank", "noopener");
    else toast.info("Video fayli hozircha qo‘shilmagan — administrator qo‘shadi");
  }

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Kinolar & Seriallar</h1>
        <p className="text-sm text-slate-500">Базadagi media — admin qo‘shadi (kategoriya: Kino / Serial / Clip)</p>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</Card>
      ) : err ? (
        <Card className="p-8 text-center text-sm text-amber-700 bg-amber-50 border-amber-200">{err}</Card>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center">
          <Play className="h-8 w-8 mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">Hali kino/serial qo‘shilmagan</p>
          <p className="text-xs text-slate-500 mt-1">Administrator /admin/content → Videolar orqali qo‘shadi</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(m => (
            <Card key={m.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => open(m)}>
              <div className="aspect-video bg-gradient-to-br from-[#0f1b3d] via-[#1e3a8a] to-[#2563eb] relative grid place-items-center">
                <div className="h-12 w-12 rounded-full bg-white grid place-items-center"><Play className="h-6 w-6 text-[#0f1b3d] ml-0.5" /></div>
                <Badge className="absolute top-2 left-2 bg-white text-slate-800 text-[11px]">{m.category}</Badge>
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 text-white text-[11px] px-2 py-1">{m.duration}</span>
                {m.videoUrl && <ExternalLink className="absolute top-2 right-2 h-3.5 w-3.5 text-white/70" />}
              </div>
              <div className="p-4">
                <div className="font-medium text-slate-900 leading-tight">{m.title}</div>
                <div className="text-xs text-slate-500 mt-1">{m.videoUrl ? "Havola ochiladi" : "Havola qo‘shilmagan"}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
