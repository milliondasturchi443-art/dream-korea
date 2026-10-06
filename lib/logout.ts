"use client";
export function doLogout() {
  try {
    localStorage.removeItem("dk_role");
    localStorage.removeItem("dk_user");
    localStorage.removeItem("dk_token");
    // topik va boshqa dk_* qolsin — faqat auth tozalaymiz
  } catch {}
}
