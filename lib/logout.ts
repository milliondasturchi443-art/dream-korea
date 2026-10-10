"use client";
export function doLogout() {
  try {
    localStorage.removeItem("dk_role");
    localStorage.removeItem("dk_user");
    localStorage.removeItem("dk_token");
    sessionStorage.removeItem("dk_token");
    // topik va boshqa dk_* qolsin — faqat auth tozalaymiz
  } catch {}
  try {
    // Server cookie'larini ham o'chiramiz (dk_token, dk_admin)
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  } catch {}
  // Кэш оболочки очищаем, чтобы следующий юзер не увидел чужой контент
  try {
    if (typeof window !== "undefined" && "caches" in window) {
      caches.keys().then((keys) => keys.filter((k) => k.startsWith("dk-")).forEach((k) => caches.delete(k))).catch(() => {});
    }
  } catch {}
}
