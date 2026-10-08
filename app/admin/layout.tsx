"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doLogout } from "@/lib/logout";
import { LayoutDashboard, Users, Building2, Bell, Sparkles, ShieldAlert, BookOpenCheck, FileText, LogOut, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";

const nav = [
  ["Dashboard", "/admin", LayoutDashboard],
  ["O‘quvchilar", "/admin/users", Users],
  ["Qabul arizalari", "/admin/admissions", FileText],
  ["Kontent (kurslar)", "/admin/content", BookOpenCheck],
  ["Bloklangan ilovalar", "/admin/blocked-apps", ShieldAlert],
  ["Universitetlar", "/universities", Building2],
  ["AI yordamchi", "/ai", Sparkles],
] as const;

// Telefonda /admin — faqat kalit so'raydigan alohida ekran
function AdminKeyGate({ onDone }: { onDone: () => void }) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim() || loading) return;
    setLoading(true);
    try {
      const r = await fetch("/api/auth/admin-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Kalit noto‘g‘ri"); return; }
      try {
        sessionStorage.setItem("dk_token", d.token ?? "");
        localStorage.setItem("dk_role", "ADMIN");
        localStorage.setItem("dk_user", JSON.stringify({ email: d.email, name: d.name, role: "ADMIN" }));
      } catch {}
      toast.success("Xush kelibsiz!");
      onDone();
    } catch {
      toast.error("Server bilan bog‘lanib bo‘lmadi");
    } finally { setLoading(false); }
  }

  return (
    <div className="admin-gate min-h-screen isolate relative overflow-hidden flex flex-col items-center justify-center px-6 text-[#0f1b3d]">
      <div className="orb -z-10 w-[340px] h-[340px] bg-blue-400/35 -top-24 -left-24" />
      <div className="orb -z-10 w-[300px] h-[300px] bg-pink-300/50 -bottom-20 -right-16" />
      <div className="glass rounded-[32px] p-6 w-full max-w-[380px] flex flex-col items-center">
        <Image src="/adminapklogo.png" alt="DREAM KOREA Admin" width={96} height={96} className="rounded-3xl bg-white p-1.5 shadow-2xl" priority />
        <h1 className="mt-5 text-xl font-bold tracking-tight">DREAM KOREA — Admin</h1>
        <p className="mt-1 text-sm text-slate-500">Kirish uchun kalitni kiriting</p>
        <form onSubmit={submit} className="mt-7 w-full space-y-3">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="Kalit"
              autoComplete="off"
              className="w-full h-12 rounded-2xl bg-white/75 border border-slate-300 pl-11 pr-12 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2563eb] focus:bg-white backdrop-blur-md"
            />
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <button type="button" onClick={() => setShow(s => !s)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button type="submit" disabled={loading || !key.trim()} className="w-full h-12 rounded-2xl bg-gradient-to-b from-[#3b82f6] to-[#2563eb] font-semibold text-sm shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_12px_26px_-10px_rgba(37,99,235,.8)] active:scale-[0.98] transition disabled:opacity-50">
            {loading ? "Tekshirilmoqda…" : "Kirish"}
          </button>
        </form>
        <p className="mt-5 text-xs text-slate-400 text-center">Bu qurilmada 30 kun eslab qolinadi.</p>
      </div>
      <Link href="/" className="mt-5 text-xs text-slate-500 hover:text-[#0f1b3d]">← Saytga qaytish</Link>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<"loading" | "authed" | "keygate">("loading");
  const [name, setName] = useState("Admin");

  // Admin himoyasi: /admin — faqat ADMIN (token yoki dk_admin cookie)
  const check = async (): Promise<void> => {
    let token = "";
    try { token = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; } catch {}
    try {
      const r = await fetch("/api/auth/me", token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.role === "ADMIN") {
        if (d.token) {
          try {
            // Desktop email-login — sessionStorage (brauzer yopilsa qayta so'raymiz)
            sessionStorage.setItem("dk_token", d.token);
            localStorage.removeItem("dk_token"); // eski loginlardan tozalaymiz
            localStorage.setItem("dk_role", "ADMIN");
            localStorage.setItem("dk_user", JSON.stringify({ email: d.email, name: d.name, role: "ADMIN", id: d.id }));
          } catch {}
        }
        setName(d.name || "Admin");
        setState("authed");
        return;
      }
      if (r.ok && d.role && d.role !== "ADMIN") {
        // Oddiy foydalanuvchi — sessiyasini buzmay login'ga yuboramiz
        router.replace("/login?next=/admin");
        return;
      }
      // 401 — telefonda faqat kalit, desktopda login sahifasi
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setState("keygate");
      } else {
        router.replace("/login?next=/admin");
      }
    } catch {
      if (typeof window !== "undefined" && window.innerWidth < 1024) setState("keygate");
      else router.replace("/login?next=/admin");
    }
  };

  useEffect(() => { check(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === "loading") {
    return (
      <div className="min-h-screen grid place-items-center text-slate-500">
        <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Tekshirilmoqda…</div>
      </div>
    );
  }

  if (state === "keygate") {
    return <AdminKeyGate onDone={() => { setState("loading"); check(); }} />;
  }

  function onLogout() { doLogout(); router.push("/login"); }
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "AD";

  return (
    <div className="min-h-screen">
      <div className="h-[56px] glass-dark text-white flex items-center px-4 lg:px-6 justify-between sticky top-0 z-30 gap-4">
        <Link href="/admin" className="flex items-center gap-2 font-bold tracking-tight">
          <Image src="/adminapklogo.png" alt="" width={30} height={30} className="rounded-lg bg-white p-0.5" />
          <span className="hidden sm:inline">DREAM KOREA — Admin</span>
          <span className="sm:hidden">Admin</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="p-2 rounded-full hover:bg-white/10"><Bell className="h-5 w-5" /></Link>
          <div className="h-8 w-8 rounded-full bg-[#2563eb] grid place-items-center font-bold text-sm">{initials}</div>
          <button onClick={onLogout} aria-label="Chiqish" className="p-2 rounded-full hover:bg-white/10"><LogOut className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="flex">
        <aside className="hidden lg:block w-[240px] shrink-0 sticky top-[56px] h-[calc(100vh-56px)] overflow-auto glass border-r border-r-white/70 p-3 flex flex-col">
          <nav className="space-y-1 flex-1">
            {nav.map(([label, href, Icon]) => (
              <Link key={label} href={href} className={cn("flex items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
                pathname === href ? "bg-white/90 text-[#2563eb] shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_8px_20px_-12px_rgba(15,27,61,.4)]" : "text-slate-600 hover:bg-white/60")}>
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
