"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { doLogout } from "@/lib/logout";
import Image from "next/image";
import {
  LayoutDashboard, BookOpen, FileText, Library, SpellCheck, BookMarked, Video, Film, Building2, User, Bell, Search, LogOut, Bot, GraduationCap
} from "lucide-react";

export const studentNav = [
  { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/courses", label: "Kurslar", icon: BookOpen },
  { href: "/ai", label: "Axrorbek AI", icon: Bot },
  { href: "/topik", label: "TOPIK testlar", icon: FileText },
  { href: "/vocabulary", label: "Lug‘at", icon: Library },
  { href: "/grammar", label: "Grammatika", icon: SpellCheck },
  { href: "/books", label: "Kitoblar", icon: BookMarked },
  { href: "/videos", label: "Videodarslar", icon: Video },
  { href: "/media", label: "Kinolar & seriallar", icon: Film },
  { href: "/admission", label: "Qabul", icon: Building2 },
  { href: "/universities", label: "Universitetlar", icon: Building2 },
  { href: "/profile", label: "Profil", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [initials, setInitials] = useState("DK");
  const [role, setRole] = useState("");
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("dk_user") || "{}");
      if (u.name) {
        setUserName(u.name);
        setInitials(u.name.split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase());
      }
      if (u.role) setRole(String(u.role));
    } catch {}
    // Подтягиваем актуальную роль из БД (исправляет смену роли без перелогина)
    fetch("/api/auth/me").then(r=>r.ok?r.json():null).then(d=>{
      if(d?.email && d?.name){
        try{
          setRole(String(d.role || ""));
          const cur = JSON.parse(localStorage.getItem("dk_user")||"{}");
          if(cur.role !== d.role || cur.name !== d.name){
            localStorage.setItem("dk_user", JSON.stringify({ email:d.email, name:d.name, role:d.role, id:d.id }));
            if(d.token){ try{localStorage.setItem("dk_token", d.token);}catch{}
              try{sessionStorage.setItem("dk_token", d.token);}catch{} }
            setUserName(d.name);
            setInitials(d.name.split(/\s+/).map((w:string)=>w[0]).slice(0,2).join("").toUpperCase());
          }
        }catch{}
      }
    }).catch(()=>{});
  }, [pathname]);

  // Cookie sessiyasini tiklash: localStorage tozalangan bo'lsa ham (30 kunlik cookie)
  useEffect(() => {
    (async () => {
      try {
        if (localStorage.getItem("dk_token")) return;
        const r = await fetch("/api/auth/me");
        if (!r.ok) return;
        const d = await r.json().catch(() => ({}));
        if (d.role === "ADMIN" || !d.token) return;
        setRole(d.role);
        localStorage.setItem("dk_token", d.token);
        localStorage.setItem("dk_role", d.role);
        localStorage.setItem("dk_user", JSON.stringify({ email: d.email, name: d.name, role: d.role, id: d.id }));
        if (d.name) {
          setUserName(d.name);
          setInitials(d.name.split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase());
        }
      } catch {}
    })();
  }, []);
  function onLogout() { doLogout(); router.push("/login"); }
  return (
    <div className="min-h-screen">
      {/* top navy bar - desktop */}
      <div className="hidden lg:flex h-[56px] glass-dark text-white items-center px-6 justify-between sticky top-0 z-30">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="DK" width={28} height={28} className="rounded-lg bg-white p-0.5" />
            <span className="font-bold tracking-tight">DREAM KOREA</span>
          </Link>
          <div className="relative hidden xl:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input placeholder="Qidirish..." className="h-9 w-[260px] rounded-full bg-white/15 border border-white/25 pl-9 pr-4 text-sm placeholder:text-slate-300 focus:outline-none focus:bg-white focus:text-slate-900" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="p-2 rounded-full hover:bg-white/10">
            <Bell className="h-5 w-5" />
          </Link>
          <Link href="/profile" className="flex items-center gap-2 pl-2">
            <div className="h-8 w-8 rounded-full bg-[#2563eb] grid place-items-center font-bold text-sm">{initials}</div>
            <span className="text-sm font-medium hidden xl:block">{userName || "Profil"}</span>
          </Link>
          <button onClick={onLogout} aria-label="Chiqish" className="p-2 rounded-full hover:bg-white/10"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>

      {/* mobile top */}
      <div className="lg:hidden h-[56px] glass-dark text-white flex items-center justify-between px-4 sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold">
          <Image src="/logo.png" alt="DK" width={28} height={28} className="rounded-lg bg-white p-0.5" />
          DREAM KOREA
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="p-2"><Bell className="h-5 w-5" /></Link>
          <Link href="/profile" className="h-8 w-8 rounded-full bg-[#2563eb] grid place-items-center font-bold text-sm">{initials}</Link>
        </div>
      </div>

      <div className="flex">
        <aside className="hidden lg:block w-[240px] shrink-0 sticky top-[56px] h-[calc(100vh-56px)] overflow-auto glass border-r border-r-white/70 p-3 flex flex-col">
          <nav className="space-y-1 flex-1">
            {[
              ...studentNav,
              // Ustoz kabineti — faqat TEACHER (talabalarga ko'rinmaydi)
              ...(role === "TEACHER" ? [{ href: "/teacher", label: "Ustoz kabineti", icon: GraduationCap }] : []),
            ].map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.label + item.href} href={item.href} className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-white/90 text-[#2563eb] shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_8px_20px_-12px_rgba(15,27,61,.4)]" : "text-slate-600 hover:bg-white/60 hover:text-slate-900")}>
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button onClick={onLogout} className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 w-full">
            <LogOut className="h-[18px] w-[18px] shrink-0" /> Chiqish
          </button>
        </aside>
        <main className="flex-1 min-w-0 pb-[72px] lg:pb-0">{children}</main>
      </div>

      {/* FAB звонка — 94 328 05 13 */}
      <a href="tel:+998943280513" aria-label="Qo'ng'iroq 94 328 05 13" className="lg:hidden fixed bottom-[76px] right-3 z-30 h-12 w-12 rounded-full bg-emerald-600 border border-white/40 text-white shadow-lg shadow-emerald-500/40 grid place-items-center active:scale-95 transition">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5.07 9.81 19.79 19.79 0 0 1 2 1.18 2 2 0 0 1 4 0h3a2 2 0 0 1 2 1.72c.12 1.33.43 2.63.92 3.88a2 2 0 0 1-.57 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.57c1.25.49 2.55.8 3.88.92A2 2 0 0 1 22 16.92z" /></svg>
      </a>

      {/* mobile bottom nav — safe-area + 44px min tap */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 glass border-t border-t-white/70 flex items-center justify-around py-1 z-30 safe-bottom">
        {[
          { href: "/dashboard", icon: LayoutDashboard, label: "Asosiy" },
          { href: "/courses", icon: BookOpen, label: "Darslar" },
          { href: "/ai", icon: Bot, label: "AI" },
          { href: "/topik", icon: FileText, label: "TOPIK" },
          { href: "/vocabulary", icon: Library, label: "Lug‘at" },
          { href: "/profile", icon: User, label: "Profil" },
        ].map(i => {
          const active = pathname === i.href;
          return (
            <Link key={i.label} href={i.href} className={cn("flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl text-[11px] font-medium min-h-[44px] min-w-[44px] active:scale-90 transition-transform", active ? "text-[#2563eb] bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_8px_20px_-12px_rgba(15,27,61,.35)] nav-pop" : "text-slate-500")}>
              <i.icon className="h-5 w-5" /> {i.label}
            </Link>
          );
        })}
        <button onClick={onLogout} className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl text-[11px] font-medium min-h-[44px] min-w-[44px] text-slate-500 active:scale-90 transition-transform">
          <LogOut className="h-5 w-5" /> Chiqish
        </button>
      </nav>
    </div>
  );
}
