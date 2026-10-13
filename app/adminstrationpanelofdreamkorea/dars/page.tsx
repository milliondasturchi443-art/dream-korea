"use client";
import { useEffect, useState } from "react";
import { darsRequest } from "@/lib/dars-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function AdminDarsPage() {
  const [units, setUnits] = useState<{ id: string; topic: string; level: string }[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("TOPIK I");
  const [order, setOrder] = useState(1);
  async function refresh() { const d = await darsRequest<{ units: typeof units }>("/api/dars"); setUnits(d.units); }
  useEffect(() => { darsRequest<{ units: typeof units }>("/api/dars").then(d => setUnits(d.units)).catch(e => setError(e.message)); }, []);
  async function submit(publish: boolean) {
    setBusy(true); setError("");
    try { await darsRequest(publish ? "/api/dars/publish" : "/api/dars", publish ? {} : { title, topic: title, level, order }); await refresh(); setTitle(""); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-3xl space-y-4 p-6"><h1 className="text-2xl font-bold">Darslar · Kontent</h1>{error && <p role="alert" className="text-red-600">{error}</p>}<Card className="space-y-3 p-5"><label>Unit nomi<Input value={title} onChange={e => setTitle(e.target.value)} /></label><label>Tartib<Input type="number" min={1} value={order} onChange={e => setOrder(Number(e.target.value))} /></label><label>Daraja<select value={level} onChange={e => setLevel(e.target.value)} className="ml-3 rounded-lg border p-2"><option>TOPIK I</option><option>TOPIK II</option></select></label><Button disabled={busy || !title.trim()} onClick={() => submit(false)}>Unit yaratish</Button></Card>{!units.length && <Button disabled={busy} onClick={() => submit(true)}>Birinchi original darsni nashr qilish</Button>}{units.map(u => <Card key={u.id} className="p-4">{u.topic} · {u.level}</Card>)}</div>;
}
