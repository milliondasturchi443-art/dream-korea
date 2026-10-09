"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Save, History, Bell } from "lucide-react";
import { toast } from "sonner";

type Group = { id:string; name:string; members:{ user:{ id:string; name:string; email:string }}[] };
type Row = { studentId:string; status:"PRESENT"|"ABSENT"; student?:{ name:string; email:string } };
function authHeader():Record<string,string>{ try{ const t=sessionStorage.getItem("dk_token")||localStorage.getItem("dk_token")||""; return t?{Authorization:`Bearer ${t}`}:{};}catch{ return {}; } }

export default function TeacherAttendancePage(){
  const [groups,setGroups]=useState<Group[]>([]);
  const [groupId,setGroupId]=useState("");
  const [date,setDate]=useState(()=> new Date().toISOString().slice(0,10));
  const [marks,setMarks]=useState<Record<string,"PRESENT"|"ABSENT">>({});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [history,setHistory]=useState<{ id:string; date:string; studentId:string; status:string; student?:{ name:string }}[]>([]);

  useEffect(()=>{
    fetch("/api/groups",{ headers:authHeader()}).then(r=>r.json()).then(d=>{
      const gs=Array.isArray(d.groups)?d.groups:[]; setGroups(gs);
      if(gs[0]?.id) setGroupId(gs[0].id);
    }).catch(()=>{}).finally(()=> setLoading(false));
  },[]);

  const group = groups.find(g=>g.id===groupId) || null;

  useEffect(()=>{
    if(!groupId||!date) return;
    fetch(`/api/attendance?groupId=${encodeURIComponent(groupId)}&date=${encodeURIComponent(date)}`,{ headers:authHeader()})
      .then(r=>r.json()).then(d=>{
        const rows:Row[]=Array.isArray(d.rows)?d.rows:[];
        const m:Record<string,"PRESENT"|"ABSENT">={};
        rows.forEach(rw=>{ m[rw.studentId]= rw.status==="ABSENT"?"ABSENT":"PRESENT"; });
        setMarks(m);
        // история по группе (последние)
        fetch(`/api/attendance?groupId=${encodeURIComponent(groupId)}`,{ headers:authHeader()}).then(r=>r.json()).then(dd=>{
          setHistory(Array.isArray(dd.rows)? dd.rows.slice(0,20):[]);
        }).catch(()=>{});
      }).catch(()=>{});
  },[groupId,date]);

  function toggle(id:string){
    setMarks(prev=> ({ ...prev, [id]: prev[id]==="ABSENT" ? "PRESENT" : "ABSENT" }));
  }

  async function save(){
    if(!group || !groupId) { toast.error("Guruh tanlang"); return; }
    const payload = group.members.map(m=>{
      const st = marks[m.user.id] || "PRESENT";
      return { studentId: m.user.id, status: st };
    });
    setSaving(true);
    try{
      const r=await fetch("/api/attendance",{ method:"POST", headers:{ "Content-Type":"application/json", ...authHeader()}, body:JSON.stringify({ groupId, date, marks: payload }) });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Saqlab bo'lmadi");
      toast.success("Davomat saqlandi — yo'qlar uchun ogohlantirish yuborildi");
    }catch(e){ toast.error((e as Error).message);}finally{ setSaving(false); }
  }

  if(loading) return <div className="mx-auto max-w-[1100px] p-4 lg:p-6 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/> Yuklanmoqda…</div>;
  if(groups.length===0) return <div className="mx-auto max-w-[1100px] p-4 lg:p-6"><Card className="p-6 text-sm text-slate-500">Sizga hali guruh biriktirilmagan — admin /admin/groups da tayinlaydi.</Card></div>;

  return (
    <div className="mx-auto max-w-[900px] p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">Davomat</h1>
          <p className="text-sm text-slate-500">Kim keldi — PRESENT, kim yo'q — ABSENT. ABSENT uchun o'quvchiga avtomatik ogohlantirish ketadi.</p>
        </div>
        <div className="flex gap-2">
          <select value={groupId} onChange={e=>setGroupId(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm min-w-[180px]">
            {groups.map(g=> <option key={g.id} value={g.id}>{g.name} — {g.members.length} nafar</option>)}
          </select>
          <Input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-[160px]"/>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-sm">{group?.name} · {date}</div>
          <Badge className="bg-slate-100 text-slate-700 border text-[11px]">{group?.members.length ?? 0} o'quvchi</Badge>
        </div>
        <div className="mt-3 grid gap-2">
          {group?.members.map(m=>{
            const st = marks[m.user.id] || "PRESENT";
            const isAbsent = st==="ABSENT";
            return (
              <div key={m.user.id} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${isAbsent? "bg-red-50 border-red-200": "bg-emerald-50 border-emerald-200"}`}>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900">{m.user.name}</div>
                  <div className="text-xs text-slate-500">{m.user.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {isAbsent && <span className="text-xs text-red-600 flex items-center gap-1"><Bell className="h-3 w-3"/> ogohlantirish ketadi</span>}
                  <button onClick={()=>toggle(m.user.id)} className={`h-9 px-4 rounded-full text-sm font-semibold border ${isAbsent? "bg-red-500 text-white border-red-500": "bg-emerald-500 text-white border-emerald-500"}`}>
                    {isAbsent ? <span className="flex items-center gap-1"><X className="h-4 w-4"/> Yo'q</span> : <span className="flex items-center gap-1"><Check className="h-4 w-4"/> Bor</span>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <Button onClick={save} disabled={saving} className="mt-4 w-full"><Save className="h-4 w-4 mr-1"/>{saving? "Saqlanmoqda…":"Saqlash"}</Button>
        <p className="text-xs text-slate-500 mt-2">Har bir ABSENT uchun Notification saqlanadi — o'quvchi /notifications da ko'radi, tarix shu yerda qoladi.</p>
      </Card>

      <Card className="p-4">
        <div className="font-semibold text-sm flex items-center gap-2"><History className="h-4 w-4"/> Tarix — oxirgi belgilar</div>
        {history.length===0 ? <p className="text-xs text-slate-400 mt-2">Hali davomat belgilanmagan</p> : (
          <div className="mt-3 space-y-1.5">
            {history.map(h=> (
              <div key={h.id} className="flex items-center justify-between text-sm rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                <span className="text-slate-700">{h.date} — {h.student?.name ?? h.studentId.slice(-6)}</span>
                <Badge className={`text-[11px] border ${h.status==="ABSENT" ? "bg-red-50 text-red-700 border-red-200": "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>{h.status==="ABSENT" ? "Yo'q" : "Bor"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
