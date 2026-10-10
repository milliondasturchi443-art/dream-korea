"use client";
import { Ban } from "lucide-react";

// /admin — doim yashirin. Hech qanday yo‘naltirish yo‘q (admin manzili oshkor bo‘lmasligi uchun).
export default function AdminEntry() {
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
