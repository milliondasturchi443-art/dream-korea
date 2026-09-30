import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const items = [
  { id: "1", title: "Yangi dars qo‘shildi", desc: "4-dars: Salomlashish — bugun 16:00", time: "2 soat oldin", unread: true },
  { id: "2", title: "Test natijasi", desc: "TOPIK I reading — 82% · yaxshi natija!", time: "kecha", unread: true },
  { id: "3", title: "To‘lov tasdiqlandi", desc: "Koreys tili 1-daraja — Paid", time: "2 kun oldin", unread: false },
  { id: "4", title: "Ustoz xabari", desc: "Kim Ji-Hoon: Ertaga qo‘shimcha dars bor", time: "3 kun oldin", unread: true },
  { id: "5", title: "Tizim xabari", desc: "Platforma yangilandi — AI yordamchi qo‘shildi", time: "1 hafta oldin", unread: false },
];

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-[720px] p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-slate-900">Bildirishnomalar</h1>
        <Badge className="bg-red-500 text-white border-0">3 ta yangi</Badge>
      </div>
      <div className="space-y-2">
        {items.map(n => (
          <Card key={n.id} className={`p-4 flex gap-3 ${n.unread ? "bg-[#eff6ff] border-blue-200" : "bg-white"}`}>
            <div className={`h-2.5 w-2.5 rounded-full mt-2 shrink-0 ${n.unread ? "bg-[#2563eb]" : "bg-slate-300"}`} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-slate-900">{n.title}</div>
              <div className="text-xs text-slate-600">{n.desc}</div>
              <div className="text-[11px] text-slate-400 mt-1">{n.time}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
