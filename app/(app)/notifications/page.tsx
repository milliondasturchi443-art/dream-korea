"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Loader2 } from "lucide-react";

type N = { id: string; title: string; body?: string | null; read: boolean; createdAt: string };

const fmt = (s: string) => {
  const d = new Date(s);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "hozirgina";
  if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day} kun oldin`;
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" });
};

export default function NotificationsPage() {
  const [items, setItems] = useState<N[] | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("dk_token") || "";
    if (!token) { setItems([]); return; }
    fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d.items) ? d.items : []))
      .catch(() => setItems([]));
  }, []);

  const unread = (items ?? []).filter(n => !n.read).length;

  return (
    <div className="mx-auto max-w-[720px] p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-slate-900">Bildirishnomalar</h1>
        {unread > 0 && <Badge className="bg-red-500 text-white border-0">{unread} ta yangi</Badge>}
      </div>
      {items === null ? (
        <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="h-8 w-8 mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">Hozircha bildirishnomalar yo‘q</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(n => (
            <Card key={n.id} className={`p-4 flex gap-3 ${!n.read ? "bg-[#eff6ff] border-blue-200" : "bg-white"}`}>
              <div className={`h-2.5 w-2.5 rounded-full mt-2 shrink-0 ${!n.read ? "bg-[#2563eb]" : "bg-slate-300"}`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-900">{n.title}</div>
                {n.body && <div className="text-xs text-slate-600">{n.body}</div>}
                <div className="text-[11px] text-slate-400 mt-1">{fmt(n.createdAt)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
