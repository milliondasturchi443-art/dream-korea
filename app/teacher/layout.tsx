"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Users, ClipboardCheck, CreditCard, BookOpen, LogOut, Loader2, GraduationCap } from "lucide-react";
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
  const [name, setName] = useState("Ustoz");

  useEffect(() => {
    let token = "";
    try { token = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; } catch {}
    fetch("/api/auth/me", token ? { headers: { Authorization: `Bearer ${token}` } } : {})
      .then(async r => {
        const d = await r.json().catch(()=>({}));
        if (!r.ok || !d.role) throw new Error();
        // роль из БД — уже свежая (me берёт из prisma)
        if (d.role !== "TEACHER" && d.role !== "ADMIN") {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        if (d.token) {
          try { sessionStorage.setItem("dk_token", d.token); localStorage.setItem("dk_token", d.token); } catch {}
          try { localStorage.setItem("dk_user", JSON.stringify({ email:d.email, name:d.name, role:d.role, id:d.id })); } catch {}
        }
        setName(d.name || "Ustoz");
        setOk(true);
      })
      .catch(()=> { router.replace(`/login?next=${encodeURIComponent(pathname)}`); });
  }, [pathname, router]);

  if (ok === null) return <div className="min-h-screen grid place-items-center text-slate-500"><div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin"/> Tekshirilmoqda…</div></div>;
  if (!ok) return null;

  function onLogout(){ doLogout(); router.push("/login"); }

  return (
    <div className="min-h-screen">
      <div className="h-[56px] glass-dark text-white flex items-center px-4 lg:px-6 justify-between sticky top-0 z-30 gap-4">
        <Link href="/teacher" className="flex items-center gap-2 font-bold tracking-tight">
          <GraduationCap className="h-6 w-6" /> DREAM KOREA — Ustoz
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-sm text-white/80 hover:text-white hidden sm:block">Talaba ko'rinishi →</Link>
          <button onClick={onLogout} className="p-2 rounded-full hover:bg-white/10"><LogOut className="h-5 w-5"/></button>
        </div>
      </div>
      <div className="flex">
        <aside className="hidden lg:block w-[240px] shrink-0 sticky top-[56px] h-[calc(100vh-56px)] overflow-auto glass border-r border-r-white/70 p-3 flex flex-col">
          <nav className="space-y-1 flex-1">
            {nav.map(i => {
              const active = pathname === i.href;
              return (
                <Link key={i.href + i.label} href={i.href} className={cn("flex items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-medium transition-colors", active ? "bg-white/90 text-[#2563eb] shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_8px_20px_-12px_rgba(15,27,61,.4)]" : "text-slate-600 hover:bg-white/60")}>
                  <i.icon className="h-4 w-4 shrink-0"/> {i.label}
                </Link>
              );
            })}
          </nav>
          <button onClick={onLogout} className="mt-3 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 w-full"><LogOut className="h-4 w-4"/> Chiqish</button>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
