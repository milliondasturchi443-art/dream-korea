"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Mehmon ochiq qoladigan sahifalar (ma'lumotnomalar)
const GUEST_OK = ["/admission", "/universities"];

// O'quv maydonlari — faqat ro'yxatdan o'tgan/kirgan foydalanuvchi uchun
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    if (GUEST_OK.some(p => pathname === p || pathname.startsWith(p + "/"))) {
      setOk(true);
      return;
    }
    (async () => {
      let token = "";
      try { token = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; } catch {}
      try {
        const r = await fetch("/api/auth/me", token ? { headers: { Authorization: `Bearer ${token}` } } : {});
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.role) {
          if (alive) setOk(true);
          return;
        }
      } catch {}
      if (alive) {
        setOk(false);
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    })();
    return () => { alive = false; };
  }, [pathname, router]);

  if (ok === null) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-slate-500">
        <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Tekshirilmoqda…</div>
      </div>
    );
  }
  if (!ok) return null;
  return <>{children}</>;
}
