"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getBlockedApps, isAppBlockedForCurrentUser } from "@/lib/app-lock";
import { toast } from "sonner";

// Agar o‘quvchi bloklangan app ga o‘tmoqchi bo‘lsa — DreamKorea ga redirect
// Hozir web da: /videos, /media va tashqi app linklari uchun ishlaydi + intercept tashqi linklar
export function BlockGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const apps = getBlockedApps();
    if (!apps.length) return;
    let groupId: string | undefined, userId: string | undefined;
    let isAdmin = false;
    try {
      const u = JSON.parse(localStorage.getItem("dk_user") || "{}");
      groupId = u.groupId; userId = u.id || u.email;
      isAdmin = u.role === "ADMIN";
    } catch {}
    if (isAdmin) return;

    // 1) ichki route mapping: /videos, /media va h.k.
    const map: Record<string, string> = {
      "/videos": "videos",
      "/media": "media",
      "/topik": "topik",
    };
    const key = map[pathname || ""];
    if (key) {
      const found = apps.find(a => a.packageOrUrl.toLowerCase() === key || a.name.toLowerCase() === key);
      if (found && isAppBlockedForCurrentUser(found, groupId, userId)) {
        toast.error(`🔒 ${found.name || key} bloklangan — avval vazifalarni bajaring`);
        router.replace("/dashboard");
        return;
      }
    }

    // 2) tashqi link intercept — Click/Meta trick emas, oddiy href tekshiruvi
    const handler = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
      if (!a?.href) return;
      const href = a.href.toLowerCase();
      for (const app of apps) {
        const needle = app.packageOrUrl.toLowerCase();
        if (needle.length < 3) continue;
        if (href.includes(needle) || app.name.toLowerCase() && href.includes(app.name.toLowerCase().split(" ")[0])) {
          if (isAppBlockedForCurrentUser(app, groupId, userId)) {
            e.preventDefault();
            toast.error(`🔒 ${app.name} bloklangan — DreamKorea’da qoling`);
            router.replace("/dashboard");
            return;
          }
        }
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [pathname, router]);

  return null;
}
