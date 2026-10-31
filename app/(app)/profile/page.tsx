"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatUZ, isValidUZ, telHref } from "@/lib/phone";
import { SITE_PHONE_DISPLAY } from "@/lib/site";
import { doLogout } from "@/lib/logout";
import {
  LogOut, Loader2, Camera, BadgeCheck, ShieldHalf, Target,
  UserRound, AtSign, Phone, ChevronRight, Save, BarChart3, UserRoundCog,
} from "lucide-react";
import { toast } from "sonner";
import { getCompleted } from "@/lib/lesson-progress";

type ApiCourse = { id: string; title: string; level: string; lessons: number };

/* — bo'lim sarlavhasi: kvadrat ikonka + qalin matn + gradient chiziq — */
function SectionTitle({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,.9)]">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <h2 className="text-[17px] font-extrabold tracking-tight text-slate-900">{title}</h2>
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-slate-300 via-slate-200 to-transparent" />
    </div>
  );
}

/* — maydon qatori: dumaloq ikonka + yorliq + inputsiz input — */
function FieldRow({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/85 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef4fd] text-[#2563eb]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/* — progress qatori: nom + foiz + maydon chizig'i — */
function ProgressRow({ title, pct, completed, total }: { title: string; pct: number; completed: number; total: number }) {
  return (
    <div className="rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-200/70">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm font-bold text-slate-900">{title}</span>
        <span className="shrink-0 text-sm font-extrabold text-[#2563eb]">{pct}%</span>
      </div>
      <Progress value={pct} className="mt-2" />
      <p className="mt-1.5 text-xs text-slate-500">{completed}/{total} dars</p>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [role, setRole] = useState("");
  const [avatar, setAvatar] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [topikScore, setTopikScore] = useState<number | null>(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("dk_user") || "{}");
      setName(u.name || "");
      setEmail(u.email || "");
      setPhone(u.phone || "");
      setRole(String(u.role || "STUDENT"));
      if (u.avatar) setAvatar(u.avatar);
    } catch {}
    // Роль из БД — источник правды (если админ сменил роль)
    let tk = "";
    try { tk = sessionStorage.getItem("dk_token") || localStorage.getItem("dk_token") || ""; } catch {}
    fetch("/api/auth/me", tk ? { headers: { Authorization: `Bearer ${tk}` } } : undefined)
      .then(r => r.ok ? r.json() : null).then(d => {
        if (d?.role) {
          setRole(String(d.role));
          try {
            const cur = JSON.parse(localStorage.getItem("dk_user") || "{}");
            localStorage.setItem("dk_user", JSON.stringify({ ...cur, name: d.name || cur.name, email: d.email || cur.email, role: d.role, id: d.id || cur.id, avatar: d.avatar || cur.avatar }));
            if (d.name) setName(d.name);
            if (d.avatar) setAvatar(d.avatar);
          } catch {}
        }
      }).catch(() => {});
    fetch("/api/courses").then(r => r.json()).then(d => { if (Array.isArray(d.courses)) setCourses(d.courses); }).catch(() => {});
    setLoaded(true);
    const sc = localStorage.getItem("dk_topik_score");
    if (sc !== null) {
      const n = Number(sc);
      if (Number.isFinite(n) && n >= 0) setTopikScore(n);
    }
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

  async function uploadAvatar(file: File) {
    if (!/^image\//i.test(file.type)) { toast.error("Faqat rasm tanlang (JPG, PNG…)"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Rasm juda katta — 5 MB dan kichik bo‘lsin"); return; }
    setUploading(true);
    try {
      const token = localStorage.getItem("dk_token") || "";
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Yuklab bo‘lmadi");
      setAvatar(d.url);
      try {
        const u = JSON.parse(localStorage.getItem("dk_user") || "{}");
        localStorage.setItem("dk_user", JSON.stringify({ ...u, avatar: d.url }));
      } catch {}
      toast.success("Rasm saqlandi");
    } catch (e) {
      toast.error((e as Error).message || "Yuklab bo‘lmadi");
    } finally { setUploading(false); }
  }

  function logout() { doLogout(); toast.success("Chiqdingiz"); router.push("/login"); }

  const initials = (name || "?").split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const totalLessons = courses.reduce((s, c) => s + c.lessons, 0);
  const totalDone = courses.reduce((s, c) => s + getCompleted(c.id).length, 0);
  const totalPct = totalLessons ? Math.min(100, Math.round((totalDone / totalLessons) * 100)) : 0;

  if (!loaded) return <div className="mx-auto max-w-[760px] p-6 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…</div>;

  return (
    <div className="mx-auto max-w-[760px] space-y-7 pb-10 pt-4 md:pt-8">
      {/* ——— Hero kartochka: katta avatar + ism + rollar pill ——— */}
      <div className="glass rounded-[28px] p-5 anim-fade-up">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="h-[92px] w-[92px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] grid place-items-center text-white shadow-[0_16px_34px_-14px_rgba(37,99,235,.85)]">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-extrabold">{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Rasmni o‘zgartirish"
              aria-label="Rasmni o‘zgartirish"
              className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[#0f1b3d] text-white shadow-md transition hover:bg-[#2563eb] disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = ""; }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900">{name || "Foydalanuvchi"}</h1>
              <BadgeCheck className="h-5 w-5 shrink-0 text-[#2563eb]" aria-hidden="true" />
            </div>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {email}
              {phone && <> · <a href={telHref(phone)} className="font-medium text-[#2563eb] hover:underline">{phone}</a></>}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-3 py-1 text-xs font-bold text-white shadow-[0_8px_16px_-8px_rgba(37,99,235,.9)]">
                <ShieldHalf className="h-3.5 w-3.5" />
                {role === "ADMIN" ? "Admin" : role === "TEACHER" ? "Ustoz" : "O‘quvchi"}
              </span>
              {topikScore !== null && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-[0_8px_16px_-8px_rgba(16,185,129,.9)]">
                  <Target className="h-3.5 w-3.5" /> TOPIK: {topikScore}
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />
        </div>
      </div>

      {/* ——— Profil ma'lumotlari ——— */}
      <section className="anim-fade-up" style={{ animationDelay: "60ms" }}>
        <SectionTitle icon={UserRoundCog} title="Profil ma’lumotlari" />
        <div className="glass space-y-3 rounded-[28px] p-4">
          <FieldRow icon={UserRound}>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">F.I.Sh.</label>
            <Input
              autoComplete="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ismingiz"
              className="mt-0.5 h-9 border-0 bg-transparent px-0 shadow-none focus:ring-0 focus:outline-none text-base font-semibold text-slate-900"
            />
          </FieldRow>

          <FieldRow icon={AtSign}>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Email</label>
            <Input
              inputMode="email"
              value={email}
              readOnly
              disabled
              className="mt-0.5 h-9 border-0 bg-transparent px-0 shadow-none text-base text-slate-500 opacity-100"
            />
          </FieldRow>

          <FieldRow icon={Phone}>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Telefon</label>
            <div className="relative mt-0.5">
              <span aria-hidden="true" className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 rounded-lg bg-[#eef4fd] px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-[#2563eb]">
                UZ
              </span>
              <Input
                inputMode="tel"
                autoComplete="tel"
                type="tel"
                value={phone}
                onChange={e => setPhone(formatUZ(e.target.value))}
                placeholder="+998 94 328 05 13"
                className="mt-0.5 h-9 border-0 bg-transparent pl-10 pr-0 shadow-none focus:ring-0 focus:outline-none text-base font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
              />
            </div>
            {phone && !isValidUZ(phone) && (
              <a href={telHref(SITE_PHONE_DISPLAY)} target="_blank" rel="noopener noreferrer"
                 className="mt-1 inline-flex text-xs font-semibold text-[#2563eb] hover:underline">
                Telefon raqamini tasdiqlash
              </a>
            )}
          </FieldRow>

          <Button
            onClick={save}
            disabled={saving}
            className="mt-1 h-12 w-full rounded-full bg-[#2563eb] text-base font-bold shadow-[0_16px_30px_-12px_rgba(37,99,235,.9)] transition hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </section>

      {/* ——— Progress ——— */}
      <section className="anim-fade-up" style={{ animationDelay: "120ms" }}>
        <div className="glass rounded-[28px] p-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,.9)]">
              <BarChart3 className="h-[18px] w-[18px]" />
            </span>
            <h2 className="text-[17px] font-extrabold tracking-tight text-slate-900">Progress</h2>
            <span className="ml-auto text-3xl font-extrabold tracking-tight text-slate-900">{totalPct}%</span>
          </div>

          {courses.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Kurslar yuklanmoqda yoki hali yo‘q</p>
          ) : (
            <>
              <div className="mt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-900">Umumiy ({totalDone}/{totalLessons} dars)</span>
                  <span className="text-sm font-extrabold text-[#2563eb]">{totalPct}%</span>
                </div>
                <Progress value={totalPct} className="mt-2" />
              </div>

              {courses.slice(0, 4).length > 0 && (
                <>
                  <div aria-hidden="true" className="my-4 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                  <div className="space-y-3">
                    {courses.slice(0, 4).map(c => {
                      const done = getCompleted(c.id).length;
                      const p = c.lessons ? Math.min(100, Math.round(done / c.lessons * 100)) : 0;
                      return <ProgressRow key={c.id} title={c.title} pct={p} completed={done} total={c.lessons} />;
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* ——— Akkaunt ——— */}
      <section className="anim-fade-up" style={{ animationDelay: "240ms" }}>
        <SectionTitle icon={UserRound} title="Akkaunt" />
        <button
          onClick={logout}
          className="glass flex w-full items-center gap-4 rounded-[28px] p-4 text-left transition hover:bg-rose-50/80"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-100">
            <LogOut className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block font-extrabold text-slate-900">Chiqish</span>
            <span className="block text-sm text-slate-500">Akauntdan chiqish — qayta kirish uchun login kerak.</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}
