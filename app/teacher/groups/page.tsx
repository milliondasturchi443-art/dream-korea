"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

type User = { id: string; name: string; email: string };
type Group = { id: string; name: string; members: { user: User }[]; teacher: { name: string } | null };

function authHeader(): Record<string, string> {
  try { const t = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; return t ? { Authorization: `Bearer ${t}` } : {}; } catch { return {}; }
}

export default function TeacherGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>(""); // groupId bo’sh = hech narsa
  const [emails, setEmails] = useState<Record<string, string>>({});

  function load() {
    fetch("/api/groups", { headers: authHeader() })
      .then(r => r.json())
      .then(d => setGroups(Array.isArray(d.groups) ? d.groups : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function addByEmail(groupId: string) {
    const email = (emails[groupId] || "").trim();
    if (!email) { toast.error("Email kiriting"); return; }
    setBusy(groupId);
    try {
      const r = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Qo’shib bo’lmadi");
      if (d.added === 0) throw new Error("Bunday email bilan o’quvchi topilmadi");
      toast.success("O’quvchi qo’shildi");
      setEmails(e => ({ ...e, [groupId]: "" }));
      load();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(""); }
  }

  async function removeMember(groupId: string, userId: string) {
    if (!confirm("O’quvchini guruhdan chiqarishni tasdiqlaysizmi?")) return;
    setBusy(groupId);
    try {
      const r = await fetch(`/api/groups/${groupId}/members?userId=${encodeURIComponent(userId)}`, { method: "DELETE", headers: authHeader() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "O’chirib bo’lmadi");
      toast.success("O’quvchi chiqarildi");
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: g.members.filter(m => m.user.id !== userId) } : g));
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(""); }
  }

  if (loading) return <div className="mx-auto max-w-[900px] p-4 lg:p-6 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</div>;

  return (
    <div className="mx-auto max-w-[900px] p-4 lg:p-6 space-y-4">
      <h1 className="text-[22px] font-bold text-slate-900">Guruhlarim</h1>
      <p className="text-sm text-slate-500">Sizga biriktirilgan guruhlar va o’quvchilar. O’quvchini email orqali qo’shing.</p>
      {groups.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">Guruh yo’q — admin tayinlaydi.</Card>
      ) : (
        <div className="grid gap-4">
          {groups.map(g => (
            <Card key={g.id} className="p-4">
              <div className="font-semibold">{g.name} <Badge className="ml-2 bg-slate-100 text-slate-700 border text-[11px]">{g.members.length} o’quvchi</Badge></div>

              {/* Qo’shish */}
              <div className="mt-3 flex gap-2">
                <Input
                  type="email"
                  inputMode="email"
                  placeholder="o’quvchi@email.com"
                  value={emails[g.id] || ""}
                  onChange={e => setEmails(p => ({ ...p, [g.id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void addByEmail(g.id); } }}
                  className="h-9"
                />
                <Button size="sm" className="h-9 shrink-0" onClick={() => void addByEmail(g.id)} disabled={busy === g.id}>
                  {busy === g.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />} Qo’shish
                </Button>
              </div>

              {g.members.length === 0 ? (
                <p className="text-xs text-slate-400 mt-3">Hali o’quvchi yo’q — email bilan qo’shing (o’quvchi avval saytda ro’yxatdan o’tgan bo’lishi kerak).</p>
              ) : (
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  {g.members.map(m => (
                    <div key={m.user.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{m.user.name}</div>
                        <div className="text-xs text-slate-500 truncate">{m.user.email}</div>
                      </div>
                      <button onClick={() => void removeMember(g.id, m.user.id)} disabled={busy === g.id} className="text-xs text-red-600 hover:underline shrink-0 flex items-center gap-1" aria-label="Chiqarish">
                        <X className="h-3.5 w-3.5" /> chiqarish
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
