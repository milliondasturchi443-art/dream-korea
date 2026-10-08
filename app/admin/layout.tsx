"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doLogout } from "@/lib/logout";
import { LayoutDashboard, Users, GraduationCap, Building2, Bell, Sparkles, ShieldAlert, BookOpenCheck, FileText, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  ["Dashboard", "/admin", LayoutDashboard],
  ["O‘quvchilar", "/admin/users", Users],
  ["Qabul arizalari", "/admin/admissions", FileText],
  ["Kontent (kurslar)", "/admin/content", BookOpenCheck],
  ["Bloklangan ilovalar", "/admin/blocked-apps", ShieldAlert],
  ["Universitetlar", "/universities", Building2],
  ["AI yordamchi", "/ai", Sparkles],
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [name, setName] = useState("Admin");

  // Admin himoyasi: /admin — faqat ADMIN token bilan
  useEffect(() => {
    let alive = true;
    (async () => {
      const token = localStorage.getItem("dk_token") || "";
      if (!token) { router.replace("/login?next=/admin"); return; }
      try {
        const r = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json().catch(() => ({}));
        if (!alive) return;
        if (!r.ok || d.role !== "ADMIN") {
          doLogout();
          router.replace("/login?next=/admin");
          return;
        }
        setName(d.name || "Admin");
        setChecked(true);
      } catch {
        if (alive) { router.replace("/login?next=/admin"); }
      }
    })();
    return () => { alive = false; };
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] grid place-items-center text-slate-500">
        <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Tekshirilmoqda…</div>
      </div>
    );
  }

  function onLogout() { doLogout(); router.push("/login"); }
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "AD";

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <div className="h-[56px] bg-[#0f1b3d] text-white flex items-center px-4 lg:px-6 justify-between sticky top-0 z-30 gap-4">
        <Link href="/admin" className="font-bold tracking-tight">DREAM KOREA — Admin</Link>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="p-2 rounded-full hover:bg-white/10"><Bell className="h-5 w-5" /></Link>
          <div className="h-8 w-8 rounded-full bg-[#2563eb] grid place-items-center font-bold text-sm">{initials}</div>
          <button onClick={onLogout} aria-label="Chiqish" className="p-2 rounded-full hover:bg-white/10"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex">
        <aside className="hidden lg:block w-[240px] shrink-0 sticky top-[56px] h-[calc(100vh-56px)] overflow-auto bg-white border-r border-slate-200 p-3 flex flex-col">
          <nav className="space-y-1 flex-1">
            {nav.map(([label, href, Icon]) => (
              <Link key={label} href={href} className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                pathname === href ? "bg-[#eff6ff] text-[#2563eb]" : "text-slate-600 hover:bg-slate-50")}>
                <Icon className="h-4 w-4 shrink-0" /> {label}
              </Link>
            ))}
          </nav>
          <button onClick={onLogout} className="mt-3 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 w-full"><LogOut className="h-4 w-4"/> Chiqish</button>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
