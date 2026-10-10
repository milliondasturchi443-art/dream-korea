"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { youtubeEmbedUrl, youtubeId } from "@/lib/youtube";

type Video = { id: string; title: string; category: string; duration: string; videoUrl: string | null };

const cats = ["Barchasi", "Koreys tili", "TOPIK", "Grammatik", "Talaffuz", "Listening"] as const;

export default function VideosPage() {
  const [cat, setCat] = useState<string>("Barchasi");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [active, setActive] = useState<Video | null>(null);

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

  // Esc bilan pleerni yopish
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setActive(null); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [active]);

  const list = cat === "Barchasi" ? videos : videos.filter(v => v.category === cat);

  function open(v: Video) {
    if (!v.videoUrl || !youtubeEmbedUrl(v.videoUrl)) {
      toast.info("Video havolasi hozircha qo‘shilmagan yoki noto‘g‘ri — administrator qo‘shadi");
      return;
    }
    setActive(v);
  }

  const embed = active ? youtubeEmbedUrl(active.videoUrl) : null;

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <h1 className="text-[22px] font-bold text-slate-900">Videodarslar</h1>

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
          <p className="text-xs text-slate-500 mt-1">Videolarni administrator qo‘shadi (Kontent → Videolar)</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(v => {
            const canPlay = !!youtubeEmbedUrl(v.videoUrl);
            return (
              <Card key={v.id} className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow" onClick={() => open(v)}>
                <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-700 relative grid place-items-center">
                  {canPlay && youtubeId(v.videoUrl) ? (
                    // Thumbnail YouTube'dan (lavha oynasi)
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`https://i.ytimg.com/vi/${youtubeId(v.videoUrl)}/hqdefault.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  ) : null}
                  <div className="h-12 w-12 rounded-full bg-white/90 grid place-items-center group-hover:scale-105 transition-transform relative"><Play className="h-6 w-6 text-slate-900 ml-0.5" /></div>
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/70 text-white text-[11px] px-2 py-1">{v.duration}</span>
                  <Badge className="absolute top-2 left-2 bg-white text-slate-800 text-[11px]">{v.category}</Badge>
                </div>
                <div className="p-4">
                  <div className="font-medium text-slate-900 leading-tight line-clamp-2">{v.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{canPlay ? "Bosib ko‘ring — shu yerda ochiladi" : "Havola qo‘shilmagan"}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Ichki video pleer (YouTube embed) */}
      {active && embed && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setActive(null)}>
          <div className="w-full max-w-[900px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="text-white font-semibold leading-tight">{active.title}</div>
              <button onClick={() => setActive(null)} aria-label="Yopish" className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white shrink-0"><X className="h-5 w-5" /></button>
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xl">
              <iframe
                src={embed}
                title={active.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
