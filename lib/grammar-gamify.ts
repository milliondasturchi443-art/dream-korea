// Grammatika — o'yinlashgan tizim: ball (XP), darajalar, streak, combo, yutuqlar.
export type Attempt = {
  at: number;
  pct: number;
  score: number;
  total: number;
  folderId: string;
  folderTitle: string;
};

export type Profile = {
  xp: number;
  streak: number;
  lastDay: string;
  achievements: string[];
  bestCombo: number;
  correct: number;
  answered: number;
  cardsKnown: number;
  topicsLearned: number;
  daily: { day: string; count: number; claimed: boolean };
  history: Attempt[];
};

export const XP = {
  correct: 10,        // birinchi urinishda to'g'ri
  correctRetry: 3,    // qayta yechib to'g'ri
  learn: 25,          // mavzuni o'zlashtirish
  card: 2,            // kartani "bilaman"
  testPerfect: 60,    // test 100%
  daily: 50,          // kunlik vazifa (3 ta mashq)
};

export const DAILY_TASK = 3;

export const levels = [
  { name: "Bronza",   icon: "B", min: 0,    color: "#b45309" },
  { name: "Kumush",   icon: "K", min: 300,  color: "#64748b" },
  { name: "Oltin",    icon: "O", min: 800,  color: "#d97706" },
  { name: "Platina",  icon: "P", min: 1600, color: "#0891b2" },
  { name: "Almaz",    icon: "A", min: 3000, color: "#2563eb" },
  { name: "Usta",     icon: "U", min: 5000, color: "#7c3aed" },
];

export function levelOf(xp: number) {
  let idx = 0;
  for (let i = 0; i < levels.length; i++) if (xp >= levels[i].min) idx = i;
  const cur = levels[idx];
  const next = levels[idx + 1] ?? null;
  const span = next ? next.min - cur.min : 1;
  const pct = next ? Math.min(100, Math.round(((xp - cur.min) / span) * 100)) : 100;
  return { idx, cur, next, pct, toNext: next ? Math.max(0, next.min - xp) : 0 };
}

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function emptyProfile(): Profile {
  return {
    xp: 0, streak: 0, lastDay: "", achievements: [], bestCombo: 0,
    correct: 0, answered: 0, cardsKnown: 0, topicsLearned: 0,
    daily: { day: today(), count: 0, claimed: false }, history: [],
  };
}

/** Har bir kun birinchi kirishda seriyani yangilaydi */
export function rollStreak(p: Profile): Profile {
  const t = today();
  if (p.lastDay === t) return p;
  const streak = p.lastDay === yesterday() ? p.streak + 1 : 1;
  return { ...p, streak, lastDay: t, daily: { day: t, count: 0, claimed: false } };
}

export type UnlockCtx = {
  profile: Profile;
  learned: Record<string, boolean>;
  best: Record<string, number>;
  folderDone: string[];
  folderId: string;
};

export type Achievement = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  check: (c: UnlockCtx) => boolean;
};

