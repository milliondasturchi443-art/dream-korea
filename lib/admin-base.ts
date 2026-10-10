// Admin panel uchun asosiy yo'l. Telefon uchun alohida yashirin yo'l ham ishlaydi.
export const ADMIN_BASE = "/adminstrationpanelofdreamkorea";
export const ADMIN_PHONE_BASE = "/adminstrationpanelofdreamkoreaphone";

// Joriy pathname dan admin bazasini aniqlaydi (telefon yoki kompyuter yo'li)
export function adminBase(pathname: string | null | undefined): string {
  if (pathname && pathname.startsWith(ADMIN_PHONE_BASE)) return ADMIN_PHONE_BASE;
  return ADMIN_BASE;
}

// Bazaga nisbatan to'liq yo'l: adminHref("/users", pathname) => "<bazа>/users"
export function adminHref(path: string, pathname: string | null | undefined): string {
  const base = adminBase(pathname);
  const p = path.startsWith("/") ? path : `/${path}`;
  // "/" bo'sh bo'lsa — bazaning o'zi
  if (p === "/") return base;
  return `${base}${p}`;
}
