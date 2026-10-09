"use client";
import Link from "next/link";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Phone } from "lucide-react";
import { SITE_PHONE_E164, SITE_PHONE_DISPLAY } from "@/lib/site";
import { telHref } from "@/lib/phone";

const nav = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/courses", label: "Kurslar" },
  { href: "/topik", label: "TOPIK" },
  { href: "/videos", label: "Videodarslar" },
  { href: "/universities", label: "Universitetlar" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [me, setMe] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dk_user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.email) setMe({ name: u.name || "Foydalanuvchi", role: u.role || "STUDENT" });
      }
    } catch {}
    fetch("/api/auth/me")
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.email) {
          setMe({ name: d.name || "Foydalanuvchi", role: d.role || "STUDENT" });
          try {
            localStorage.setItem("dk_user", JSON.stringify({ email: d.email, name: d.name, role: d.role, id: d.id }));
            if (d.token) {
              try { localStorage.setItem("dk_token", d.token); } catch {}
              try { sessionStorage.setItem("dk_token", d.token); } catch {}
            }
          } catch {}
        } else {
          // кука истекла — рассинхрон, чистим
          try {
            const hasToken = localStorage.getItem("dk_token") || sessionStorage.getItem("dk_token");
            if (hasToken) setMe(null);
          } catch {}
        }
      })
      .catch(() => {});
  }, [pathname]);

  const cabHref = me?.role === "ADMIN" ? "/adminstrationpanelofdreamkorea" : "/dashboard";
  const initials = me?.name ? me.name.split(/\s+/).map((w: string) => w[0]).slice(0,2).join("").toUpperCase() : "";
  return (
    <header className="sticky top-0 z-40 glass border-b border-b-white/70">
      <div className="mx-auto max-w-[1200px] px-4 h-[64px] flex items-center justify-between gap-4">
        <Link href="/"><Logo /></Link>
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700">
          {nav.map(i => <Link key={i.label} href={i.href} className="hover:text-[#2563eb] transition-colors">{i.label}</Link>)}
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          <a href={telHref(SITE_PHONE_E164)} className="hidden xl:inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f1b3d] hover:text-[#2563eb] px-2">
            <Phone className="h-4 w-4" /> {SITE_PHONE_DISPLAY}
          </a>
          {me ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-white border border-slate-200 shadow-sm pl-1 pr-3 py-1">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1e40af] text-white grid place-items-center text-[11px] font-bold leading-none shrink-0">{initials}</div>
                <span className="text-sm font-medium text-slate-800 max-w-[140px] truncate">{me.name}</span>
              </div>
              <Link href={cabHref}><Button size="sm" className="shadow-sm">Kabinet</Button></Link>
            </div>
          ) : (
            <>
              <Link href="/login"><Button variant="ghost" size="sm">Kirish</Button></Link>
              <Link href="/register"><Button size="sm">Ro‘yxatdan o‘tish</Button></Link>
            </>
          )}
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
        <div className="lg:hidden border-t border-t-white/70 glass px-4 py-4 space-y-3">
          <a href={telHref(SITE_PHONE_E164)} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
            <Phone className="h-4 w-4" /> {SITE_PHONE_DISPLAY} — Qo‘ng‘iroq
          </a>
          {nav.map(i => <Link key={i.label} href={i.href} className="block py-2 text-sm font-medium" onClick={() => setOpen(false)}>{i.label}</Link>)}
          <div className="flex flex-col gap-2 pt-2">
            {me ? (
              <>
                <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1e40af] text-white grid place-items-center text-xs font-bold shrink-0">{initials}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900 truncate leading-none">{me.name}</div>
                    <div className="text-[11px] text-slate-500 leading-none mt-0.5">{me.role === "ADMIN" ? "Admin" : "Talaba"}</div>
                  </div>
                </div>
                <Link href={cabHref} onClick={() => setOpen(false)}><Button className="w-full">Kabinetga o‘tish</Button></Link>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="flex-1"><Button variant="outline" className="w-full">Kirish</Button></Link>
                <Link href="/register" className="flex-1"><Button className="w-full">Ro‘yxatdan o‘tish</Button></Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
