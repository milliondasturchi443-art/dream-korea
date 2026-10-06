"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { doLogout } from "@/lib/logout";
import Image from "next/image";
import {
  LayoutDashboard, BookOpen, GraduationCap, FileText, Library, SpellCheck, BookMarked, Video, Film, Shuffle, Building2, BarChart3, User, Bell, Search, LogOut
} from "lucide-react";

export const studentNav = [
  { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/courses", label: "Mening darslarim", icon: BookOpen },
  { href: "/courses", label: "Kurslar", icon: GraduationCap },
  { href: "/topik", label: "TOPIK testlar", icon: FileText },
  { href: "/vocabulary", label: "Lug‘at", icon: Library },
  { href: "/grammar", label: "Grammatika", icon: SpellCheck },
  { href: "/books", label: "Kitoblar", icon: BookMarked },
  { href: "/videos", label: "Videodarslar", icon: Video },
  { href: "/media", label: "Seriallar", icon: Film },
  { href: "/vocabulary", label: "Random so‘z", icon: Shuffle },
  { href: "/admission", label: "Qabul", icon: Building2 },
  { href: "/universities", label: "Universitetlar", icon: Building2 },
  { href: "/profile", label: "Natijalar", icon: BarChart3 },
  { href: "/profile", label: "Profil", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  function onLogout() { doLogout(); router.push("/login"); }
  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {/* top navy bar - desktop */}
      <div className="hidden lg:flex h-[56px] bg-[#0f1b3d] text-white items-center px-6 justify-between sticky top-0 z-30">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="DK" width={28} height={28} className="rounded-lg bg-white p-0.5" />
            <span className="font-bold tracking-tight">DREAM KOREA</span>
          </Link>
          <div className="relative hidden xl:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input placeholder="Qidirish..." className="h-9 w-[260px] rounded-full bg-white/10 border border-white/10 pl-9 pr-4 text-sm placeholder:text-slate-300 focus:outline-none focus:bg-white focus:text-slate-900" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="relative p-2 rounded-full hover:bg-white/10">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[11px] grid place-items-center font-bold">3</span>
          </Link>
          <Link href="/profile" className="flex items-center gap-2 pl-2">
            <div className="h-8 w-8 rounded-full bg-[#2563eb] grid place-items-center font-bold text-sm">BK</div>
            <span className="text-sm font-medium hidden xl:block">Bobur</span>
          </Link>
          <button onClick={onLogout} aria-label="Chiqish" className="p-2 rounded-full hover:bg-white/10"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>

      {/* mobile top */}
      <div className="lg:hidden h-[56px] bg-[#0f1b3d] text-white flex items-center justify-between px-4 sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold">
          <Image src="/logo.png" alt="DK" width={28} height={28} className="rounded-lg bg-white p-0.5" />
          DREAM KOREA
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="p-2"><Bell className="h-5 w-5" /></Link>
          <Link href="/profile" className="h-8 w-8 rounded-full bg-[#2563eb] grid place-items-center font-bold text-sm">BK</Link>
        </div>
      </div>

      <div className="flex">
        <aside className="hidden lg:block w-[240px] shrink-0 sticky top-[56px] h-[calc(100vh-56px)] overflow-auto bg-white border-r border-slate-200 p-3 flex flex-col">
          <nav className="space-y-1 flex-1">
            {studentNav.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.label + item.href} href={item.href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-[#eff6ff] text-[#2563eb]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
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
      <a href="tel:+998943280513" aria-label="Qo'ng'iroq 94 328 05 13" className="lg:hidden fixed bottom-[76px] right-3 z-30 h-12 w-12 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 grid place-items-center active:scale-95 transition">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5.07 9.81 19.79 19.79 0 0 1 2 1.18 2 2 0 0 1 4 0h3a2 2 0 0 1 2 1.72c.12 1.33.43 2.63.92 3.88a2 2 0 0 1-.57 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.57c1.25.49 2.55.8 3.88.92A2 2 0 0 1 22 16.92z" /></svg>
      </a>

      {/* mobile bottom nav — safe-area + 44px min tap */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex items-center justify-around py-1 z-30 safe-bottom">
        {[
          { href: "/dashboard", icon: LayoutDashboard, label: "Asosiy" },
          { href: "/courses", icon: BookOpen, label: "Darslar" },
          { href: "/topik", icon: FileText, label: "TOPIK" },
          { href: "/vocabulary", icon: Library, label: "Lug‘at" },
          { href: "/profile", icon: User, label: "Profil" },
        ].map(i => {
          const active = pathname === i.href;
          return (
            <Link key={i.label} href={i.href} className={cn("flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl text-[11px] font-medium min-h-[44px] min-w-[44px]", active ? "text-[#2563eb]" : "text-slate-500")}>
              <i.icon className="h-5 w-5" /> {i.label}
            </Link>
          );
        })}
        <button onClick={onLogout} className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl text-[11px] font-medium min-h-[44px] min-w-[44px] text-slate-500">
          <LogOut className="h-5 w-5" /> Chiqish
        </button>
      </nav>
    </div>
  );
}
