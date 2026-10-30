"use client";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { doLogout } from "@/lib/logout";
import { AiFab } from "@/components/ai-fab";
import Image from "next/image";
import {
  LayoutDashboard, BookOpen, FileText, Library, SpellCheck, BookMarked, Video, Film, Building2, User, Bell, Search, LogOut, GraduationCap, CreditCard, ClipboardList, CalendarCheck
} from "lucide-react";

export const studentNav = [
  { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/courses", label: "Kurslar", icon: BookOpen },
  { href: "/dars", label: "Darslar", icon: GraduationCap },
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
  const [avatar, setAvatar] = useState("");
  const [role, setRole] = useState("");
  const [viewAsStudent, setViewAsStudent] = useState(false);
  useEffect(() => {
    try { setViewAsStudent(sessionStorage.getItem("dk_viewas_student") === "1"); } catch {}
    try {
      const u = JSON.parse(localStorage.getItem("dk_user") || "{}");
      if (u.name) {
        setUserName(u.name);
        setInitials(u.name.split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase());
      }
      if (u.role) setRole(String(u.role));
      if (u.avatar) setAvatar(u.avatar);
    } catch {}
    // Подтягиваем актуальную роль из БД (исправляет смену роли без перелогина).
    // Шлём Bearer-токен, чтобы работало даже если cookie устарел.
    let tk = "";
    try { tk = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; } catch {}
    fetch("/api/auth/me", tk ? { headers: { Authorization: `Bearer ${tk}` } } : undefined)
      .then(r=>r.ok?r.json():null).then(d=>{
      if(d?.email && d?.name){
        try{
          setRole(String(d.role || ""));
          const cur = JSON.parse(localStorage.getItem("dk_user")||"{}");
          if(cur.role !== d.role || cur.name !== d.name){
            localStorage.setItem("dk_user", JSON.stringify({ email:d.email, name:d.name, role:d.role, id:d.id, avatar:d.avatar || cur.avatar || "" }));
            if(d.token){ try{localStorage.setItem("dk_token", d.token);}catch{}
              try{sessionStorage.setItem("dk_token", d.token);}catch{} }
            setUserName(d.name);
            setInitials(d.name.split(/\s+/).map((w:string)=>w[0]).slice(0,2).join("").toUpperCase());
          }
          if (d.avatar) setAvatar(d.avatar);
          else if (cur?.avatar) setAvatar(cur.avatar);
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
        localStorage.setItem("dk_user", JSON.stringify({ email: d.email, name: d.name, role: d.role, id: d.id, avatar: d.avatar || "" }));
        if (d.name) {
          setUserName(d.name);
          setInitials(d.name.split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase());
        }
        if (d.avatar) setAvatar(d.avatar);
      } catch {}
    })();
  }, []);
  function onLogout() { doLogout(); router.push("/login"); }
  return (
    <div className="min-h-screen">
      {/* top navy bar - desktop */}
      <div className="hidden md:flex h-[56px] glass-dark text-white items-center px-6 justify-between sticky top-0 z-30">
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
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#2563eb] grid place-items-center font-bold text-sm">{initials}</div>
            )}
            <span className="text-sm font-medium hidden xl:block">{userName || "Profil"}</span>
          </Link>
          <button onClick={onLogout} aria-label="Chiqish" className="p-2 rounded-full hover:bg-white/10"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>

      {/* mobile top */}
      <div className="md:hidden glass-dark text-white flex items-center justify-between px-4 sticky top-0 z-30 safe-top" style={{ height: "var(--dk-nav-h)" }}>
        <Link href="/dashboard" className="flex items-center gap-2 font-bold">
          <Image src="/logo.png" alt="DK" width={28} height={28} className="rounded-lg bg-white p-0.5" />
          DREAM KOREA
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/notifications" className="p-2.5 min-h-[44px] min-w-[44px] grid place-items-center"><Bell className="h-5 w-5" /></Link>
          <Link href="/profile" className={avatar ? "h-9 w-9 rounded-full overflow-hidden shrink-0" : "h-9 w-9 rounded-full bg-[#2563eb] grid place-items-center font-bold text-sm shrink-0"}>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : initials}
          </Link>
        </div>
      </div>

      <div className="flex">
        <aside className="hidden md:block w-[240px] shrink-0 sticky top-[56px] h-[calc(100vh-56px)] overflow-auto glass border-r border-r-white/70 p-3 flex flex-col">
          <nav className="space-y-1 flex-1">
            {[
              ...studentNav,
              // To'lovlarim / Uy vazifalarim — faqat STUDENT
              // Davomat — faqat ADMIN (устник видит учеников)
              ...(role === "STUDENT" ? [
                { href: "/homework", label: "Uy vazifalarim", icon: ClipboardList },
                { href: "/payment", label: "To'lovlarim", icon: CreditCard },
              ] : []),
              // Ustoz kabineti — faqat TEACHER (talabalarga ko'rinmaydi); "Talaba ko'rinishi" rejimida yashiriladi
              ...(role === "TEACHER" && !viewAsStudent ? [{ href: "/teacher", label: "Ustoz kabineti", icon: GraduationCap }] : []),
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
        <main className="flex-1 min-w-0 dk-main">
          {viewAsStudent && (
            <div className="sticky top-[56px] z-20 flex flex-wrap items-center justify-between gap-2 bg-amber-100 border-b border-amber-300 px-4 py-2 text-sm text-amber-900">
              <span className="font-medium min-w-0">Talaba ko‘rinishi — siz talaba sifatida ko‘ryapsiz</span>
              <button onClick={() => { try { sessionStorage.removeItem("dk_viewas_student"); } catch {} setViewAsStudent(false); router.push("/adminstrationpanelofdreamkorea"); }} className="shrink-0 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors min-h-[36px]">Admin rejimga qaytish</button>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* mobile bottom nav — floating glass pill (mac'tak uslubi): faol band qora pillcha + neon chiziq */}
      <nav aria-label="Pastki navigatsiya" className="md:hidden fixed bottom-0 inset-x-0 z-30 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex w-full max-w-[520px] items-center justify-between rounded-[26px] border border-white/50 bg-white/30 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.9),inset_0_-1px_0_rgba(255,255,255,.4),0_18px_40px_-16px_rgba(15,27,61,.55)] backdrop-blur-md">
          {[
            { href: "/dashboard", icon: LayoutDashboard, label: "Asosiy" },
            { href: "/dars", icon: BookOpen, label: "Darslar" },
            { href: "/topik", icon: FileText, label: "TOPIK" },
            { href: "/vocabulary", icon: Library, label: "Lug'at" },
            // Ustoz kabineti — faqat TEACHER (Lug'at va Profil orasida)
            ...(role === "TEACHER" && !viewAsStudent ? [{ href: "/teacher", icon: GraduationCap, label: "Ustoz" }] : []),
            { href: "/profile", icon: User, label: "Profil" },
          ].map((i, idx) => {
            const active = pathname === i.href;
            return (
              <Fragment key={i.label}>
                {idx > 0 && <span aria-hidden="true" className="h-7 w-px shrink-0 bg-white/60" />}
                <Link
                  href={i.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 text-[10px] font-semibold whitespace-nowrap transition active:scale-95",
                    active
                      ? "bg-[#0b1220]/92 text-white shadow-[0_10px_22px_-10px_rgba(11,18,32,.95)] nav-pop"
                      : "text-white/95 [text-shadow:0_1px_3px_rgba(15,27,61,.55)] hover:bg-white/25"
                  )}
                >
                  <i.icon className="h-5 w-5" />
                  {i.label}
                  {active && <span aria-hidden="true" className="absolute -bottom-1 h-1 w-8 rounded-full bg-[#93c5fd] shadow-[0_0_10px_3px_rgba(147,197,253,.95)]" />}
                </Link>
              </Fragment>
            );
          })}
        </div>
      </nav>
      <AiFab />
    </div>
  );
}
