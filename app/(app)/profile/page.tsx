"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidUZ, telHref } from "@/lib/phone";
import { SITE_PHONE_DISPLAY } from "@/lib/site";
import { Award, BookOpen, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const [phone, setPhone] = useState("+998 90 123 45 67");
  const [saving, setSaving] = useState(false);

  function save() {
    if (phone && !isValidUZ(phone)) { toast.error("Telefon formati noto‘g‘ri"); return; }
    setSaving(true);
    setTimeout(() => { setSaving(false); toast.success("Saqlab olindi"); }, 600);
  }

  return (
    <div className="mx-auto max-w-[900px] p-4 lg:p-6 space-y-5">
      <Card className="p-4 sm:p-5 flex gap-3 sm:gap-4 items-center overflow-hidden">
        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#2563eb] grid place-items-center text-white font-black text-lg sm:text-xl shrink-0">BK</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 truncate">Bobur Karimov</div>
          <div className="text-xs text-slate-500 truncate">student@dreamkorea.uz · <a href={telHref(phone)} className="font-medium text-[#2563eb] hover:underline">{phone || SITE_PHONE_DISPLAY}</a></div>
          <div className="mt-1 flex flex-wrap gap-1.5"><Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">TOPIK I</Badge><Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">Streak 12 kun</Badge></div>
        </div>
        <Button variant="outline" size="sm" className="hidden sm:inline-flex shrink-0">Rasmni o‘zgartirish</Button>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4 sm:p-5 space-y-3">
          <div className="font-semibold text-slate-900">Profil ma’lumotlari</div>
          <div><label className="text-xs font-medium">F.I.Sh.</label><Input autoComplete="name" defaultValue="Bobur Karimov" className="mt-1 text-base sm:text-sm" /></div>
          <div><label className="text-xs font-medium">Username</label><Input autoComplete="username" defaultValue="bobur_k" className="mt-1 text-base sm:text-sm" /></div>
          <div><label className="text-xs font-medium">Email</label><Input inputMode="email" autoComplete="email" defaultValue="student@dreamkorea.uz" className="mt-1 text-base sm:text-sm" /></div>
          <PhoneInput label="Telefon" value={phone} onValueChange={setPhone} />
          <div><label className="text-xs font-medium">Tug‘ilgan sana</label><Input type="date" defaultValue="2002-05-15" className="mt-1 text-base sm:text-sm" /></div>
          <Button className="w-full mt-2 h-11" onClick={save} disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</Button>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="font-semibold text-slate-900 flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#2563eb]"/> Progress</div>
            <div className="mt-3 space-y-3 text-sm">
              <div><div className="flex justify-between text-xs text-slate-500"><span>Koreys tili 1-daraja</span><span>72%</span></div><Progress value={72} className="mt-1" /></div>
              <div><div className="flex justify-between text-xs text-slate-500"><span>TOPIK I</span><span>54%</span></div><Progress value={54} className="mt-1" /></div>
              <div><div className="flex justify-between text-xs text-slate-500"><span>EPS-TOPIK</span><span>31%</span></div><Progress value={31} className="mt-1" /></div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="font-semibold text-slate-900 flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500"/> Yutuqlar</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="bg-amber-50 text-amber-700 border border-amber-200"><Award className="h-3 w-3 mr-1"/> 7 kun streak</Badge>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">100 so‘z</Badge>
              <Badge className="bg-blue-50 text-blue-700 border border-blue-200">TOPIK 78%</Badge>
              <Badge className="bg-violet-50 text-violet-700 border border-violet-200">1-kurs yakunlandi</Badge>
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="font-semibold text-slate-900">Sertifikatlar</div>
            <p className="text-sm text-slate-500 mt-1">Hozircha sertifikat yo‘q. Kursni yakunlagach sertifikat olasiz.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
