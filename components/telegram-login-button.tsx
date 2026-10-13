"use client";
import { useEffect, useState } from "react";
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

// Telegram orqali kirish — custom tugma (oq, Telegram blu, ikonkali)
export function TelegramLoginButton({ next }: { next?: string | null }) {
  const [enabled, setEnabled] = useState(false);
  const [botId, setBotId] = useState<string | null>(null);
  const [nextHref, setNextHref] = useState<string | null>(next ?? null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (next == null) {
      const n = new URLSearchParams(window.location.search).get("next");
      if (n && n.startsWith("/") && !n.startsWith("//")) setNextHref(n);
    }
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
    if (!botId) return;
    setBusy(true);
    const origin = window.location.origin;
    const url = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(origin)}&embed=1`;
    const w = window.open(url, "telegram_auth", "width=560,height=640,noopener");
    if (!w) { toast.error("Popup yoki oynani bloklab qo'ydingiz"); setBusy(false); return; }
    // Telegram popup xabar yuboradi
    function onMsg(e: MessageEvent) {
      if (e.origin !== "https://oauth.telegram.org") return;
      const data = e.data as { event?: string; payload?: Record<string, unknown> } | null;
      if (data?.event === "telegram_auth" && data.payload) {
        window.removeEventListener("message", onMsg);
        finishLogin(data.payload);
      }
    }
    window.addEventListener("message", onMsg);
    // Popup yopilsa — kutishni to'xtatish (poll)
    const t = setInterval(() => { if (w.closed) { clearInterval(t); window.removeEventListener("message", onMsg); setBusy(false); } }, 800);
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
