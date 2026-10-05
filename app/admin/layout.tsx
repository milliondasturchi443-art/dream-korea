import Link from "next/link";
import { LayoutDashboard, Users, GraduationCap, BarChart3, Settings, Building2, Bell, Search, Sparkles, ShieldAlert, BookOpenCheck } from "lucide-react";

const nav = [
  ["Dashboard","/admin", LayoutDashboard],
  ["Qabul","/admin", Users],
  ["O‘quvchilar","/admin", Users],
  ["Ustozlar","/admin", GraduationCap],
  ["Guruhlar","/admin", Users],
  ["Vazifalar","/admin", BarChart3],
  ["Kontent","/admin/content", BookOpenCheck],
  ["Bloklangan ilovalar","/admin/blocked-apps", ShieldAlert],
  ["Universitetlar","/universities", Building2],
  ["AI yordamchi","/ai", Sparkles],
  ["Broadcast","/admin", Bell],
  ["Statistika","/admin", BarChart3],
  ["Sozlamalar","/admin", Settings],
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <div className="h-[56px] bg-[#0f1b3d] text-white flex items-center px-4 lg:px-6 justify-between sticky top-0 z-30 gap-4">
        <Link href="/admin" className="font-bold tracking-tight">DREAM KOREA — Admin</Link>
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input placeholder="Qidirish..." className="h-9 w-full rounded-full bg-white/10 border border-white/10 pl-9 pr-4 text-sm placeholder:text-slate-300 focus:outline-none focus:bg-white focus:text-slate-900" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="p-2 rounded-full hover:bg-white/10"><Bell className="h-5 w-5" /></Link>
          <div className="h-8 w-8 rounded-full bg-[#2563eb] grid place-items-center font-bold text-sm">AD</div>
        </div>
      </div>
      <div className="flex">
        <aside className="hidden lg:block w-[240px] shrink-0 sticky top-[56px] h-[calc(100vh-56px)] overflow-auto bg-white border-r border-slate-200 p-3">
          <nav className="space-y-1">
            {nav.map(([label, href, Icon]) => (
              <Link key={label} href={href} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
