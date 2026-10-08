"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidUZ, telHref } from "@/lib/phone";
import { SITE_PHONE_DISPLAY } from "@/lib/site";
import { doLogout } from "@/lib/logout";
import { BookOpen, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getCompleted } from "@/lib/lesson-progress";

type ApiCourse = { id: string; title: string; level: string; lessons: number };

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<ApiCourse[]>([]);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("dk_user") || "{}");
      setName(u.name || "");
      setEmail(u.email || "");
      setPhone(u.phone || "");
    } catch {}
    fetch("/api/courses").then(r => r.json()).then(d => { if (Array.isArray(d.courses)) setCourses(d.courses); }).catch(() => {});
    setLoaded(true);
  }, []);

  async function save() {
    if (phone && !isValidUZ(phone)) { toast.error("Telefon formati noto‘g‘ri"); return; }
    if (!name.trim()) { toast.error("Ismni kiriting"); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem("dk_token") || "";
      const r = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Xato");
      try {
        const u = JSON.parse(localStorage.getItem("dk_user") || "{}");
        localStorage.setItem("dk_user", JSON.stringify({ ...u, name: d.name, phone: d.phone }));
      } catch {}
      toast.success("Saqlab olindi");
    } catch (e) {
      toast.error((e as Error).message || "Saqlab bo‘lmadi");
    } finally { setSaving(false); }
  }

  function logout() { doLogout(); toast.success("Chiqdingiz"); router.push("/login"); }

  const initials = (name || "?").split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const totalLessons = courses.reduce((s, c) => s + c.lessons, 0);
  const totalDone = courses.reduce((s, c) => s + getCompleted(c.id).length, 0);
  const [topikScore, setTopikScore] = useState<number | null>(null);
  useEffect(() => {
    const sc = localStorage.getItem("dk_topik_score");
    if (sc !== null) setTopikScore(Number(sc));
  }, []);

  if (!loaded) return <div className="mx-auto max-w-[900px] p-6 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</div>;

  return (
    <div className="mx-auto max-w-[900px] p-4 lg:p-6 space-y-5">
      <Card className="p-4 sm:p-5 flex gap-3 sm:gap-4 items-center overflow-hidden">
        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#2563eb] grid place-items-center text-white font-black text-lg sm:text-xl shrink-0">{initials}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 truncate">{name || "Foydalanuvchi"}</div>
          <div className="text-xs text-slate-500 truncate">{email}{phone ? <> · <a href={telHref(phone)} className="font-medium text-[#2563eb] hover:underline">{phone}</a></> : null}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">O‘quvchi</Badge>
            {topikScore !== null && <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">TOPIK: {topikScore}</Badge>}
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4 sm:p-5 space-y-3">
          <div className="font-semibold text-slate-900">Profil ma’lumotlari</div>
          <div><label className="text-xs font-medium">F.I.Sh.</label><Input autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ismingiz" className="mt-1 text-base sm:text-sm" /></div>
          <div><label className="text-xs font-medium">Email</label><Input inputMode="email" value={email} readOnly disabled className="mt-1 bg-slate-50" /></div>
          <PhoneInput label="Telefon" value={phone} onValueChange={setPhone} placeholder="+998 94 328 05 13" />
          <Button className="w-full mt-2 h-11" onClick={save} disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</Button>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="font-semibold text-slate-900 flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#2563eb]"/> Progress</div>
            <div className="mt-3 text-sm text-slate-600">
              {courses.length === 0 ? (
                <p className="text-slate-400">Kurslar yuklanmoqda yoki hali yo‘q</p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs"><span>Umumiy ({totalDone}/{totalLessons} dars)</span><span>{totalLessons ? Math.round(totalDone/totalLessons*100) : 0}%</span></div>
                    <Progress value={totalLessons ? Math.round(totalDone/totalLessons*100) : 0} className="mt-1" />
                  </div>
                  {courses.slice(0, 4).map(c => {
                    const done = getCompleted(c.id).length;
                    const p = c.lessons ? Math.round(done / c.lessons * 100) : 0;
                    return (
                      <div key={c.id}>
                        <div className="flex justify-between text-xs"><span className="truncate pr-2">{c.title}</span><span>{p}%</span></div>
                        <Progress value={p} className="mt-1" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="font-semibold text-slate-900">Sertifikatlar</div>
            <p className="text-sm text-slate-500 mt-1">Hozircha sertifikat yo‘q. Kursni yakunlagach sertifikat olasiz.</p>
          </Card>
          <Card className="p-4 sm:p-5 border-red-200 bg-red-50/50">
            <div className="font-semibold text-slate-900 flex items-center gap-2"><LogOut className="h-4 w-4 text-red-600"/> Akkaunt</div>
            <p className="text-xs text-slate-600 mt-1">Akauntdan chiqish — qayta kirish uchun login kerak.</p>
            <Button variant="outline" className="w-full mt-3 border-red-200 text-red-700 hover:bg-red-50" onClick={logout}><LogOut className="h-4 w-4 mr-1"/> Chiqish</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
