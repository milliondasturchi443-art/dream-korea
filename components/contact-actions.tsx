"use client";
import { Phone, Send } from "lucide-react";
import { Button } from "./ui/button";
import { SITE_PHONE_E164, SITE_PHONE_DISPLAY, SITE_TELEGRAM } from "@/lib/site";
import { telHref } from "@/lib/phone";

export function ContactActions({ phone = SITE_PHONE_E164, display = SITE_PHONE_DISPLAY, compact = false }: { phone?: string; display?: string; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : ""}`}>
      <a href={telHref(phone)} aria-label="Qo'ng'iroq qilish">
        <Button size={compact ? "sm" : "default"} className="gap-1.5">
          <Phone className="h-4 w-4" /> {compact ? "Qo'ng'iroq" : display}
        </Button>
      </a>
      <a href={SITE_TELEGRAM} target="_blank" rel="noopener noreferrer" aria-label="Telegram">
        <Button size={compact ? "sm" : "default"} variant="outline" className="gap-1.5">
          <Send className="h-4 w-4" /> Telegram
        </Button>
      </a>
    </div>
  );
}

// Floating action button faqat telefon uchun (mobil)
export function CallFab({ phone = SITE_PHONE_E164 }: { phone?: string }) {
  return (
    <a
      href={telHref(phone)}
      aria-label="Qo'ng'iroq qilish"
      className="fixed bottom-[84px] right-4 z-30 lg:hidden h-12 w-12 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 grid place-items-center hover:bg-emerald-600 active:scale-95 transition"
    >
      <Phone className="h-5 w-5" />
    </a>
  );
}
