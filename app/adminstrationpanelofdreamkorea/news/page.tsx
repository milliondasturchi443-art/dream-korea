"use client";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { darsRequest } from "@/lib/dars-client";
import { Newspaper, Loader2, Trash2, ImagePlus, X, Pin, PinOff } from "lucide-react";

type NewsItem = { id: string; title: string; body: string; image?: string | null; pinned: boolean; createdAt: string };

async function authHeaders(): Promise<Record<string, string>> {
  const token = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

// Rasmni clientda siqish: maks. 1280px, JPEG ~0.8 → data URL (DB da saqlanadi)
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 1280;
      let { width: w, height: h } = img;
      if (w > max || h > max) {
        const k = Math.min(max / w, max / h);
        w = Math.round(w * k); h = Math.round(h * k);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Rasmni o'qib bo'lmadi")); };
    img.src = url;
  });
}

export default function NewsAdminPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try { const d = await darsRequest<{ items: NewsItem[] }>("/api/news"); setItems(d.items); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function onFile(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Faqat rasm fayli"); return; }
    if (f.size > 15_000_000) { setError("Rasm juda katta (15MB gacha)"); return; }
    setError("");
    try { setImage(await compressImage(f)); } catch (e) { setError((e as Error).message); }
  }

  async function submit() {
    setBusy(true); setError(""); setNotice("");
    try {
      await darsRequest("/api/news", { title, body, image, pinned });
      setTitle(""); setBody(""); setImage(null); setPinned(false);
      if (fileRef.current) fileRef.current.value = "";
      setNotice("Yangilik qo'shildi");
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function togglePin(item: NewsItem) {
    try {
      await fetch("/api/news", { method: "PATCH", headers: await authHeaders(), body: JSON.stringify({ id: item.id, data: { pinned: !item.pinned } }) });
      await load();
    } catch { setNotice("Xatolik"); }
  }

  async function remove(id: string) {
    if (!confirm("O'chirilsinmi?")) return;
    try { await fetch(`/api/news?id=${id}`, { method: "DELETE", headers: await authHeaders() }); await load(); } catch {}
  }

  const valid = title.trim().length >= 2 && body.trim().length >= 1;

  return (
    <div className="mx-auto max-w-[1200px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-[22px] font-bold text-slate-900"><Newspaper className="h-6 w-6 text-[#2563eb]" /> Yangiliklar</h1>
        <p className="text-sm text-slate-500">Bosh sahifada ko'rinadigan yangilik va e'lonlar. Rasm ixtiyoriy — matn rasmning tagida bo'ladi.</p>
      </div>

      {notice && <Card className="p-4 text-sm border-emerald-200 bg-emerald-50 text-emerald-800" role="status">{notice}</Card>}

      <Card className="p-5 space-y-4">
        <label className="block space-y-1 text-sm font-medium text-slate-700">Sarlavha
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Masalan: TOPIK imtihoni 25-mayda" />
        </label>
        <label className="block space-y-1 text-sm font-medium text-slate-700">Matn (e'lon / tushuntirish)
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
            placeholder="Qisqacha yozing…"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-4 w-4 mr-1" /> {image ? "Rasmni almashtirish" : "Rasm yuklash"}
          </Button>
          {image && (
            <div className="relative">
              <img src={image} alt="preview" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
              <button onClick={() => setImage(null)} className="absolute -right-2 -top-2 rounded-full bg-white border border-slate-200 p-0.5" aria-label="Rasmni o'chirish"><X className="h-3 w-3" /></button>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="rounded border-slate-300" />
            <Pin className="h-3.5 w-3.5" /> E'lon (yuqorida katta ko'rsatish)
          </label>
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button onClick={submit} disabled={busy || !valid} className="w-full sm:w-auto">
          {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Newspaper className="h-4 w-4 mr-1" />} Joylashtirish
        </Button>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">Joylanganlar ({items.length})</h2>
        {loading && <div className="flex items-center gap-2 text-sm text-slate-500 p-4"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</div>}
        {!loading && !items.length && <Card className="p-8 text-center text-sm text-slate-500">Hozircha yangilik yo'q</Card>}
        {!loading && items.map(it => (
          <Card key={it.id} className="p-4">
            <div className="flex gap-3">
              {it.image && <img src={it.image} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover border border-slate-200" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  {it.title}
                  {it.pinned && <span className="rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-bold">E'LON</span>}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{it.body}</p>
                <div className="mt-1 text-[11px] text-slate-400">{new Date(it.createdAt).toLocaleDateString("uz-UZ")}</div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => togglePin(it)} title={it.pinned ? "E'lon qilishni bekor qilish" : "E'lon qilish"}
                  className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-amber-600">
                  {it.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </button>
                <button onClick={() => remove(it.id)} className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-red-600" aria-label="O'chirish"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
