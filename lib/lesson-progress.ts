"use client";

// Последовательные уроки: нельзя перейти дальше, пока не завершён текущий
// Храним в localStorage: { [courseId]: number[] } — индексы завершённых уроков (0-based)

const KEY = "dk_lesson_progress";
const COMPLETED_KEY = "dk_completed_lessons"; // Set of lesson ids like "1-3"

export function getCompleted(courseId: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const obj = JSON.parse(raw);
    return Array.isArray(obj[courseId]) ? obj[courseId] : [];
  } catch { return []; }
}

export function isLessonUnlocked(courseId: string, index: number): boolean {
  if (index === 0) return true;
  const done = getCompleted(courseId);
  // все предыдущие должны быть done
  for (let i = 0; i < index; i++) if (!done.includes(i)) return false;
  return true;
}

export function markCompleted(courseId: string, index: number) {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(KEY);
  const obj = raw ? JSON.parse(raw) : {};
  const arr: number[] = Array.isArray(obj[courseId]) ? obj[courseId] : [];
  if (!arr.includes(index)) arr.push(index);
  obj[courseId] = arr;
  localStorage.setItem(KEY, JSON.stringify(obj));
  // also mark global lesson id
  const gRaw = localStorage.getItem(COMPLETED_KEY);
  const set: Record<string, boolean> = gRaw ? JSON.parse(gRaw) : {};
  set[`${courseId}-${index}`] = true;
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(set));
}

export function isGlobalLessonCompleted(courseId: string, index: number): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(COMPLETED_KEY);
    if (!raw) return false;
    const obj = JSON.parse(raw);
    return !!obj[`${courseId}-${index}`];
  } catch { return false; }
}