export const achievements: Achievement[] = [
  { id: "first_correct", title: "Birinchi qadam", desc: "Birinchi to'g'ri javobni bering", icon: "1", color: "#059669",
    check: c => c.profile.correct >= 1 },
  { id: "combo3", title: "Uchlik seriya", desc: "3 ta javobni ketma-ket to'g'ri bering", icon: "3", color: "#f59e0b",
    check: c => c.profile.bestCombo >= 3 },
  { id: "combo10", title: "O'nlik zarba", desc: "10 ta javobni ketma-ket to'g'ri bering", icon: "10", color: "#dc2626",
    check: c => c.profile.bestCombo >= 10 },
  { id: "correct10", title: "O'n mas'uliyat", desc: "Jami 10 ta to'g'ri javob", icon: "10", color: "#2563eb",
    check: c => c.profile.correct >= 10 },
  { id: "correct50", title: "Bilimdon", desc: "Jami 50 ta to'g'ri javob", icon: "50", color: "#7c3aed",
    check: c => c.profile.correct >= 50 },
  { id: "correct150", title: "Grammatika qo'riqchisi", desc: "Jami 150 ta to'g'ri javob", icon: "150", color: "#0f766e",
    check: c => c.profile.correct >= 150 },
  { id: "first_topic", title: "Birinchi mavzu", desc: "Birinchi mavzuni o'zlashtiring", icon: "✓", color: "#059669",
    check: c => c.profile.topicsLearned >= 1 },
  { id: "topics10", title: "O'n mavzu", desc: "10 ta mavzuni o'zlashtiring", icon: "10", color: "#2563eb",
    check: c => c.profile.topicsLearned >= 10 },
  { id: "topics25", title: "Yigirma besh mavzu", desc: "25 ta mavzuni o'zlashtiring", icon: "25", color: "#7c3aed",
    check: c => c.profile.topicsLearned >= 25 },
  { id: "topics_all", title: "To'liq ustoz", desc: "Barcha 43 mavzuni tugating", icon: "U", color: "#be185d",
    check: c => c.profile.topicsLearned >= 43 },
  { id: "folder_particles", title: "Yuklama ustasi", desc: "«Yuklamalar» papkasini tugating", icon: "Y", color: "#2563eb",
    check: c => c.folderDone.includes("particles") },
  { id: "folder_verbs", title: "Fe'l ustasi", desc: "«Fe'llar» papkasini tugating", icon: "F", color: "#7c3aed",
    check: c => c.folderDone.includes("verbs") },
  { id: "folder_eps", title: "EPS tayyor", desc: "«EPS uchun» papkasini tugating", icon: "E", color: "#dc2626",
    check: c => c.folderDone.includes("eps") },
  { id: "test_80", title: "Yaxshi natija", desc: "Testda kamida 80% to'plang", icon: "%", color: "#059669",
    check: c => Object.values(c.best).some(v => v >= 80) },
  { id: "test_100", title: "Mukammal test", desc: "Testda 100% to'plang", icon: "100", color: "#d97706",
    check: c => Object.values(c.best).some(v => v >= 100) },
  { id: "cards20", title: "Karta yig'uvchi", desc: "20 ta kartani «bilaman» deb belgilang", icon: "K", color: "#0891b2",
    check: c => c.profile.cardsKnown >= 20 },
  { id: "streak3", title: "3 kunlik olov", desc: "3 kun ketma-ket o'qing", icon: "3", color: "#f59e0b",
    check: c => c.profile.streak >= 3 },
  { id: "streak7", title: "Haftalik marafon", desc: "7 kun ketma-ket o'qing", icon: "7", color: "#dc2626",
    check: c => c.profile.streak >= 7 },
  { id: "streak30", title: "Oylık fanat", desc: "30 kun ketma-ket o'qing", icon: "30", color: "#7c3aed",
    check: c => c.profile.streak >= 30 },
  { id: "daily", title: "Kunlik vazifa", desc: "Bir kunda 3 ta mashq bajaring", icon: "D", color: "#059669",
    check: c => c.profile.daily.claimed },
  { id: "level_gold", title: "Oltin daraja", desc: "Oltin darajaga yeting", icon: "O", color: "#d97706",
    check: c => levelOf(c.profile.xp).idx >= 2 },
  { id: "level_diamond", title: "Almaz daraja", desc: "Almaz darajaga yeting", icon: "A", color: "#2563eb",
    check: c => levelOf(c.profile.xp).idx >= 4 },
  { id: "xp1000", title: "Mini' ball", desc: "1000 XP to'plang", icon: "X", color: "#059669",
    check: c => c.profile.xp >= 1000 },
  { id: "xp3000", title: "Uch ming!", desc: "3000 XP to'plang", icon: "X", color: "#be185d",
    check: c => c.profile.xp >= 3000 },
];

/** Yangi yutuqlarni topadi — qaytarilganlar yangi ochilganlar */
export function checkAchievements(c: UnlockCtx): Achievement[] {
  const have = new Set(c.profile.achievements);
  return achievements.filter(a => !have.has(a.id) && a.check(c));
}

export function comboBonus(combo: number): number {
  if (combo < 3) return 0;
  return Math.min(20, (combo - 2) * 2);
}

export const LS_PROFILE = "dk_grammar_profile";

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(LS_PROFILE);
    if (!raw) return emptyProfile();
    const p = { ...emptyProfile(), ...(JSON.parse(raw) as Partial<Profile>) };
    return rollStreak(p);
  } catch { return emptyProfile(); }
}

export function saveProfile(p: Profile) {
  try { localStorage.setItem(LS_PROFILE, JSON.stringify(p)); } catch { /* ignore */ }
}
