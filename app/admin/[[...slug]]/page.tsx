"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2 } from "lucide-react";

// /admin — Android (telefon) uchun ochiq yo'l (adminstrationpanelofdreamkorea'ga o'tkazadi),
// kompyuterda esa sahifa yopiq.
export default function AdminEntry() {
  const router = useRouter();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      router.replace("/adminstrationpanelofdreamkorea");
    } else {
      setBlocked(true);
    }
  }, [router]);

  if (!blocked) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-500">
        <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Tekshirilmoqda…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 text-center">
      <div>
        <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 grid place-items-center">
          <Ban className="h-8 w-8 text-slate-400" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Sahifa mavjud emas</h1>
        <p className="mt-2 text-sm text-slate-500">Страница недоступна</p>
      </div>
    </div>
  );
}
