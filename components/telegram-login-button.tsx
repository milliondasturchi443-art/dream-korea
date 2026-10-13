"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeEmail } from "@/lib/auth";
import { toast } from "sonner";

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

// Telegram Login Widget — kirish/ro'yxatdan o'tish bir tugmada
export function TelegramLoginButton({ next }: { next?: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [bot, setBot] = useState<string | null>(null);
  const [nextHref, setNextHref] = useState<string | null>(next ?? null);
  const router = useRouter();

  useEffect(() => {
    if (next == null) {
      const n = new URLSearchParams(window.location.search).get("next");
      if (n && n.startsWith("/") && !n.startsWith("//")) setNextHref(n);
    }
    fetch("/api/auth/telegram").then(r => r.json()).then(d => { if (d.enabled && d.username) setBot(String(d.username)); }).catch(() => {});
  }, [next]);

  useEffect(() => {
    if (!bot || !ref.current) return;
    window.onTelegramAuth = (user) => {
      fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      })
        .then(r => r.json().then(d => ({ ok: r.ok, d })))
        .then(({ ok, d }) => {
          if (!ok) { toast.error(d.error || "Telegram orqali kirishda xato"); return; }
          localStorage.setItem("dk_role", d.role);
          try { localStorage.setItem("dk_token", d.token ?? ""); sessionStorage.setItem("dk_token", d.token ?? ""); } catch {}
          localStorage.setItem("dk_user", JSON.stringify({ email: normalizeEmail(d.email ?? ""), name: d.name ?? "Foydalanuvchi", role: d.role, id: d.id }));
          toast.success(`Xush kelibsiz, ${d.name ?? ""}!`);
          if (nextHref && nextHref.startsWith("/") && !nextHref.startsWith("//")) router.push(nextHref);
          else if (d.role === "ADMIN") router.push("/adminstrationpanelofdreamkorea");
          else if (d.role === "TEACHER") router.push("/teacher");
          else router.push("/dashboard");
        })
        .catch(() => toast.error("Server bilan bog'lanib bo'lmadi"));
    };
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", bot);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-userpic", "false");
    // onauth — redirect'siz, sahifada qolamiz
    s.setAttribute("data-onauth", "onTelegramAuth(user)");
    ref.current.appendChild(s);
    return () => { s.remove(); delete window.onTelegramAuth; };
  }, [bot, nextHref, router]);

  if (!bot) return null; // sozlanmagan bo'lsa — tugma ko'rinmaydi
  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">yoki</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="flex justify-center">
        <div ref={ref} />
      </div>
    </div>
  );
}
