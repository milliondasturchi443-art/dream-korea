"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Search, Plus } from "lucide-react";
import { toast } from "sonner";

type Pay = { id:string; amount:number; method:string; status:string; createdAt:string; user:{ id:string; name:string; email:string } };
type Group = { id:string; name:string };
function authHeader():Record<string,string>{ try{ const t=sessionStorage.getItem("dk_token")||localStorage.getItem("dk_token")||""; return t?{Authorization:`Bearer ${t}`}:{};}catch{ return {}; } }

export default function TeacherPaymentsPage(){
  const [groups,setGroups]=useState<Group[]>([]);
  const [groupId,setGroupId]=useState("");
  const [payments,setPayments]=useState<Pay[]>([]);
  const [loading,setLoading]=useState(true);
  const [q,setQ]=useState("");
  // add form
  const [userEmail,setUserEmail]=useState("");
  const [amount,setAmount]=useState("");
  const [method,setMethod]=useState("cash");
  const [saving,setSaving]=useState(false);

  async function load(){
    setLoading(true);
    const h=authHeader();
    try{
      const gs=await fetch("/api/groups",{ headers:h}).then(r=>r.json());
      const gList:Array<Group>=Array.isArray(gs.groups)?gs.groups:[];
      setGroups(gList);
      const url = groupId ? `/api/payments?groupId=${encodeURIComponent(groupId)}` : "/api/payments";
      const pr=await fetch(url,{ headers:h}).then(r=>r.json());
      setPayments(Array.isArray(pr.payments)?pr.payments:[]);
    }catch{}finally{ setLoading(false); }
  }
  useEffect(()=>{ load(); },[groupId]);

  async function add(){
    const email=userEmail.trim(); const am=Number(amount);
    if(!email || !am){ toast.error("Email va summa kiriting"); return; }
    // resolve userId by email
    setSaving(true);
    try{
      const h=authHeader();
      const us=await fetch(`/api/users`,{ headers:h}).then(r=>r.json());
      const u = (us.users||[]).find((x:{email:string})=> x.email.toLowerCase()===email.toLowerCase());
      if(!u?.id) throw new Error("Foydalanuvchi topilmadi");
      const r=await fetch("/api/payments",{ method:"POST", headers:{ "Content-Type":"application/json", ...h }, body:JSON.stringify({ userId: u.id, amount: am, method, status:"PAID" }) });
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Saqlab bo'lmadi");
      toast.success("To'lov qo'shildi");
      setUserEmail(""); setAmount("");
      load();
    }catch(e){ toast.error((e as Error).message);}finally{ setSaving(false); }
  }

  const filtered = q.trim() ? payments.filter(p=> (p.user.name+p.user.email).toLowerCase().includes(q.toLowerCase()) || String(p.amount).includes(q)) : payments;

  return (
    <div className="mx-auto max-w-[1100px] p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2"><CreditCard className="h-6 w-6 text-emerald-600"/> To'lovlar nazorati</h1>
          <p className="text-sm text-slate-500">Guruh o'quvchilarining to'lovlari — ko'rish va qo'shish (faqat o'z guruhlaringiz)</p>
        </div>
        <select value={groupId} onChange={e=>setGroupId(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm min-w-[200px]">
          <option value="">Barcha guruhlarim</option>
          {groups.map(g=> <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      <Card className="p-4">
        <div className="font-semibold text-sm">To'lov qo'shish</div>
        <div className="mt-3 grid sm:grid-cols-[1fr_140px_140px_120px] gap-2">
          <Input placeholder="O'quvchi email" value={userEmail} onChange={e=>setUserEmail(e.target.value)} />
          <Input placeholder="Summa (mas: 500000)" inputMode="numeric" value={amount} onChange={e=>setAmount(e.target.value)} />
          <select value={method} onChange={e=>setMethod(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
            <option value="cash">Naqd</option><option value="card">Karta</option><option value="transfer">O'tkazma</option>
          </select>
          <Button onClick={add} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <Plus className="h-4 w-4 mr-1"/>} Qo'shish</Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Faqat o'z guruhingizdagi o'quvchiga qo'sha olasiz.</p>
      </Card>

      <Card className="p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
          <Input placeholder="Ism / email / summa qidirish..." className="pl-9" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <Button variant="outline" onClick={load}>Yangilash</Button>
      </Card>

      {loading ? <div className="flex items-center gap-2 text-sm text-slate-500 p-4"><Loader2 className="h-4 w-4 animate-spin"/> Yuklanmoqda…</div> : filtered.length===0 ? <Card className="p-8 text-center text-sm text-slate-500">To'lovlar yo'q</Card> : (
        <div className="space-y-2">
          {filtered.map(p=> (
            <Card key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{p.user.name} <span className="text-xs text-slate-500">· {p.user.email}</span></div>
                <div className="text-xs text-slate-500 mt-0.5">{new Date(p.createdAt).toLocaleString("uz-UZ",{ day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit"})}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{p.amount.toLocaleString("uz-UZ")} so'm</span>
                <Badge className={`text-[11px] border ${p.status==="PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200": p.status==="PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-700"}`}>{p.status}</Badge>
                <Badge className="bg-slate-100 text-slate-700 border text-[11px]">{p.method}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
