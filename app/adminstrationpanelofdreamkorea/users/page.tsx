"use client";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type U = {
  id: string; name: string; email: string; phone: string | null; role: string; topikLevel: string | null; createdAt: string;
  _count: { lessonProgress: number; testAttempts: number; enrollments: number };
};

const roleLabel: Record<string, string> = { STUDENT: "O‘quvchi", TEACHER: "Ustoz", ADMIN: "Admin" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<U[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [savingId, setSavingId] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setErr("");
    const token = (()=>{ try{ return sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; }catch{ return localStorage.getItem("dk_token") || ""; } })();
    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Xato");
        setUsers(d.users || []);
      })
      .catch(e => setErr(e.message || "Yuklab bo‘lmadi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function setRole(id: string, role: string) {
    setSavingId(id);
    try {
      const token = (()=>{ try{ return sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; }catch{ return localStorage.getItem("dk_token") || ""; } })();
      const r = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Xato");
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
      toast.success("Rol yangilandi");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSavingId(""); }
  }

  async function remove(u: U) {
    if (!confirm(`"${u.name}" hisobini o‘chirishni tasdiqlaysizmi? Barcha progress o‘chiriladi.`)) return;
    setSavingId(u.id);
    try {
      const token = (()=>{ try{ return sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; }catch{ return localStorage.getItem("dk_token") || ""; } })();
      const r = await fetch(`/api/users/${u.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Xato");
      setUsers(prev => prev.filter(x => x.id !== u.id));
      toast.success("Hisob o‘chirildi");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSavingId(""); }
  }

  const filtered = q.trim()
    ? users.filter(u => (u.name + u.email + (u.phone ?? "")).toLowerCase().includes(q.trim().toLowerCase()))
    : users;

  return (
    <div className="mx-auto max-w-[1200px] p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">O‘quvchilar</h1>
          <p className="text-sm text-slate-500">Bazadagi foydalanuvchilar — rol, progress, o‘chirish</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Ism / email / telefon qidirish…" className="pl-9 w-[260px]" />
        </div>
      </div>

      {loading && <div className="flex items-center gap-2 text-sm text-slate-500 p-4"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</div>}

      {!loading && err && (
        <Card className="p-6 flex flex-col items-start gap-3">
          <div className="flex items-center gap-2 text-amber-700"><AlertTriangle className="h-5 w-5" /> <span className="text-sm">{err}</span></div>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1" /> Qayta yuklash</Button>
        </Card>
      )}

      {!loading && !err && (
        <>
          <div className="text-xs text-slate-500">Jami: {filtered.length} ta</div>
          {filtered.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">Foydalanuvchi topilmadi</Card>
          ) : (
            <div className="space-y-2">
              {filtered.map(u => (
                <Card key={u.id} className="p-3 sm:p-4 flex flex-wrap items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0f1b3d] text-white grid place-items-center font-bold text-sm shrink-0">
                    {u.name.split(/\s+/).map(w => w[0]).slice(0,2).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-slate-900 truncate flex items-center gap-2">
                      {u.name}
                      {u.role === "ADMIN" && <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">Admin</Badge>}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{u.email}{u.phone ? ` · ${u.phone}` : ""}</div>
                  </div>
                  <div className="text-xs text-slate-500 hidden md:block text-right">
                    <div>{u._count.lessonProgress} dars · {u._count.testAttempts} test</div>
                    <div className="text-slate-400">{new Date(u.createdAt).toLocaleDateString("uz-UZ")}</div>
                  </div>
                  <select
                    value={u.role}
                    onChange={e => setRole(u.id, e.target.value)}
                    disabled={savingId === u.id}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm disabled:opacity-50"
                  >
                    <option value="STUDENT">O‘quvchi</option>
                    <option value="TEACHER">Ustoz</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <Button
                    variant="outline" size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    disabled={savingId === u.id}
                    onClick={() => remove(u)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
