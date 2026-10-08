"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidUZ } from "@/lib/phone";
import { toast } from "sonner";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password || !password2) { toast.error("Barcha maydonlarni to‘ldiring"); return; }
    if (password.length < 6) { toast.error("Parol kamida 6 ta belgi"); return; }
    if (password !== password2) { toast.error("Parollar mos kelmadi"); return; }
    if (phone && !isValidUZ(phone)) { toast.error("Telefon raqamini to‘g‘ri kiriting: +998 94 328 05 13"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password, phone }) });
      const d = await r.json().catch(()=>({}));
      if (!r.ok) { toast.error(d.error ?? "Ro‘yxatdan o‘tishda xato"); return; }
      localStorage.setItem("dk_role", d.role);
      localStorage.setItem("dk_token", d.token ?? "");
      localStorage.setItem("dk_user", JSON.stringify({ email: d.email ?? email, name: d.name ?? name, role: d.role, id: d.id, phone }));
      toast.success("Muvaffaqiyatli ro‘yxatdan o‘tdingiz!");
      const next = new URLSearchParams(window.location.search).get("next");
      if (next && next.startsWith("/") && !next.startsWith("//")) router.push(next);
      else router.push("/dashboard");
    } catch { toast.error("Server bilan bog‘lanib bo‘lmadi"); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4 py-6 sm:py-10 isolate relative overflow-hidden">
      <div className="orb -z-10 w-[420px] h-[420px] bg-blue-400/35 -top-32 -left-24" />
      <div className="orb -z-10 w-[360px] h-[360px] bg-indigo-300/30 -bottom-28 -right-20" />
      <Card className="w-full max-w-[480px] p-5 sm:p-6 lg:p-8">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="mt-4 text-xl font-bold text-center">Ro‘yxatdan o‘tish</h1>
        <p className="text-center text-sm text-slate-500">Bepul akkaunt yarating</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div><label className="text-xs font-medium">F.I.Sh.</label><Input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Bobur Karimov" className="mt-1 text-base sm:text-sm" /></div>
          <PhoneInput label="Telefon" value={phone} onValueChange={setPhone} placeholder="+998 94 328 05 13" />
          <div><label className="text-xs font-medium">Email</label><Input inputMode="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com" className="mt-1 text-base sm:text-sm" /></div>
          <div><label className="text-xs font-medium">Parol</label><Input type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="mt-1 text-base sm:text-sm" /></div>
          <div><label className="text-xs font-medium">Parolni tasdiqlang</label><Input type="password" autoComplete="new-password" value={password2} onChange={e=>setPassword2(e.target.value)} placeholder="••••••••" className="mt-1 text-base sm:text-sm" /></div>
          <Button type="submit" className="w-full mt-2 h-11" disabled={loading}>{loading ? "Yuborilmoqda…" : "Ro‘yxatdan o‘tish"}</Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">Akkauntingiz bormi? <Link href="/login" className="text-[#2563eb] font-medium">Kirish</Link></p>
      </Card>
    </div>
  );
}
