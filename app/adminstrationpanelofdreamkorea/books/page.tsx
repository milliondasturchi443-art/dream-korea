"use client";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BOOK_CATEGORIES, BOOK_COLORS, type BookCategory } from "@/lib/books-data";
import { BookMarked, Loader2, Trash2, FileUp, X, FileText, Globe } from "lucide-react";

type AdminBook = {
  id: string; title: string; subtitle: string; category: string; level: string;
  pages: number; sizeMb: number; color: string; code: string; description: string;
  file: string; source: "static" | "db"; createdAt?: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  const token = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || "";
  return { Authorization: `Bearer ${token}` };
}

// Katta PDF uchun XHR — yuklanish foizini ko'rsatish uchun
function uploadBook(fd: FormData, onProgress: (pct: number) => void): Promise<{ ok: boolean; book?: AdminBook; error?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/books");
    xhr.setRequestHeader("Authorization", `Bearer ${sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""}`);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      try {
        const d = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(d);
        else reject(new Error(d.error || "Xatolik"));
      } catch { reject(new Error("Xatolik")); }
    };
    xhr.onerror = () => reject(new Error("Server bilan bog'lanib bo'lmadi"));
    xhr.send(fd);
  });
}

export default function BooksAdminPage() {
  const [items, setItems] = useState<AdminBook[]>([]);
  const [loading, setLoading] = useState(true);  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState<BookCategory>("Darslik");
  const [level, setLevel] = useState("Boshlang'ich");
  const [code, setCode] = useState("");
  const [pages, setPages] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(BOOK_COLORS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const r = await fetch("/api/books");
      const d = await r.json();
      setItems(Array.isArray(d.items) ? d.items : []);
    } catch { setError("Ro'yxatni yuklab bo'lmadi"); }
    finally { setLoading(false); }
  }
  // Dastlabki yuklash — setState faqat async callbackda (effect qoidasi)
  useEffect(() => {
    fetch("/api/books")
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d.items) ? d.items : []))
      .catch(() => setError("Ro'yxatni yuklab bo'lmadi"))
      .finally(() => setLoading(false));
  }, []);

  function onFile(f: File | undefined | null) {
    setError("");
    if (!f) { setFile(null); return; }
    if (!f.type.startsWith("application/pdf") && !/\.pdf$/i.test(f.name)) { setError("Faqat PDF fayl"); return; }
    if (f.size > 90_000_000) { setError("Fayl juda katta (90 MB gacha)"); return; }
    setFile(f);
  }

  async function submit() {
    setBusy(true); setError(""); setNotice(""); setProgress(null);
    try {
      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("subtitle", subtitle.trim());
      fd.set("category", category);
      fd.set("level", level.trim());
      fd.set("pages", pages.trim() || "0");
      fd.set("code", code.trim());
      fd.set("description", description.trim());
      fd.set("color", color);
      fd.set("fileUrl", fileUrl.trim());
      if (file) fd.set("file", file);

      await uploadBook(fd, setProgress);
      setTitle(""); setSubtitle(""); setCode(""); setPages(""); setDescription("");
      setFile(null); setFileUrl("");
      if (fileRef.current) fileRef.current.value = "";
      setNotice("Kitob qo'shildi");
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); setProgress(null); }
  }

  async function remove(id: string) {
    if (!confirm("Kitob (va uning PDF'i) o'chirilsinmi?")) return;
    try {
      const r = await fetch(`/api/books/${id}`, { method: "DELETE", headers: await authHeaders() });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error || "O'chirib bo'lmadi"); return; }
      await load();
    } catch { setError("O'chirib bo'lmadi"); }
  }

  const valid = title.trim().length >= 2 && (!!file || fileUrl.trim().length > 0);

  return (
    <div className="mx-auto max-w-[1200px] p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-[22px] font-bold text-slate-900"><BookMarked className="h-6 w-6 text-[#2563eb]" /> Kitoblar</h1>
        <p className="text-sm text-slate-500">«Kitoblar» bo&apos;limiga PDF qo&apos;shing. Fayl bazada (MongoDB) saqlanadi — qayta deploy ham yo&apos;qolmaydi.</p>
      </div>

      {notice && <Card className="p-4 text-sm border-emerald-200 bg-emerald-50 text-emerald-800" role="status">{notice}</Card>}

      <Card className="p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm font-medium text-slate-700 sm:col-span-2">Sarlavha *
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Masalan: Seoul Korean 2A" />
          </label>
          <label className="block space-y-1 text-sm font-medium text-slate-700">Qisqa izoh (subtitle)
            <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Masalan: darslik · 1-daraja" />
          </label>
          <label className="block space-y-1 text-sm font-medium text-slate-700">Kategoriya *
            <select value={category} onChange={e => setCategory(e.target.value as BookCategory)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none">
              {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block space-y-1 text-sm font-medium text-slate-700">Daraja
            <Input value={level} onChange={e => setLevel(e.target.value)} placeholder="Boshlang'ich" />
          </label>
          <label className="block space-y-1 text-sm font-medium text-slate-700">Qisqa kod (kartochka burchagi)
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="TOPIK" maxLength={10} />
          </label>
          <label className="block space-y-1 text-sm font-medium text-slate-700">Sahifalar
            <Input type="number" min={0} value={pages} onChange={e => setPages(e.target.value)} placeholder="0" />
          </label>
          <label className="block space-y-1 text-sm font-medium text-slate-700">Tavsif
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="Kitob haqida qisqacha…"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-base sm:text-sm focus:border-blue-500 focus:outline-none" />
          </label>
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Rang</span>
          <div className="flex flex-wrap gap-2">
            {BOOK_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)} aria-label="Rang tanlash"
                className={`h-8 w-8 rounded-lg bg-gradient-to-br ${c} ${color === c ? "ring-2 ring-offset-2 ring-blue-600" : ""}`} />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-700">PDF fayl *</span>
          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden"
              onChange={e => onFile(e.target.files?.[0])} />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <FileUp className="h-4 w-4 mr-1" /> {file ? "Faylni almashtirish" : "PDF yuklash"}
            </Button>
            {file && (
              <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700 max-w-full">
                <FileText className="h-3.5 w-3.5 shrink-0 text-red-500" />
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                <button onClick={() => onFile(null)} className="shrink-0 text-slate-400 hover:text-red-600" aria-label="Faylni olib tashlash"><X className="h-3.5 w-3.5" /></button>
              </span>
            )}
          </div>
          {progress !== null && (
            <div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">Yuklanmoqda… {progress}%</p>
            </div>
          )}
          <label className="block space-y-1 text-sm font-medium text-slate-700 pt-1">
            <span className="flex items-center gap-1 text-slate-500 font-normal"><Globe className="h-3.5 w-3.5" /> Yoki tayyor manzil (ixtiyoriy)</span>
            <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="/books/nom.pdf yoki https://…" />
          </label>
          <p className="text-xs text-slate-400">PDF bo&apos;lmasa manzil kiritishingiz mumkin. Ikkalasi bo&apos;lsa, yuklangan fayl ishlatiladi.</p>
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button onClick={submit} disabled={busy || !valid} className="w-full sm:w-auto">
          {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <BookMarked className="h-4 w-4 mr-1" />} Joylashtirish
        </Button>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">Barcha kitoblar ({items.length})</h2>
        {loading && <div className="flex items-center gap-2 text-sm text-slate-500 p-4"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</div>}
        {!loading && !items.length && <Card className="p-8 text-center text-sm text-slate-500">Kitob yo&apos;q</Card>}
        {!loading && items.map(it => (
          <Card key={it.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br ${it.color} grid place-items-center text-white`}>
                <BookMarked className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                  <span className="truncate">{it.title}</span>
                  <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-bold">{it.category}</span>
                  {it.source === "db"
                    ? <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold">QO&apos;SHILGAN</span>
                    : <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">TAYYOR</span>}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 truncate">
                  {it.level}{it.pages ? ` · ${it.pages} sahifa` : ""}{it.sizeMb ? ` · ${it.sizeMb} MB` : ""}{!it.file ? " · fayl yo'q" : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {it.file && (
                  <a href={it.file} target="_blank" rel="noreferrer" title="Ochish"
                    className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-blue-600"><FileText className="h-4 w-4" /></a>
                )}
                {it.source === "db" && (
                  <button onClick={() => remove(it.id)} title="O'chirish"
                    className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-red-600" aria-label="O'chirish"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
