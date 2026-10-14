"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Users, ClipboardCheck, CreditCard, BookOpen, LogOut, Loader2, GraduationCap, Menu, X } from "lucide-react";
import { doLogout } from "@/lib/logout";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/attendance", label: "Davomat", icon: ClipboardCheck },
  { href: "/teacher/payments", label: "To'lovlar", icon: CreditCard },
  { href: "/teacher/homework", label: "Uy vazifalari", icon: BookOpen },
  { href: "/teacher/groups", label: "Guruhlarim", icon: Users },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState<boolean | null>(null);
  const [denied, setDenied] = useState(false);
  const [name, setName] = useState("Ustoz");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let token = "";
    try { token = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; } catch {}
    fetch("/api/auth/me", token ? { headers: { Authorization: `Bearer ${token}` } } : {})
      .then(async r => {
        const d = await r.json().catch(()=>({}));
        if (!r.ok || !d.role) throw new Error();
        if (d.role !== "TEACHER" && d.role !== "ADMIN") {
          setDenied(true);
          return;
        }
        if (d.token) {
          if (d.role === "TEACHER") { try { localStorage.setItem("dk_token", d.token); } catch {} }
          try { sessionStorage.setItem("dk_token", d.token); } catch {}
          try { localStorage.setItem("dk_user", JSON.stringify({ email:d.email, name:d.name, role:d.role, id:d.id })); } catch {}
        }
        setName(d.name || "Ustoz");
        setOk(true);
      })
      .catch(()=> { router.replace(`/login?next=${encodeURIComponent(pathname)}`); });
  }, [pathname, router]);

  // close mobile menu on navigation
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (ok === null) {
    if (denied) {
      return (
        <div className="min-h-screen grid place-items-center p-6 text-center">
          <div className="max-w-sm space-y-3">
            <GraduationCap className="h-10 w-10 mx-auto text-slate-300" />
            <h1 className="text-lg font-bold text-slate-900">Ruxsat yo'q</h1>
            <p className="text-sm text-slate-500">Ustoz kabineti faqat ustozlar uchun.</p>
            <Link href="/dashboard" className="inline-block rounded-xl bg-[#0f1b3d] px-4 py-2 text-sm font-medium text-white">Bosh sahifaga qaytish</Link>
          </div>
        </div>
      );
    }
    return <div className="min-h-screen grid place-items-center text-slate-500"><div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin"/> Tekshirilmoqda…</div></div>;
  }
  if (!ok) return null;

  function onLogout(){ doLogout(); router.push("/login"); }

  return (
    <div className="min-h-screen">
      <div className="h-[56px] glass-dark text-white flex items-center px-4 lg:px-6 justify-between sticky top-0 z-30 gap-4 safe-top">
        <div className="flex items-center gap-2 min-w-0">
          {/* mobile hamburger */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Menyu"
            className="md:hidden p-2 -ml-2 rounded-xl hover:bg-white/10 min-h-[44px] min-w-[44px] grid place-items-center shrink-0"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/teacher" className="flex items-center gap-2 font-bold tracking-tight truncate">
            <GraduationCap className="h-6 w-6 shrink-0" /> <span className="hidden sm:inline">DREAM KOREA — Ustoz</span><span className="sm:hidden">Ustoz</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-sm text-white/80 hover:text-white hidden sm:block">Talaba ko'rinishi →</Link>
          <button onClick={onLogout} aria-label="Chiqish" className="p-2 rounded-full hover:bg-white/10 min-h-[40px] min-w-[40px] grid place-items-center"><LogOut className="h-5 w-5"/></button>
        </div>
      </div>
      <div className="flex">
        <aside className={cn(
          "md:block w-[240px] shrink-0 md:sticky md:top-[56px] md:h-[calc(100vh-56px)] overflow-auto glass border-r border-r-white/70 p-3 flex flex-col",
          menuOpen ? "fixed inset-y-0 left-0 z-40 h-full" : "hidden"
        )}>
          <div className="md:hidden flex items-center justify-between mb-3 pb-2 border-b border-white/50">
            <span className="font-bold text-sm">Menyu</span>
            <button onClick={() => setMenuOpen(false)} aria-label="Yopish" className="p-2 -mr-2"><X className="h-5 w-5" /></button>
          </div>
          <nav className="space-y-1 flex-1">
            {nav.map(i => {
              const active = pathname === i.href;
              return (
                <Link key={i.href + i.label} href={i.href} className={cn("flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]", active ? "bg-white/90 text-[#2563eb] shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_8px_20px_-12px_rgba(15,27,61,.4)]" : "text-slate-600 hover:bg-white/60")}>
                  <i.icon className="h-4 w-4 shrink-0"/> {i.label}
                </Link>
              );
            })}
          </nav>
          <button onClick={onLogout} className="mt-3 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 w-full min-h-[44px]"><LogOut className="h-4 w-4"/> Chiqish</button>
        </aside>
        {/* overlay for mobile drawer */}
        {menuOpen && <div className="md:hidden fixed inset-0 bg-black/30 z-30" onClick={() => setMenuOpen(false)} />}
        <main className="flex-1 min-w-0 dk-main">{children}</main>
      </div>
    </div>
  );
}
