import {
  AudioLines,
  BookMarked,
  BookOpen,
  BookText,
  FileText,
  GraduationCap,
  Headphones,
  Keyboard,
  Languages,
  Lightbulb,
  ListChecks,
  MessageSquare,
  Mic,
  NotebookPen,
  PenLine,
  PenTool,
  Pencil,
  Sparkles,
  SpellCheck,
  Target,
  Timer,
  Trophy,
  Volume2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// TOPIK sahifasidagi kirish kartochkalari (O'qish / Tinglash / Yozish).
// Admin panelda tahrirlanadi: Kontent → Testlar → «Kirish kartochkalari».
// Ikonka va rang faqat shu ro'yxatdagi kalitlar orqali tanlanadi —
// klasslar manbayda har doim matn ko'rinishida yozilgani uchun
// Tailwind yig'ilishda ularni yo'qotmaydi.

export type TopikCardData = {
  id: string;
  title: string;
  desc: string;
  href: string;
  icon: string;
  color: string;
  order: number;
  enabled: boolean;
};

export const ICONS = {
  BookOpen,
  Headphones,
  PenLine,
  Mic,
  Volume2,
  Pencil,
  BookText,
  ListChecks,
  GraduationCap,
  Target,
  Keyboard,
  MessageSquare,
  Trophy,
  Timer,
  Lightbulb,
  Languages,
  AudioLines,
  NotebookPen,
  SpellCheck,
  BookMarked,
  FileText,
  PenTool,
  Sparkles,
} as const;

export const ICON_KEYS = Object.keys(ICONS) as unknown as [string, ...string[]];

export const CARD_COLORS = {
  "blue-600": "text-blue-600",
  "emerald-600": "text-emerald-600",
  "rose-600": "text-rose-600",
  "violet-600": "text-violet-600",
  "amber-600": "text-amber-600",
  "sky-600": "text-sky-600",
  "teal-600": "text-teal-600",
  "orange-600": "text-orange-600",
  "indigo-600": "text-indigo-600",
  "cyan-600": "text-cyan-600",
  "pink-600": "text-pink-600",
  "slate-700": "text-slate-700",
} as const;

export const COLOR_KEYS = Object.keys(CARD_COLORS) as unknown as [string, ...string[]];

export function cardIcon(name: string): LucideIcon {
  return (ICONS as Record<string, LucideIcon>)[name] ?? BookOpen;
}

export function cardColor(name: string): string {
  return (CARD_COLORS as Record<string, string>)[name] ?? "text-blue-600";
}

// Bazada yozilmagan bo'lsa (yoki xatolik bo'lsa) sayt shu kartochkalarni ko'radi.
export const DEFAULT_TOPIK_CARDS: TopikCardData[] = [
  {
    id: "default-reading",
    title: "O‘qish · Reading",
    desc: "Matnlar va savollar — rasmiy uslubda.",
    href: "/topik/exam?id=seed_topik1_reading",
    icon: "BookOpen",
    color: "blue-600",
    order: 0,
    enabled: true,
  },
  {
    id: "default-listening",
    title: "Tinglash · Listening",
    desc: "Ovozli savollar — taymer bilan.",
    href: "/topik/exam?id=seed_topik1_listening",
    icon: "Headphones",
    color: "emerald-600",
    order: 1,
    enabled: true,
  },
  {
    id: "default-writing",
    title: "Yozish · 쓰기",
    desc: "51/53/54 uslubidagi mashqlar + avto-baholash.",
    href: "/topik/writing",
    icon: "PenLine",
    color: "rose-600",
    order: 2,
    enabled: true,
  },
];
