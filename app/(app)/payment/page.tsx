"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, CheckCircle2, Clock, Phone } from "lucide-react";

type Pay = { id: string; amount: number; method: string; month?: string | null; note?: string | null; status: string; createdAt: string };

function authHeader(): Record<string, string> {
  try { const t = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; return t ? { Authorization: `Bearer ${t}` } : {}; } catch { return {}; }
}

export default function PaymentPage() {
  const [items, setItems] = useState<Pay[] | null>(null);

  useEffect(() => {
    fetch("/api/payments", { headers: authHeader() })
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d.payments) ? d.payments : []))
      .catch(() => setItems([]));
  }, []);

  const pending = (items ?? []).filter(p => p.status === "PENDING");

  return (
    <div className="mx-auto max-w-[720px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2"><CreditCard className="h-6 w-6 text-emerald-600"/> To'lovlar</h1>
        <p className="text-sm text-slate-500">Ustozingiz yuborgan to'lov eslatmalari va hisobingiz</p>
      </div>

      {pending.length > 0 && (
        <Card className="p-4 border border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 font-semibold text-amber-800"><Clock className="h-4 w-4"/> To'lash kerak ({pending.length} ta)</div>
          <div className="mt-3 space-y-2">
            {pending.map(p => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white border border-amber-200 p-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{p.amount.toLocaleString("uz-UZ")} so'm{p.month ? ` · ${p.month}` : ""}</div>
                  {p.note && <div className="text-xs text-slate-500 mt-0.5">{p.note}</div>}
                </div>
                <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px]">Kutilmoqda</Badge>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-amber-700 flex items-center gap-1"><Phone className="h-3.5 w-3.5"/> To'lovni ustozingiz orqali amalga oshiring: +998 94 328 05 13</p>
        </Card>
      )}

      {items === null ? (
        <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/> Yuklanmoqda…</div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400" />
          <p className="mt-3 text-sm text-slate-500">Hozircha to'lov yo'q — hisobingiz toza</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(p => (
            <Card key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{p.amount.toLocaleString("uz-UZ")} so'm{p.month ? <span className="text-slate-500 font-normal"> · {p.month}</span> : null}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {new Date(p.createdAt).toLocaleDateString("uz-UZ")}
                  {p.note && <span className="text-slate-400"> · {p.note}</span>}
                </div>
              </div>
              {p.status === "PAID" ? (
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> To'langan</Badge>
              ) : p.status === "PENDING" ? (
                <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px]">Kutilmoqda</Badge>
              ) : (
                <Badge className="bg-slate-100 text-slate-700 border text-[11px]">{p.status}</Badge>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
