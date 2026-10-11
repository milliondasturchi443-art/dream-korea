"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { MailCheck, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const e = p.get("email");
    if (e) setEmail(e);
  }, []);

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    const em = email.trim();
    const cd = code.trim();
    if (!em || cd.length < 6) { toast.error("Email va 6 xonali kodni kiriting"); return; }
    setChecking(true);
    try {
      const r = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, code: cd }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Kodni tekshirib bo‘lmadi"); return; }
      try {
        localStorage.setItem("dk_role", d.role);
        localStorage.setItem("dk_token", d.token ?? "");
        localStorage.setItem("dk_user", JSON.stringify({ email: d.email, name: d.name, role: d.role, id: d.id }));
        sessionStorage.setItem("dk_token", d.token ?? "");
      } catch {}
      toast.success("Email tasdiqlandi — xush kelibsiz!");
      router.push("/dashboard?verified=1");
    } catch {
      toast.error("Server bilan bog‘lanib bo‘lmadi");
    } finally {
      setChecking(false);
    }
  }

  async function resend() {
    const em = email.trim();
    if (!em || sending) return;
    setSending(true);
    try {
      const r = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.ok === false) toast.error(d.error ?? "Yuborib bo‘lmadi");
      else toast.success("Yangi kod pochtangizga yuborildi!");
    } catch {
      toast.error("Server bilan bog‘lanib bo‘lmadi");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4 py-10 isolate relative overflow-hidden">
      <div className="orb -z-10 w-[420px] h-[420px] bg-blue-400/35 -top-32 -left-24" />
      <div className="orb -z-10 w-[360px] h-[360px] bg-pink-300/40 -bottom-28 -right-20" />
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
      <Card className="w-full max-w-[460px] p-5 sm:p-6 lg:p-8">
        <div className="flex justify-center"><Logo /></div>
        <div className="mt-5 flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-[#eff6ff] border border-blue-100 grid place-items-center">
            <MailCheck className="h-7 w-7 text-[#2563eb]" />
          </div>
        </div>
        <h1 className="mt-4 text-xl font-bold text-center text-slate-900">Pochtangizni tasdiqlang</h1>
        <p className="mt-2 text-sm text-slate-500 text-center leading-relaxed">
          {email ? <> <b className="text-slate-700">{email}</b> manziliga 6 xonali kod yubordik.</> : "Pochtaga 6 xonali tasdiqlash kodini yubordik."}
          {" "}Kod 10 daqiqa amal qiladi. Kelmasa spam papkani ham tekshiring.
        </p>
        <form onSubmit={verify} className="mt-6 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-700">Email</label>
            <Input inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Tasdiqlash kodi</label>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="mt-1 text-center text-2xl font-bold tracking-[10px] h-14"
            />
          </div>
          <Button type="submit" className="w-full h-11" disabled={checking || code.length < 6 || !email.trim()}>
            {checking ? "Tekshirilmoqda…" : <><ShieldCheck className="h-4 w-4 mr-1"/> Tasdiqlash</>}
          </Button>
        </form>
        <button onClick={resend} disabled={sending || !email.trim()} className="mt-4 w-full text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50">
          {sending ? "Yuborilmoqda…" : "Kodni qayta yuborish"}
        </button>
        <div className="mt-5 flex justify-between text-xs">
          <Link href="/login" className="text-[#2563eb] hover:underline">Kirish</Link>
          <Link href="/register" className="text-slate-500 hover:text-slate-700">Ro‘yxatdan o‘tish</Link>
        </div>
      </Card>
      </motion.div>
    </div>
  );
}
