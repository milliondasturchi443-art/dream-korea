"use client";
import Link from "next/link";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { SITE_PHONE_E164, SITE_PHONE_DISPLAY } from "@/lib/site";
import { telHref } from "@/lib/phone";

const nav = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/courses", label: "Kurslar" },
  { href: "/topik", label: "TOPIK" },
  { href: "/topik", label: "EPS-TOPIK" },
  { href: "/videos", label: "Videodarslar" },
  { href: "/universities", label: "Universitetlar" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-[1200px] px-4 h-[64px] flex items-center justify-between gap-4">
        <Link href="/"><Logo /></Link>
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700">
          {nav.map(i => <Link key={i.label} href={i.href} className="hover:text-[#2563eb] transition-colors">{i.label}</Link>)}
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          <a href={telHref(SITE_PHONE_E164)} className="hidden xl:inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f1b3d] hover:text-[#2563eb] px-2">
            <Phone className="h-4 w-4" /> {SITE_PHONE_DISPLAY}
          </a>
          <Link href="/login"><Button variant="ghost" size="sm">Kirish</Button></Link>
          <Link href="/register"><Button size="sm">Ro‘yxatdan o‘tish</Button></Link>
        </div>
        <div className="lg:hidden flex items-center gap-1">
          <a href={telHref(SITE_PHONE_E164)} aria-label="Qo'ng'iroq qilish" className="p-2 rounded-xl hover:bg-slate-100 text-[#0f1b3d]">
            <Phone className="h-5 w-5" />
          </a>
          <button className="p-2 rounded-xl hover:bg-slate-100" onClick={() => setOpen(!open)} aria-label="menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <a href={telHref(SITE_PHONE_E164)} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
            <Phone className="h-4 w-4" /> {SITE_PHONE_DISPLAY} — Qo‘ng‘iroq
          </a>
          {nav.map(i => <Link key={i.label} href={i.href} className="block py-2 text-sm font-medium" onClick={() => setOpen(false)}>{i.label}</Link>)}
          <div className="flex gap-2 pt-2">
            <Link href="/login" className="flex-1"><Button variant="outline" className="w-full">Kirish</Button></Link>
            <Link href="/register" className="flex-1"><Button className="w-full">Ro‘yxatdan o‘tish</Button></Link>
          </div>
        </div>
      )}
    </header>
  );
}
