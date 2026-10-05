// Блокировка приложений админом (например Instagram, TikTok и т.д.)
// Админ добавляет { id, name, packageOrUrl, blockedForGroups: string[], tasksRequired: string }
// Ученик пока не выполнит задания — доступ закрыт, редирект в DreamKorea

export type BlockedApp = {
  id: string;
  name: string;
  packageOrUrl: string; // com.instagram.android или https://tiktok.com
  groupIds: string[]; // пусто = всем
  taskIds: string[]; // задания которые нужно выполнить чтобы разблокировать
  reason?: string;
};

const APPS_KEY = "dk_blocked_apps";
const TASKS_KEY = "dk_group_tasks"; // { [groupId]: { [taskId]: { title, doneByUserIds: string[] } } }

export function getBlockedApps(): BlockedApp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(APPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function setBlockedApps(apps: BlockedApp[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
}

export function isAppBlockedForCurrentUser(app: BlockedApp, userGroupId?: string, userId?: string): boolean {
  // если группа не указана у приложения — блокируем всех
  if (app.groupIds.length > 0 && userGroupId && !app.groupIds.includes(userGroupId)) return false;
  // проверяем задания: если все taskIds выполнены пользователем — не блокируем
  if (app.taskIds.length === 0) return true; // заблокировано навсегда пока админ не разблокирует
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    const tasks = raw ? JSON.parse(raw) : {};
    // tasks structure: { [groupId]: { tasks: { [taskId]: { done: string[] } } }
    for (const tid of app.taskIds) {
      // ищем в любой группе
      let done = false;
      for (const gid of Object.keys(tasks)) {
        const g = tasks[gid];
        const t = g?.tasks?.[tid] || g?.[tid];
        if (t?.done?.includes(userId || "current") || t?.doneBy?.includes(userId || "current")) { done = true; break; }
      }
      if (!done) return true; // хоть одно не выполнено — блокируем
    }
    return false;
  } catch { return true; }
}

// WebView / Capacitor bridge: попробуй открыть пакет/URL, если заблокирован — redirect внутри приложения
export function tryOpenBlockedAware(packageOrUrl: string, fallbackUrl = "/dashboard"): { blocked: boolean; redirect?: string } {
  const apps = getBlockedApps();
  const found = apps.find(a => a.packageOrUrl === packageOrUrl || a.name === packageOrUrl || a.packageOrUrl === packageOrUrl.toLowerCase());
  if (!found) return { blocked: false };
  let groupId: string | undefined, userId: string | undefined;
  try {
    const u = JSON.parse(localStorage.getItem("dk_user") || "{}");
    groupId = u.groupId;
    userId = u.id || u.email;
    if (u.role === "ADMIN") return { blocked: false };
  } catch {}
  if (!isAppBlockedForCurrentUser(found, groupId, userId)) return { blocked: false };
  return { blocked: true, redirect: fallbackUrl };
}

// Хук для проверки при открытии стороннего приложения — вызывать в AppShell/useEffect
export function checkAndRedirectIfBlocked(packageOrUrl: string, redirectTo = "/dashboard"): string | null {
  const r = tryOpenBlockedAware(packageOrUrl, redirectTo);
  return r.blocked ? (r.redirect ?? redirectTo) : null;
}
