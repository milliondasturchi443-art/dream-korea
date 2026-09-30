"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { toast } from "sonner";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  return (
    <div className="min-h-[60vh] grid place-items-center px-4 py-10 bg-[#f8fafc]">
      <Card className="w-full max-w-[420px] p-6">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="mt-4 text-xl font-bold text-center">Parolni tiklash</h1>
        <p className="text-center text-sm text-slate-500">Emailingizga tiklash havolasi yuboramiz</p>
        <form onSubmit={e=>{e.preventDefault(); toast.success("Havola yuborildi (mock): "+email);}} className="mt-6 space-y-3">
          <Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com" />
          <Button type="submit" className="w-full">Yuborish</Button>
        </form>
      </Card>
    </div>
  );
}
