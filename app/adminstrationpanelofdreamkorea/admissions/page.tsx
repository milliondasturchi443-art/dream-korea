"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, RefreshCw, Phone, Mail } from "lucide-react";

type A = {
  id: string; name: string; phone: string; email: string;
  birth?: string | null; edu?: string | null; topik?: string | null; uni?: string | null; comment?: string | null;
  createdAt: string;
};

export default function AdminAdmissionsPage() {
  const [items, setItems] = useState<A[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  function load() {
    setLoading(true); setErr("");
    const token = localStorage.getItem("dk_token") || "";
    fetch("/api/admissions", { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Xato");
        setItems(d.items || []);
      })
      .catch(e => setErr(e.message || "Yuklab bo‘lmadi"))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  return (
    <div className="mx-auto max-w-[1200px] p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Qabul arizalari</h1>
        <p className="text-sm text-slate-500">/admission formasidan tushgan real arizalar</p>
      </div>

      {loading && <div className="flex items-center gap-2 text-sm text-slate-500 p-4"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</div>}

      {!loading && err && (
        <Card className="p-6 flex flex-col items-start gap-3">
          <div className="flex items-center gap-2 text-amber-700"><AlertTriangle className="h-5 w-5" /> <span className="text-sm">{err}</span></div>
          <button onClick={load} className="text-sm text-[#2563eb] font-medium">Qayta yuklash</button>
        </Card>
      )}

      {!loading && !err && (
        items.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-500">Hozircha arizalar yo‘q</Card>
        ) : (
          <div className="space-y-2">
            {items.map(a => (
              <Card key={a.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">{a.name}</div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
                      <a href={`tel:${a.phone.replace(/\s/g,"")}`} className="flex items-center gap-1 hover:text-[#2563eb]"><Phone className="h-3 w-3" />{a.phone}</a>
                      <a href={`mailto:${a.email}`} className="flex items-center gap-1 hover:text-[#2563eb]"><Mail className="h-3 w-3" />{a.email}</a>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
                      {a.edu && <span>Ma’lumot: {a.edu}</span>}
                      {a.topik && <span>TOPIK: {a.topik}</span>}
                      {a.uni && <span>Universitet: {a.uni}</span>}
                    </div>
                    {a.comment && <div className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-lg p-2">{a.comment}</div>}
                  </div>
                  <div className="text-xs text-slate-400 shrink-0">
                    {new Date(a.createdAt).toLocaleString("uz-UZ", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
