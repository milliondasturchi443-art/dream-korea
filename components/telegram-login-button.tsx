"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeEmail } from "@/lib/auth";
import { toast } from "sonner";

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

// Telegram redirect-qaytishda hash (#id=..&hash=..) qayta ishlash — root layout'da ham ishlaydi
export async function processTelegramHash(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash.slice(1);
  if (!hash || !hash.includes("auth_date")) return false;
  const params = Object.fromEntries(new URLSearchParams(hash).entries());
  if (!params.id || !params.hash || !params.auth_date) return false;
  try {
    const r = await fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const d = await r.json().catch(() => ({}));
    // hashni tozalash
    history.replaceState(null, "", window.location.pathname + window.location.search);
    if (!r.ok) { toast.error(d.error || "Telegram orqali kirishda xato"); return false; }
    localStorage.setItem("dk_role", d.role);
    try { localStorage.setItem("dk_token", d.token ?? ""); sessionStorage.setItem("dk_token", d.token ?? ""); } catch {}
    localStorage.setItem("dk_user", JSON.stringify({ email: normalizeEmail(d.email ?? ""), name: d.name ?? "Foydalanuvchi", role: d.role, id: d.id }));
    toast.success(`Xush kelibsiz, ${d.name ?? ""}!`);
    let next: string | null = null;
    try { next = sessionStorage.getItem("dk_tg_next"); sessionStorage.removeItem("dk_tg_next"); } catch {}
    if (!next) next = new URLSearchParams(window.location.search).get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) window.location.href = next;
    else if (d.role === "ADMIN") window.location.href = "/adminstrationpanelofdreamkorea";
    else if (d.role === "TEACHER") window.location.href = "/teacher";
    else window.location.href = "/dashboard";
    return true;
  } catch {
    toast.error("Server bilan bog'lanib bo'lmadi");
    return false;
  }
}

// Telegram orqali kirish — custom tugma: popup, bloklansa redirect fallback
export function TelegramLoginButton({ next }: { next?: string | null }) {
  const [enabled, setEnabled] = useState(false);
  const [botId, setBotId] = useState<string | null>(null);
  const [nextHref, setNextHref] = useState<string | null>(next ?? null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const openedRef = useRef(false);

  useEffect(() => {
    if (next == null) {
      const n = new URLSearchParams(window.location.search).get("next");
      if (n && n.startsWith("/") && !n.startsWith("//")) setNextHref(n);
    }
    // Redirect-oqib kelgan bo'lsa (hash bilan) — shu yerda yakunlaymiz
    if (window.location.hash.includes("auth_date")) processTelegramHash();
    fetch("/api/auth/telegram").then(r => r.json()).then(d => {
      if (d.enabled && d.username) { setEnabled(true); setBotId(String(d.botId ?? "")); }
    }).catch(() => {});
  }, [next]);

  async function finishLogin(user: Record<string, unknown>) {
    try {
      const r = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error || "Telegram orqali kirishda xato"); return; }
      localStorage.setItem("dk_role", d.role);
      try { localStorage.setItem("dk_token", d.token ?? ""); sessionStorage.setItem("dk_token", d.token ?? ""); } catch {}
      localStorage.setItem("dk_user", JSON.stringify({ email: normalizeEmail(d.email ?? ""), name: d.name ?? "Foydalanuvchi", role: d.role, id: d.id }));
      toast.success(`Xush kelibsiz, ${d.name ?? ""}!`);
      if (nextHref && nextHref.startsWith("/") && !nextHref.startsWith("//")) router.push(nextHref);
      else if (d.role === "ADMIN") router.push("/adminstrationpanelofdreamkorea");
      else if (d.role === "TEACHER") router.push("/teacher");
      else router.push("/dashboard");
    } catch {
      toast.error("Server bilan bog'lanib bo'lmadi");
    } finally { setBusy(false); }
  }

  function onClick() {
    if (!botId || busy) return;
    setBusy(true);
    const origin = window.location.origin;
    const base = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(origin)}`;
    // 1) Urinish: popup (postMessage orqali javob keladi)
    const w = window.open(`${base}&embed=1`, "telegram_auth", "width=560,height=640");
    if (w) {
      const win = w;
      function onMsg(e: MessageEvent) {
        if (e.origin !== "https://oauth.telegram.org") return;
        const data = e.data as { event?: string; payload?: Record<string, unknown> } | null;
        if (data?.event === "telegram_auth" && data.payload) {
          window.removeEventListener("message", onMsg);
          try { win.close(); } catch {}
          finishLogin(data.payload);
        }
      }
      window.addEventListener("message", onMsg);
      const t = setInterval(() => {
        if (win.closed) { clearInterval(t); window.removeEventListener("message", onMsg); setBusy(false); }
      }, 800);
      return;
    }
    // 2) Popup bloklangan — to'liq redirect (Telegram sahifa ochib, xesh bilan qaytaradi)
    if (nextHref) { try { sessionStorage.setItem("dk_tg_next", nextHref); } catch {} }
    window.location.href = base;
  }

  if (!enabled) return null;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">yoki</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#229ED9] px-4 py-3 text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(34,158,217,0.35)] transition-all hover:bg-[#1b8dc0] hover:shadow-[0_4px_14px_rgba(34,158,217,0.45)] active:scale-[0.98] disabled:opacity-60"
      >
        <TelegramIcon className="h-5 w-5 shrink-0" />
        {busy ? "Telegram oynasi ochilmoqda…" : "Telegram orqali kirish"}
      </button>
      <p className="mt-2 text-center text-[11px] text-slate-400">Birinchi marta kirishingiz — akkaunt avtomatik yaratiladi</p>
    </div>
  );
}
