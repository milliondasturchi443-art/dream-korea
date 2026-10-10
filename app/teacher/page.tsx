"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Users, ClipboardCheck, CreditCard, BookOpen, Loader2, GraduationCap, Bell } from "lucide-react";

type Group = { id:string; name:string; _count?:{ members:number }; members:{ user:{ id:string; name:string}}[]; teacher:{ name:string }|null };

function authHeader():Record<string,string>{ try{ const t=sessionStorage.getItem("dk_token")||localStorage.getItem("dk_token")||""; return t?{Authorization:`Bearer ${t}`}:{};}catch{ return {}; } }

export default function TeacherDashboard(){
  const [groups,setGroups]=useState<Group[]>([]);
  const [loading,setLoading]=useState(true);
  const [name,setName]=useState("Ustoz");
  useEffect(()=>{
    const h=authHeader();
    fetch("/api/auth/me",{ headers:h }).then(r=>r.json()).then(d=>{ if(d?.name) setName(d.name); }).catch(()=>{});
    fetch("/api/groups",{ headers:h }).then(r=>r.json()).then(d=> setGroups(Array.isArray(d.groups)?d.groups:[])).catch(()=>{}).finally(()=> setLoading(false));
  },[]);

  if(loading) return <div className="mx-auto max-w-[1100px] p-4 lg:p-6 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/> Yuklanmoqda…</div>;
  const totalStudents = groups.reduce((s,g)=> s + (g.members?.length ?? g._count?.members ?? 0), 0);
  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Assalomu alaykum, {name}!</h1>
        <p className="text-sm text-slate-500">Ustoz kabineti — guruhlar, davomat, to‘lovlar va uy vazifalari</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5"><div className="text-xs text-slate-500 flex items-center justify-between">Guruhlar <Users className="h-4 w-4 text-slate-400"/></div><div className="text-xl font-bold mt-1">{groups.length}</div></Card>
        <Card className="p-5"><div className="text-xs text-slate-500 flex items-center justify-between">O‘quvchilar <GraduationCap className="h-4 w-4 text-slate-400"/></div><div className="text-xl font-bold mt-1">{totalStudents}</div></Card>
        <Card className="p-5"><div className="text-xs text-slate-500 flex items-center justify-between">Davomat <ClipboardCheck className="h-4 w-4 text-slate-400"/></div><Link href="/teacher/attendance" className="text-sm text-[#2563eb] font-medium mt-2 inline-block">Belgilash →</Link></Card>
        <Card className="p-5"><div className="text-xs text-slate-500 flex items-center justify-between">Uy vazifalari <BookOpen className="h-4 w-4 text-slate-400"/></div><Link href="/teacher/homework" className="text-sm text-[#2563eb] font-medium mt-2 inline-block">Berish →</Link></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="font-semibold">Guruhlarim</div>
          {groups.length===0 ? <p className="text-sm text-slate-400 mt-3">Hali guruh biriktirilmagan — admin “Guruhlar” bo‘limida sizni tayinlaydi.</p> : (
            <div className="mt-3 space-y-2">
              {groups.map(g=> (
                <div key={g.id} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                  <div><div className="text-sm font-medium">{g.name}</div><div className="text-xs text-slate-500">{g.members?.length ?? g._count?.members ?? 0} o‘quvchi</div></div>
                  <Badge className="bg-white border text-slate-700 text-[11px]">{g.members?.length ?? 0} nafar</Badge>
                </div>
              ))}
            </div>
          )}
          <Link href="/teacher/groups"><Button variant="outline" size="sm" className="mt-4 w-full">Batafsil</Button></Link>
        </Card>
        <Card className="p-5">
          <div className="font-semibold">Tez amallar</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/teacher/attendance"><Card className="p-4 text-center hover:border-blue-200"><ClipboardCheck className="h-6 w-6 mx-auto text-[#2563eb]"/><div className="text-sm font-medium mt-1">Davomat</div></Card></Link>
            <Link href="/teacher/payments"><Card className="p-4 text-center hover:border-blue-200"><CreditCard className="h-6 w-6 mx-auto text-emerald-600"/><div className="text-sm font-medium mt-1">To‘lovlar</div></Card></Link>
            <Link href="/teacher/homework"><Card className="p-4 text-center hover:border-blue-200"><BookOpen className="h-6 w-6 mx-auto text-violet-600"/><div className="text-sm font-medium mt-1">Uy vazifasi</div></Card></Link>
            <Link href="/notifications"><Card className="p-4 text-center hover:border-blue-200"><Bell className="h-6 w-6 mx-auto text-amber-600"/><div className="text-sm font-medium mt-1">Bildirishnomalar</div></Card></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
