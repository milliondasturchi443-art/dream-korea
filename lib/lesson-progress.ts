"use client";

// Последовательные уроки: нельзя перейти дальше, пока не завершён текущий
// Храним в localStorage: { [courseId]: number[] } — индексы завершённых уроков (0-based)
// Сохраняем индексы (минимальное изменение), но делаем JSON-парсинг безопасным.

const KEY = "dk_lesson_progress";
const COMPLETED_KEY = "dk_completed_lessons";

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function getCompleted(courseId: string): number[] {
  if (typeof window === "undefined") return [];
  const obj = safeJsonParse<Record<string, unknown>>(localStorage.getItem(KEY), {});
  const v = obj[courseId];
  return Array.isArray(v) && v.every(n => typeof n === "number") ? (v as number[]) : [];
}

export function isLessonUnlocked(courseId: string, index: number): boolean {
  if (index === 0) return true;
  const done = getCompleted(courseId);
  for (let i = 0; i < index; i++) if (!done.includes(i)) return false;
  return true;
}

export function markCompleted(courseId: string, index: number) {
  if (typeof window === "undefined") return;
  try {
    const obj = safeJsonParse<Record<string, unknown>>(localStorage.getItem(KEY), {});
    const arr: number[] = Array.isArray(obj[courseId]) && (obj[courseId] as unknown[]).every(n => typeof n === "number") ? (obj[courseId] as number[]) : [];
    if (!arr.includes(index)) arr.push(index);
    (obj as Record<string, number[]>)[courseId] = arr;
    localStorage.setItem(KEY, JSON.stringify(obj));
  } catch {}
  try {
    const set = safeJsonParse<Record<string, boolean>>(localStorage.getItem(COMPLETED_KEY), {});
    set[`${courseId}-${index}`] = true;
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(set));
  } catch {}
}

export function isGlobalLessonCompleted(courseId: string, index: number): boolean {
  if (typeof window === "undefined") return false;
  const o = safeJsonParse<Record<string, boolean>>(localStorage.getItem(COMPLETED_KEY), {});
  return !!o[`${courseId}-${index}`];
}
