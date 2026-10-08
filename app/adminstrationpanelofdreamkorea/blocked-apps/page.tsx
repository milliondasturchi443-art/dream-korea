"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BlockedApp, getBlockedApps, setBlockedApps } from "@/lib/app-lock";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Plus, Trash2, Lock } from "lucide-react";

export default function AdminBlockedAppsPage() {
  const [apps, setApps] = useState<BlockedApp[]>([]);
  const [name, setName] = useState("");
  const [pkg, setPkg] = useState("");
  const [groupIds, setGroupIds] = useState("");
  const [taskIds, setTaskIds] = useState("");

  useEffect(() => { setApps(getBlockedApps()); }, []);

  function add() {
    if (!name || !pkg) { toast.error("Nom va paket/URL kiriting"); return; }
    const app: BlockedApp = {
      id: Date.now().toString(),
      name: name.trim(),
      packageOrUrl: pkg.trim(),
      groupIds: groupIds.split(",").map(s=>s.trim()).filter(Boolean),
      taskIds: taskIds.split(",").map(s=>s.trim()).filter(Boolean),
      reason: "Admin tomonidan bloklangan",
    };
    const next = [...apps, app];
    setApps(next); setBlockedApps(next);
    setName(""); setPkg(""); setGroupIds(""); setTaskIds("");
    toast.success("Blok qo‘shildi");
  }

  function remove(id: string) {
    const next = apps.filter(a=>a.id!==id);
    setApps(next); setBlockedApps(next);
    toast.success("O‘chirildi");
  }

  return (
    <div className="mx-auto max-w-[900px] p-4 lg:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-6 w-6 text-red-600" />
        <h1 className="text-[22px] font-bold">Bloklangan ilovalar</h1>
      </div>
      <p className="text-sm text-slate-500">Admin bloklagan ilovalarni o‘quvchi ochmoqchi bo‘lsa — DreamKorea’ga redirect bo‘ladi. Blokni yechish uchun guruh vazifalarini bajarishi kerak.</p>

      <Card className="p-4 grid sm:grid-cols-2 gap-3">
        <div><label className="text-xs font-medium">Ilova nomi</label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Masalan: Instagram" className="mt-1" /></div>
        <div><label className="text-xs font-medium">Paket / URL</label><Input value={pkg} onChange={e=>setPkg(e.target.value)} placeholder="com.instagram.android yoki https://tiktok.com" className="mt-1" /></div>
        <div><label className="text-xs font-medium">Guruh ID lar (vergul bilan, bo‘sh = hammaga)</label><Input value={groupIds} onChange={e=>setGroupIds(e.target.value)} placeholder="g1, g2" className="mt-1" /></div>
        <div><label className="text-xs font-medium">Vazifa ID lar (vergul bilan)</label><Input value={taskIds} onChange={e=>setTaskIds(e.target.value)} placeholder="task1, task2" className="mt-1" /></div>
        <Button onClick={add} className="sm:col-span-2"><Plus className="h-4 w-4 mr-1"/> Qo‘shish</Button>
      </Card>

      <div className="space-y-2">
        <AnimatePresence>
          {apps.length === 0 ? <Card className="p-8 text-center text-sm text-slate-500">Hali blok yo‘q</Card> :
            apps.map(app => (
              <motion.div key={app.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} layout>
                <Card className="p-4 flex items-center gap-3">
                  <Lock className="h-5 w-5 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{app.name}</div>
                    <div className="text-xs text-slate-500 truncate">{app.packageOrUrl}</div>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {app.groupIds.length ? app.groupIds.map(g=><Badge key={g} className="text-[11px]">{g}</Badge>) : <Badge className="bg-slate-100 text-slate-600 text-[11px]">Hamma guruh</Badge>}
                      {app.taskIds.map(t=><Badge key={t} className="bg-amber-100 text-amber-700 text-[11px]">{t}</Badge>)}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={()=>remove(app.id)}><Trash2 className="h-4 w-4" /></Button>
                </Card>
              </motion.div>
            ))
          }
        </AnimatePresence>
      </div>
    </div>
  );
}
