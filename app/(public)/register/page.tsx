"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidUZ } from "@/lib/phone";
import { toast } from "sonner";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) { toast.error("Barcha maydonlarni to‘ldiring"); return; }
    if (phone && !isValidUZ(phone)) { toast.error("Telefon raqamini to‘g‘ri kiriting: +998 90 123 45 67"); return; }
    const payload: Record<string,string> = { email, name, role: "STUDENT" };
    if (phone) payload.phone = phone;
    localStorage.setItem("dk_role", "STUDENT");
    localStorage.setItem("dk_user", JSON.stringify(payload));
    toast.success("Muvaffaqiyatli ro‘yxatdan o‘tdingiz!");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4 py-6 sm:py-10 bg-[#f8fafc]">
      <Card className="w-full max-w-[480px] p-5 sm:p-6 lg:p-8">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="mt-4 text-xl font-bold text-center">Ro‘yxatdan o‘tish</h1>
        <p className="text-center text-sm text-slate-500">Bepul akkaunt yarating</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div><label className="text-xs font-medium">F.I.Sh.</label><Input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Bobur Karimov" className="mt-1 text-base sm:text-sm" /></div>
          <PhoneInput label="Telefon" value={phone} onValueChange={setPhone} placeholder="+998 90 123 45 67" />
          <div><label className="text-xs font-medium">Email</label><Input inputMode="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com" className="mt-1 text-base sm:text-sm" /></div>
          <div><label className="text-xs font-medium">Parol</label><Input type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="mt-1 text-base sm:text-sm" /></div>
          <Button type="submit" className="w-full mt-2 h-11">Ro‘yxatdan o‘tish</Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">Akkauntingiz bormi? <Link href="/login" className="text-[#2563eb] font-medium">Kirish</Link></p>
      </Card>
    </div>
  );
}
