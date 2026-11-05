"use client";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Loader2, AlertTriangle, RefreshCw, Ban, ShieldCheck, Archive, Merge } from "lucide-react";
import { toast } from "sonner";

type U = {
  id: string; name: string; email: string; phone: string | null; role: string; topikLevel: string | null; createdAt: string;
  banned: boolean; bannedAt: string | null; bannedReason: string | null; lastIp: string | null; regIp: string | null; archivedAt: string | null;
  _count: { lessonProgress: number; testAttempts: number; enrollments: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<U[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [savingId, setSavingId] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [mergeSource, setMergeSource] = useState<U | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setErr("");
    const token = (()=>{ try{ return sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; }catch{ return localStorage.getItem("dk_token") || ""; } })();
    fetch("/api/users?archived=1", { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Xato");
        setUsers(d.users || []);
      })
      .catch(e => setErr(e.message || "Yuklab bo‘lmadi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { queueMicrotask(load); }, [load]);

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

  async function setBan(u: U) {
    const next = !u.banned;
    const why = next
      ? prompt(`"${u.name}" hisobini bloklash sababini kiriting (ixtiyoriy):`, "")
      : "";
    if (why === null) return; // bekor qilindi
    setSavingId(u.id);
    try {
      const token = (()=>{ try{ return sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; }catch{ return localStorage.getItem("dk_token") || ""; } })();
      const r = await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ banned: next, bannedReason: (why || "").trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Xato");
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, banned: next, bannedAt: next ? new Date().toISOString() : null, bannedReason: next ? ((why || "").trim() || null) : null } : x));
      toast.success(next ? "Hisob bloklandi" : "Bloklash olib tashlandi");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSavingId(""); }
  }

  async function setArchived(u: U, archived: boolean) {
    const msg = archived
      ? `"${u.name}" arxivlansinmi? O‘quvchi barcha ro‘yxatlardan yashiriladi, lekin to‘lov tarixi saqlanadi.`
      : `"${u.name}" arxivdan qaytarilsinmi?`;
    if (!confirm(msg)) return;
    setSavingId(u.id);
    try {
      const token = (()=>{ try{ return sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; }catch{ return localStorage.getItem("dk_token") || ""; } })();
      const r = await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ archived }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Xato");
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, archivedAt: archived ? new Date().toISOString() : null } : x));
      toast.success(archived ? "Hisob arxivlandi" : "Hisob arxivdan qaytarildi");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSavingId(""); }
  }

  async function mergeInto(source: U, targetId: string) {
    if (!targetId || targetId === source.id) return;
    const target = users.find(u => u.id === targetId);
    if (!target) return;
    const ok = confirm(
      `"${source.name}" (${source.email}) hisobini "${target.name}" (${target.email}) ga birlashtirasizmi?\n\n` +
      `Barcha to‘lovlar va oylik hisoblar nishon o‘quvchiga ko‘chiriladi, so‘ng dublikat o‘chiriladi. ` +
      `Moliyaviy tarix yo‘qolmaydi.`
    );
    if (!ok) return;
    setSavingId(source.id);
    try {
      const token = (()=>{ try{ return sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; }catch{ return localStorage.getItem("dk_token") || ""; } })();
      const r = await fetch(`/api/users/${source.id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Xato");
      setUsers(prev => prev.filter(x => x.id !== source.id));
      setMergeSource(null);
      toast.success(`Birlashtirildi: ${d.movedPayments} to‘lov ko‘chirildi`);
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
      if (!r.ok) {
        // To'lov tarixi bor hisobni butunlay o'chirib bo'lmaydi — arxivlashni taklif qilamiz.
        if (d.code === "HAS_FINANCIAL_HISTORY") {
          if (confirm(`${d.error}\n\nHozir arxivlaysizmi?`)) {
            setSavingId("");
            await setArchived(u, true);
            return;
          }
        }
        throw new Error(d.error || "Xato");
      }
      setUsers(prev => prev.filter(x => x.id !== u.id));
      toast.success("Hisob o‘chirildi");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSavingId(""); }
  }

  const filtered = (q.trim()
    ? users.filter(u => (u.name + u.email + (u.phone ?? "")).toLowerCase().includes(q.trim().toLowerCase()))
    : users
  ).filter(u => showArchived || !u.archivedAt);

  return (
    <div className="mx-auto max-w-[1200px] p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">O‘quvchilar</h1>
          <p className="text-sm text-slate-500">Bazadagi foydalanuvchilar — rol, progress, o‘chirish</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(v => !v)}
            title="Arxivlangan hisoblarni ko‘rsatish"
          >
            {showArchived ? "Arxivni yashirish" : "Arxivni ko‘rsatish"}
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Ism / email / telefon qidirish…" className="pl-9 w-[260px]" />
          </div>
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
                      {u.banned && <Badge className="bg-red-600 text-white border border-red-700 text-[10px]">Bloklangan</Badge>}
                      {u.archivedAt && <Badge className="bg-slate-200 text-slate-700 border border-slate-300 text-[10px]">Arxivlangan</Badge>}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{u.email}{u.phone ? ` · ${u.phone}` : ""}</div>
                    {(u.lastIp || u.regIp) && (
                      <div className="text-[11px] text-slate-400 truncate font-mono">
                        IP: {u.lastIp || "—"}{u.regIp && u.regIp !== u.lastIp ? ` · reg: ${u.regIp}` : ""}
                        {u.banned && u.bannedReason ? ` · sabab: ${u.bannedReason}` : ""}
                      </div>
                    )}
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
                    className={u.banned
                      ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      : "border-orange-200 text-orange-700 hover:bg-orange-50"}
                    disabled={savingId === u.id}
                    onClick={() => setBan(u)}
                    title={u.banned ? "Bloklashni olib tashlash" : "Hisobni bloklash"}
                  >
                    {u.banned ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className={u.archivedAt
                      ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"}
                    disabled={savingId === u.id}
                    onClick={() => setArchived(u, !u.archivedAt)}
                    title={u.archivedAt ? "Arxivdan qaytarish" : "Arxivlash (to‘lov tarixi saqlanadi)"}
                  >
                    <Archive className={`h-4 w-4 ${u.archivedAt ? "rotate-180" : ""}`} />
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    disabled={savingId === u.id || u.role !== "STUDENT"}
                    onClick={() => setMergeSource(u)}
                    title="Dublikatni boshqa hisob bilan birlashtirish"
                  >
                    <Merge className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    disabled={savingId === u.id}
                    onClick={() => remove(u)}
                    title="Butunlay o‘chirish (to‘lov tarixi bo‘lsa — arxivlash taklif qilinadi)"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {mergeSource && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <Card className="w-full max-w-lg space-y-4 p-5">
            <div>
              <h2 className="text-lg font-bold">Dublikatni birlashtirish</h2>
              <p className="mt-1 text-sm text-slate-500">
                Qaysi hisob <b>asosiy</b> bo‘lib qoladi? «{mergeSource.name}» hisobidagi barcha to‘lovlar
                va oylik hisoblar tanlangan hisobga ko‘chiriladi.
              </p>
            </div>
            <div className="max-h-[45vh] space-y-2 overflow-y-auto">
              {users.filter(x => x.id !== mergeSource.id && x.role === "STUDENT").map(x => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => mergeInto(mergeSource, x.id)}
                  disabled={savingId === mergeSource.id}
                  className="w-full rounded-xl border border-slate-200 p-3 text-left text-sm hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
                >
                  <div className="font-semibold text-slate-900">{x.name}</div>
                  <div className="text-xs text-slate-500">{x.email}</div>
                </button>
              ))}
              {users.filter(x => x.id !== mergeSource.id && x.role === "STUDENT").length === 0 && (
                <p className="text-sm text-slate-500">Boshqa o‘quvchi hisobi topilmadi.</p>
              )}
            </div>
            <Button variant="outline" onClick={() => setMergeSource(null)} disabled={savingId === mergeSource.id}>
              Bekor qilish
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
