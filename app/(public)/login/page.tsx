"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { normalizeEmail } from "@/lib/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [regHref, setRegHref] = useState("/register");
  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("next");
    if (n && n.startsWith("/") && !n.startsWith("//")) setRegHref(`/register?next=${encodeURIComponent(n)}`);
    const n2 = new URLSearchParams(window.location.search).get("next");
    fetch("/api/auth/me").then(r => {
      if (r.ok) router.replace(n2 && n2.startsWith("/") && !n2.startsWith("//") ? n2 : "/dashboard");
    }).catch(() => {});
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const em = email.trim();
    const pw = password;
    if (!em || !pw) { toast.error("Email va parolni kiriting"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: em, password: pw }) });
      const d = await r.json().catch(()=>({}));
      if (!r.ok) {
        if (d.code === "EMAIL_NOT_VERIFIED") {
          toast.error(d.error ?? "Email tasdiqlanmagan");
          router.push(`/verify-email?email=${encodeURIComponent(em)}`);
          return;
        }
        toast.error(d.error ?? "Kirishda xato");
        return;
      }
      const norm = normalizeEmail(d.email ?? em);
      localStorage.setItem("dk_role", d.role);
      if (d.role === "ADMIN") {
        // Admin — sessionStorage: brauzer yopilsa qayta so'raladi ("har doim so'raymiz")
        try { sessionStorage.setItem("dk_token", d.token ?? ""); localStorage.removeItem("dk_token"); } catch {}
      } else {
        // O'quvchi/ustoz — localStorage + 30 kunlik cookie
        localStorage.setItem("dk_token", d.token ?? "");
      }
      localStorage.setItem("dk_user", JSON.stringify({ email: norm, name: d.name ?? "Foydalanuvchi", role: d.role, id: d.id }));
      toast.success(`Xush kelibsiz, ${d.name ?? ""}!`);
      const next = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
      // Ustoz uchun next=/teacher (yoki boshqa himoyalangan yo'l) — teacher layout o'zi tekshiradi, shuning uchun safe
      if (next && next.startsWith("/") && !next.startsWith("//")) router.push(next);
      else if (d.role === "ADMIN") router.push("/adminstrationpanelofdreamkorea");
      else if (d.role === "TEACHER") router.push("/teacher");
      else router.push("/dashboard");
    } catch {
      toast.error("Server bilan bog‘lanib bo‘lmadi");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4 py-10 isolate relative overflow-hidden">
      <div className="orb -z-10 w-[420px] h-[420px] bg-blue-400/35 -top-32 -left-24" />
      <div className="orb -z-10 w-[360px] h-[360px] bg-indigo-300/30 -bottom-28 -right-20" />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card className="w-full max-w-[440px] p-6 lg:p-8">
          <div className="flex justify-center"><Logo /></div>
          <h1 className="mt-4 text-xl font-bold text-center text-slate-900">Kirish</h1>
          <p className="text-center text-sm text-slate-500">Akkauntingizga kiring</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700">Email</label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="mt-1" autoComplete="email" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Parol</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={loading}>{loading ? "Kirilmoqda…" : "Kirish"}</Button>
          </form>
          <div className="mt-4 flex justify-between text-xs">
            <Link href={regHref} className="text-[#2563eb] hover:underline">Ro‘yxatdan o‘tish</Link>
            <Link href="/forgot-password" className="text-slate-500 hover:text-slate-700">Parolni unutdingizmi?</Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
