"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const methods = [
  { id: "click", name: "Click", desc: "Click orqali to‘lov" },
  { id: "payme", name: "Payme", desc: "Payme orqali to‘lov" },
  { id: "uzum", name: "Uzum Bank", desc: "Uzum Bank kartasi" },
  { id: "card", name: "Bank kartasi", desc: "Humo / UzCard" },
];

export default function PaymentPage() {
  const [method, setMethod] = useState("click");
  const [status, setStatus] = useState<"idle"|"pending"|"paid">("idle");

  return (
    <div className="mx-auto max-w-[640px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">To‘lov</h1>
        <p className="text-sm text-slate-500">Kurs: Koreys tili 1-daraja — 890 000 so‘m</p>
      </div>

      <Card className="p-5">
        <div className="font-semibold text-slate-900">To‘lov usuli</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {methods.map(m => (
            <button key={m.id} onClick={()=>setMethod(m.id)} className={`rounded-xl border-2 p-3 text-left ${method===m.id ? "border-[#2563eb] bg-[#eff6ff]" : "border-slate-200 bg-white"}`}>
              <div className="font-medium text-sm">{m.name}</div>
              <div className="text-xs text-slate-500">{m.desc}</div>
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm flex justify-between">
          <span>Jami</span><span className="font-bold">890 000 so‘m</span>
        </div>
        {status==="idle" && <Button className="w-full mt-4" onClick={()=>{
          setStatus("pending");
          setTimeout(()=>{ setStatus("paid"); toast.success("To‘lov muvaffaqiyatli (mock)"); }, 1500);
        }}>To‘lash</Button>}
        {status==="pending" && <Badge className="mt-4 bg-amber-100 text-amber-700 border border-amber-200 w-full justify-center py-2">Pending — tekshirilmoqda...</Badge>}
        {status==="paid" && <Badge className="mt-4 bg-emerald-100 text-emerald-700 border border-emerald-200 w-full justify-center py-2">Paid — muvaffaqiyatli!</Badge>}
        <p className="text-xs text-slate-500 mt-2 text-center">Bu mock to‘lov oqimi — haqiqiy API keyin ulanadi.</p>
      </Card>

      <Card className="p-5">
        <div className="font-semibold text-sm">To‘lovlar tarixi</div>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between rounded-xl border border-slate-200 p-3"><span>TOPIK I — 1 200 000 so‘m</span><Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Paid</Badge></div>
          <div className="flex justify-between rounded-xl border border-slate-200 p-3"><span>EPS-TOPIK — 950 000 so‘m</span><Badge className="bg-amber-50 text-amber-700 border border-amber-200">Pending</Badge></div>
        </div>
      </Card>
    </div>
  );
}
