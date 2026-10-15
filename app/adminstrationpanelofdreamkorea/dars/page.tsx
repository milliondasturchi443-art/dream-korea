"use client";
import { useEffect, useState } from "react";
import { darsRequest } from "@/lib/dars-client";
import { youtubeId } from "@/lib/youtube";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Video, Trash2, Clapperboard } from "lucide-react";

type AdminUnit = { id: string; topic: string; level: string; order: number; videos: { id: string; videoUrl: string; title: string }[] };

async function patchUnit(id: string, body: Record<string, unknown>) {
  const token = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || "";
  const r = await fetch(`/api/dars/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Saqlab bo‘lmadi");
  return d;
}

export default function AdminDarsPage() {
  const [units, setUnits] = useState<AdminUnit[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("TOPIK I");
  const [order, setOrder] = useState(1);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  async function refresh() {
    const d = await darsRequest<{ units: AdminUnit[] }>("/api/dars");
    setUnits(d.units);
  }
  // Dastlabki yuklash — setState faqat async callbackda (effect qoidasi)
  useEffect(() => {
    darsRequest<{ units: AdminUnit[] }>("/api/dars")
      .then(d => setUnits(d.units))
      .catch(e => setError(e.message));
  }, []);

  async function submit(publish: boolean) {
    setBusy(true); setError(""); setNotice("");
    try { await darsRequest(publish ? "/api/dars/publish" : "/api/dars", publish ? {} : { title, topic: title, level, order }); await refresh(); setTitle(""); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function saveVideo(id: string, forceUrl?: string) {
    const value = (forceUrl !== undefined ? forceUrl : drafts[id] ?? "").trim();
    setSavingId(id); setError(""); setNotice("");
    try {
      if (value && !youtubeId(value) && !/^https?:\/\//i.test(value)) throw new Error("YouTube havolasi yoki https:// manzil kiriting");
      await patchUnit(id, { videoUrl: value });
      setDrafts(d => { const n = { ...d }; delete n[id]; return n; });
      setNotice(value ? "Video saqlandi" : "Video o‘chirildi");
      await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setSavingId(null); }
  }

  return <div className="mx-auto max-w-3xl space-y-4 p-6">
    <h1 className="text-2xl font-bold">Darslar · Kontent</h1>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {notice && <p role="status" className="text-emerald-600">{notice}</p>}

    <Card className="space-y-3 p-5">
      <label>Unit nomi<Input value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label>Tartib<Input type="number" min={1} value={order} onChange={e => setOrder(Number(e.target.value))} /></label>
      <label>Daraja<select value={level} onChange={e => setLevel(e.target.value)} className="ml-3 rounded-lg border p-2"><option>TOPIK I</option><option>TOPIK II</option></select></label>
      <Button disabled={busy || !title.trim()} onClick={() => submit(false)}>Unit yaratish</Button>
    </Card>

    {!units.length && <Button disabled={busy} onClick={() => submit(true)}>Birinchi original darsni nashr qilish</Button>}

    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Video className="h-4 w-4" /> Unitlar va video ({units.length})</h2>
      {units.map(u => {
        const cur = u.videos[0]?.videoUrl || "";
        const saving = savingId === u.id;
        return <Card key={u.id} className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="font-semibold text-slate-900">{u.topic}</span>
              <span className="ml-2 text-sm text-slate-500">· {u.level} · Unit {u.order}</span>
            </div>
            {cur
              ? <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600"><Clapperboard className="h-3 w-3" /> VIDEO BOR</span>
              : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">VIDEO YO‘Q</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Input value={drafts[u.id] ?? cur} onChange={e => setDrafts(d => ({ ...d, [u.id]: e.target.value }))}
              placeholder="YouTube havolasi: https://youtu.be/…" className="h-9 min-w-[220px] flex-1" disabled={saving} />
            <Button size="sm" disabled={saving} onClick={() => saveVideo(u.id)}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Saqlash
            </Button>
            {cur && (
              <Button size="sm" variant="outline" disabled={saving} onClick={() => saveVideo(u.id, "")}>
                <Trash2 className="h-4 w-4" /> O‘chirish
              </Button>
            )}
          </div>
          {cur && <p className="truncate text-xs text-slate-400">Joriy video: {cur}</p>}
        </Card>;
      })}
    </section>
  </div>;
}
