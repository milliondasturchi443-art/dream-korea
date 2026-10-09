"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type Group={ id:string; name:string; members:{ user:{ id:string; name:string; email:string }}[]; teacher:{ name:string}|null };

function authHeader():Record<string,string>{ try{ const t=sessionStorage.getItem("dk_token")||localStorage.getItem("dk_token")||""; return t?{Authorization:`Bearer ${t}`}:{};}catch{ return {}; } }

export default function TeacherGroups(){
  const [groups,setGroups]=useState<Group[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ fetch("/api/groups",{ headers:authHeader()}).then(r=>r.json()).then(d=> setGroups(Array.isArray(d.groups)?d.groups:[])).catch(()=>{}).finally(()=> setLoading(false)); },[]);
  if(loading) return <div className="mx-auto max-w-[900px] p-4 lg:p-6 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/> Yuklanmoqda…</div>;
  return (
    <div className="mx-auto max-w-[900px] p-4 lg:p-6 space-y-4">
      <h1 className="text-[22px] font-bold text-slate-900">Guruhlarim</h1>
      <p className="text-sm text-slate-500">Sizga biriktirilgan guruhlar va o'quvchilar</p>
      {groups.length===0 ? <Card className="p-8 text-center text-sm text-slate-500">Guruh yo'q — admin tayinlaydi.</Card> : (
        <div className="grid gap-4">
          {groups.map(g=> (
            <Card key={g.id} className="p-4">
              <div className="font-semibold">{g.name} <Badge className="ml-2 bg-slate-100 text-slate-700 border text-[11px]">{g.members.length} o'quvchi</Badge></div>
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {g.members.map(m=> (
                  <div key={m.user.id} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                    <div className="text-sm font-medium">{m.user.name}</div>
                    <div className="text-xs text-slate-500">{m.user.email}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
