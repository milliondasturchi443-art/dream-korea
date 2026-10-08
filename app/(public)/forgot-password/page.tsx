"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Phone, KeyRound, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SITE_PHONE_DISPLAY, SITE_PHONE_E164 } from "@/lib/site";
import { telHref } from "@/lib/phone";

// Parolni tiklash — email xizmati yo'q, halol yo'l: administrator bilan bog'lanish
export default function ForgotPage() {
  return (
    <div className="min-h-[60vh] grid place-items-center px-4 py-10 isolate relative overflow-hidden">
      <div className="orb -z-10 w-[420px] h-[420px] bg-blue-400/35 -top-32 -left-24" />
      <div className="orb -z-10 w-[360px] h-[360px] bg-indigo-300/30 -bottom-28 -right-20" />
      <Card className="w-full max-w-[440px] p-6">
        <div className="flex justify-center"><Logo /></div>
        <div className="mx-auto mt-4 h-12 w-12 rounded-full bg-amber-100 grid place-items-center text-amber-600"><KeyRound className="h-6 w-6" /></div>
        <h1 className="mt-3 text-xl font-bold text-center">Parolni tiklash</h1>
        <p className="mt-2 text-center text-sm text-slate-600 leading-relaxed">
          Platformada avtomatik parol tiklash (email xizmati) hozircha yo‘q.
          Parolingizni tiklash uchun administrator bilan bog‘laning — ismingiz va emailingizni ayting.
        </p>
        <a href={telHref(SITE_PHONE_E164)} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
          <Phone className="h-4 w-4" /> {SITE_PHONE_DISPLAY}
        </a>
        <div className="mt-4 flex justify-between text-xs">
          <Link href="/login" className="text-[#2563eb] hover:underline flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Ortga — kirish</Link>
          <Link href="/register" className="text-slate-500 hover:text-slate-700">Yangi akkaunt yaratish</Link>
        </div>
      </Card>
    </div>
  );
}
