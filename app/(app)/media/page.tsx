import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

const items = [
  { id: "1", title: "Goblin — 1-qism (o‘rganish)", type: "Serial", level: "A2" },
  { id: "2", title: "Parasite — film tahlili", type: "Kino", level: "B1" },
  { id: "3", title: "Itaewon Class — biznes lug‘ati", type: "Serial", level: "B1" },
  { id: "4", title: "BTS — subtitr bilan", type: "Clip", level: "A1" },
  { id: "5", title: "Crash Landing on You — dialoglar", type: "Serial", level: "A2" },
  { id: "6", title: "Kingdom — tarixiy so‘zlar", type: "Kino", level: "B2" },
];

export default function MediaPage() {
  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Kinolar & Seriallar</h1>
        <p className="text-sm text-slate-500">Subtitr, lug‘at va video player bilan o‘rganing</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(m => (
          <Card key={m.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <div className="aspect-video bg-gradient-to-br from-[#0f1b3d] via-[#1e3a8a] to-[#2563eb] relative grid place-items-center">
              <div className="h-12 w-12 rounded-full bg-white grid place-items-center"><Play className="h-6 w-6 text-[#0f1b3d] ml-0.5" /></div>
              <Badge className="absolute top-2 left-2 bg-white text-slate-800 text-[11px]">{m.type}</Badge>
              <span className="absolute bottom-2 right-2 rounded-full bg-black/60 text-white text-[11px] px-2 py-1">{m.level}</span>
            </div>
            <div className="p-4">
              <div className="font-medium text-slate-900 leading-tight">{m.title}</div>
              <div className="text-xs text-slate-500 mt-1">Subtitr · Lug‘at · Talaffuz</div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-4 bg-[#eff6ff] border-blue-200 text-sm text-slate-700">
        Tanlangan videodagi so‘zlar avtomatik lug‘atga qo‘shiladi. Tez orada har bir replikadan flashcard yaratish imkoniyati qo‘shiladi.
      </Card>
    </div>
  );
}
