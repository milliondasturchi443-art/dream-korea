"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { MailCheck, MailWarning } from "lucide-react";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const e = p.get("email");
    if (e) setEmail(e);
    if (p.get("error") === "invalid") setInvalid(true);
  }, []);

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
      else toast.success("Tasdiqlash havolasi qayta yuborildi!");
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
      <Card className="w-full max-w-[460px] p-5 sm:p-6 lg:p-8">
        <div className="flex justify-center"><Logo /></div>
        <div className="mt-5 flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-[#eff6ff] border border-blue-100 grid place-items-center">
            <MailCheck className="h-7 w-7 text-[#2563eb]" />
          </div>
        </div>
        <h1 className="mt-4 text-xl font-bold text-center text-slate-900">Pochtangizni tasdiqlang</h1>
        <p className="mt-2 text-sm text-slate-500 text-center leading-relaxed">
          {email ? <> <b className="text-slate-700">{email}</b> manziliga tasdiqlash havolasini yubordik.</> : "Tasdiqlash havolasini pochtangizga yubordik."}
          {" "}Havola 24 soat amal qiladi. Xat kelmasa spam papkani ham tekshiring.
        </p>
        {invalid && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-sm text-amber-700">
            <MailWarning className="h-4 w-4 mt-0.5 shrink-0" />
            Havola yaroqsiz yoki muddati o‘tgan. Quyidan qayta yuboring.
          </div>
        )}
        <form onSubmit={e => { e.preventDefault(); resend(); }} className="mt-6 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-700">Email</label>
            <Input inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="mt-1" />
          </div>
          <Button type="submit" className="w-full h-11" disabled={sending || !email.trim()}>
            {sending ? "Yuborilmoqda…" : "Havolani qayta yuborish"}
          </Button>
        </form>
        <div className="mt-5 flex justify-between text-xs">
          <Link href="/login" className="text-[#2563eb] hover:underline">Kirish</Link>
          <Link href="/register" className="text-slate-500 hover:text-slate-700">Ro‘yxatdan o‘tish</Link>
        </div>
      </Card>
    </div>
  );
}
