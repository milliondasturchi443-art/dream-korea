"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { DEMO_USERS, roleHome, normalizeEmail, type Role } from "@/lib/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const norm = normalizeEmail(email);
    const u = DEMO_USERS[norm] ?? DEMO_USERS[email.trim().toLowerCase()];
    if (!u || u.password !== password) {
      toast.error("Email yoki parol noto‘g‘ri");
      return;
    }
    localStorage.setItem("dk_role", u.role);
    localStorage.setItem("dk_user", JSON.stringify({ email: norm, name: u.name, role: u.role }));
    toast.success(`Xush kelibsiz, ${u.name}!`);
    router.push(roleHome(u.role as Role));
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4 py-10 bg-[#f8fafc]">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card className="w-full max-w-[440px] p-6 lg:p-8">
          <div className="flex justify-center"><Logo /></div>
          <h1 className="mt-4 text-xl font-bold text-center text-slate-900">Kirish</h1>
          <p className="text-center text-sm text-slate-500">Akkauntingizga kiring</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700">Email</label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="mt-1" autoComplete="email" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Parol</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full mt-2">Kirish</Button>
          </form>
          <div className="mt-4 flex justify-between text-xs">
            <Link href="/register" className="text-[#2563eb] hover:underline">Ro‘yxatdan o‘tish</Link>
            <Link href="/forgot-password" className="text-slate-500 hover:text-slate-700">Parolni unutdingizmi?</Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
