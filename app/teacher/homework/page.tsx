"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Plus } from "lucide-react";
import { toast } from "sonner";

type Group = { id:string; name:string };
type HW = { id:string; title:string; description:string|null; dueDate:string|null; createdAt:string; group:{ id:string; name:string }; teacher?:{ id:string; name:string } };
function authHeader():Record<string,string>{ try{ const t=sessionStorage.getItem("dk_token")||localStorage.getItem("dk_token")||""; return t?{Authorization:`Bearer ${t}`}:{};}catch{ return {}; } }

export default function TeacherHomeworkPage(){
  const [groups,setGroups]=useState<Group[]>([]);
  const [items,setItems]=useState<HW[]>([]);
  const [groupId,setGroupId]=useState("");
  const [title,setTitle]=useState("");
  const [desc,setDesc]=useState("");
  const [due,setDue]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);

  async function load(){
    const h=authHeader();
    try{
      const gs=await fetch("/api/groups",{ headers:h}).then(r=>r.json());
      const gl:Array<Group>=Array.isArray(gs.groups)?gs.groups:[];
      setGroups(gl);
      if(!groupId && gl[0]?.id) setGroupId(gl[0].id);
      const url = groupId ? `/api/homework?groupId=${encodeURIComponent(groupId)}` : "/api/homework";
      const hw=await fetch(url,{ headers:h}).then(r=>r.json());
      setItems(Array.isArray(hw.items)?hw.items:[]);
    }catch{}finally{ setLoading(false); }
  }
  useEffect(()=>{ load(); },[groupId]);

  async function add(){
    if(!groupId || !title.trim()){ toast.error("Guruh va mavzu kiriting"); return; }
    setSaving(true);
    try{
      const r=await fetch("/api/homework",{ method:"POST", headers:{ "Content-Type":"application/json", ...authHeader()}, body:JSON.stringify({ groupId, title:title.trim(), description:desc.trim(), dueDate:due.trim()||undefined }) });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Saqlab bo'lmadi");
      toast.success("Uy vazifasi berildi — o'quvchilarga bildirishnoma ketdi");
      setTitle(""); setDesc(""); setDue("");
      load();
    }catch(e){ toast.error((e as Error).message);}finally{ setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-[900px] p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2"><BookOpen className="h-6 w-6 text-violet-600"/> Uy vazifalari</h1>
          <p className="text-sm text-slate-500">Guruhga vazifa bering — o'quvchilarga /notifications ga tushadi</p>
        </div>
        <select value={groupId} onChange={e=>setGroupId(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm min-w-[200px]">
          {groups.map(g=> <option key={g.id} value={g.id}>{g.name}</option>)}
          {groups.length===0 && <option value="">— Guruh yo'q —</option>}
        </select>
      </div>

      <Card className="p-4 space-y-3">
        <div className="font-semibold text-sm">Yangi vazifa</div>
        <Input placeholder="Mavzu (mas: 1-dars — Hangul yozuvi)" value={title} onChange={e=>setTitle(e.target.value)} />
        <Textarea placeholder="Tavsif (ixtiyoriy)" value={desc} onChange={e=>setDesc(e.target.value)} />
        <div className="flex gap-2">
          <Input type="date" value={due} onChange={e=>setDue(e.target.value)} className="max-w-[200px]" placeholder="Topshirish sanasi" />
          <Button onClick={add} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <Plus className="h-4 w-4 mr-1"/>} Berish</Button>
        </div>
      </Card>

      {loading ? <div className="flex items-center gap-2 text-sm text-slate-500 p-4"><Loader2 className="h-4 w-4 animate-spin"/> Yuklanmoqda…</div> : items.length===0 ? <Card className="p-8 text-center text-sm text-slate-500">Hali vazifa yo'q</Card> : (
        <div className="space-y-2">
          {items.map(h=> (
            <Card key={h.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{h.title}</div>
                  {h.description && <div className="text-xs text-slate-600 mt-1">{h.description}</div>}
                  <div className="text-xs text-slate-500 mt-1">{new Date(h.createdAt).toLocaleDateString("uz-UZ")} · {h.group.name}{h.teacher ? ` · ${h.teacher.name}` : ""}</div>
                </div>
                {h.dueDate && <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] shrink-0">Topshirish: {h.dueDate}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
