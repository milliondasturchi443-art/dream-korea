"use client";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Trash2, Plus, Loader2, AlertTriangle, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

type Teacher = { id: string; name: string; email: string; role: string };
type Member = { id: string; user: { id: string; name: string; email: string; phone: string | null } };
type Group = { id: string; name: string; teacher: { id: string; name: string; email: string } | null; members: Member[]; _count?: { members: number } };

function authHeader(): Record<string,string>{
  try{ const t = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; return t ? { Authorization: `Bearer ${t}` }:{};}catch{ return {}; }
}

export default function AdminGroupsPage(){
  const [groups,setGroups]=useState<Group[]>([]);
  const [teachers,setTeachers]=useState<Teacher[]>([]);
  const [students,setStudents]=useState<Teacher[]>([]);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState("");
  const [name,setName]=useState("");
  const [teacherId,setTeacherId]=useState("");
  const [q,setQ]=useState("");
  const [creating,setCreating]=useState(false);
  const [adding,setAdding]=useState<string>("");

  const loadGroups = useCallback(async()=>{
    setLoading(true); setErr("");
    try{
      const h = authHeader();
      const r = await fetch("/api/groups",{ headers:h });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Yuklab bo'lmadi");
      setGroups(d.groups||[]);
    }catch(e){ setErr((e as Error).message);}finally{ setLoading(false); }
  },[]);

  const loadUsers = useCallback(async()=>{
    try{
      const h=authHeader();
      const r=await fetch("/api/users",{ headers:h });
      const d=await r.json();
      if(r.ok && Array.isArray(d.users)){
        setTeachers(d.users.filter((u:Teacher)=>u.role==="TEACHER"));
        setStudents(d.users.filter((u:Teacher)=>u.role==="STUDENT"));
      }
    }catch{}
  },[]);

  useEffect(()=>{ loadGroups(); loadUsers(); },[loadGroups,loadUsers]);

  async function createGroup(){
    if(!name.trim()){ toast.error("Guruh nomini kiriting"); return; }
    setCreating(true);
    try{
      const h=authHeader();
      const r=await fetch("/api/groups",{ method:"POST", headers:{ "Content-Type":"application/json", ...h }, body:JSON.stringify({ name:name.trim(), teacherId: teacherId||undefined }) });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Yaratib bo'lmadi");
      toast.success("Guruh yaratildi");
      setName(""); setTeacherId("");
      loadGroups();
    }catch(e){ toast.error((e as Error).message);}finally{ setCreating(false); }
  }

  async function delGroup(id:string){
    if(!confirm("Guruhni o'chirishni tasdiqlaysizmi?")) return;
    try{
      const h=authHeader();
      const r=await fetch(`/api/groups/${id}`,{ method:"DELETE", headers:h });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"O'chirib bo'lmadi");
      toast.success("O'chirildi");
      setGroups(prev=>prev.filter(g=>g.id!==id));
    }catch(e){ toast.error((e as Error).message); }
  }

  async function addMember(groupId:string, userId:string){
    if(!userId) return;
    setAdding(groupId);
    try{
      const h=authHeader();
      const r=await fetch(`/api/groups/${groupId}/members`,{ method:"POST", headers:{ "Content-Type":"application/json", ...h }, body:JSON.stringify({ userId }) });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Qo'shib bo'lmadi");
      toast.success("O'quvchi qo'shildi");
      loadGroups();
    }catch(e){ toast.error((e as Error).message);}finally{ setAdding(""); }
  }

  async function removeMember(groupId:string, userId:string){
    try{
      const h=authHeader();
      const r=await fetch(`/api/groups/${groupId}/members?userId=${encodeURIComponent(userId)}`,{ method:"DELETE", headers:h });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"O'chirib bo'lmadi");
      toast.success("O'quvchi chiqarildi");
      setGroups(prev=>prev.map(g=> g.id===groupId ? { ...g, members: g.members.filter(m=>m.user.id!==userId)}:g));
    }catch(e){ toast.error((e as Error).message); }
  }

  async function addByEmail(groupId:string){
    const email = prompt("O'quvchi emailini kiriting:");
    if(!email) return;
    setAdding(groupId);
    try{
      const h=authHeader();
      const r=await fetch(`/api/groups/${groupId}/members`,{ method:"POST", headers:{ "Content-Type":"application/json", ...h }, body:JSON.stringify({ email }) });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Qo'shib bo'lmadi");
      toast.success("O'quvchi qo'shildi");
      loadGroups();
    }catch(e){ toast.error((e as Error).message);}finally{ setAdding(""); }
  }

  const filtered = q.trim() ? groups.filter(g=> g.name.toLowerCase().includes(q.toLowerCase()) || g.teacher?.name.toLowerCase().includes(q.toLowerCase())) : groups;

  return (
    <div className="mx-auto max-w-[1200px] p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2"><Users className="h-6 w-6 text-[#2563eb]"/> Guruhlar</h1>
          <p className="text-sm text-slate-500">Admin guruh yaratadi, ustoz tayinlaydi, qabul qilingan o'quvchilarni guruhga qo'shadi</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Guruh qidirish..." className="pl-9 w-[240px]"/>
        </div>
      </div>

      <Card className="p-4">
        <div className="font-semibold text-sm">Yangi guruh</div>
        <div className="mt-3 grid sm:grid-cols-[1fr_220px_120px] gap-2">
          <Input placeholder="Guruh nomi (mas: TOPIK I — A guruh)" value={name} onChange={e=>setName(e.target.value)} />
          <select value={teacherId} onChange={e=>setTeacherId(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
            <option value="">— Ustoz tanlang (ixtiyoriy) —</option>
            {teachers.map(t=> <option key={t.id} value={t.id}>{t.name} — {t.email}</option>)}
          </select>
          <Button onClick={createGroup} disabled={creating}>{creating ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <Plus className="h-4 w-4 mr-1"/>} Yaratish</Button>
        </div>
        {teachers.length===0 && <p className="text-xs text-amber-600 mt-2">Hali ustoz yo'q — avval Users da rolni TEACHER qiling.</p>}
      </Card>

      {loading && <div className="flex items-center gap-2 text-sm text-slate-500 p-4"><Loader2 className="h-4 w-4 animate-spin"/> Yuklanmoqda...</div>}
      {!loading && err && <Card className="p-6 flex items-center gap-2 text-amber-700"><AlertTriangle className="h-5 w-5"/>{err}</Card>}

      {!loading && !err && filtered.length===0 && <Card className="p-8 text-center text-sm text-slate-500">Guruh yo'q — yuqoridan yarating</Card>}

      <div className="grid gap-4">
        {filtered.map(g=> (
          <Card key={g.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">{g.name}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  {g.teacher ? <><Badge className="bg-emerald-50 text-emerald-700 border text-[11px]">{g.teacher.name}</Badge> <span>{g.teacher.email}</span></> : <Badge className="bg-amber-50 text-amber-700 border text-[11px]">Ustoz tayinlanmagan</Badge>}
                  <span>· {g.members.length} o'quvchi</span>
                </div>
              </div>
              <div className="flex gap-2">
                <select onChange={e=>{ const v=e.target.value; if(v) addMember(g.id,v); e.target.value=""; }} defaultValue="" className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm max-w-[200px]">
                  <option value="">+ O'quvchi qo'shish</option>
                  {students.filter(s=> !g.members.some(m=>m.user.id===s.id)).slice(0,50).map(s=> <option key={s.id} value={s.id}>{s.name} — {s.email}</option>)}
                </select>
                <Button variant="outline" size="sm" onClick={()=>addByEmail(g.id)}><UserPlus className="h-4 w-4 mr-1"/> Email</Button>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={()=>delGroup(g.id)}><Trash2 className="h-4 w-4"/></Button>
              </div>
            </div>

            {g.members.length===0 ? <p className="text-xs text-slate-400 mt-3">Hali o'quvchi yo'q — yuqoridan qo'shing (qabul qilingan talabalarni shu yerga yo'naltiring)</p> : (
              <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {g.members.map(m=> (
                  <div key={m.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{m.user.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{m.user.email}{m.user.phone ? ` · ${m.user.phone}` : ""}</div>
                    </div>
                    <button onClick={()=>removeMember(g.id,m.user.id)} className="text-xs text-red-600 hover:underline shrink-0">chiqarish</button>
                  </div>
                ))}
              </div>
            )}
            {adding===g.id && <div className="text-xs text-slate-500 mt-2 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> qo'shilmoqda...</div>}
          </Card>
        ))}
      </div>
    </div>
  );
}
