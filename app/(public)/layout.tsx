import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SITE_PHONE_E164, SITE_PHONE_DISPLAY, SITE_PHONE2_E164, SITE_PHONE2_DISPLAY, SITE_EMAIL, SITE_ADDRESS, SITE_TELEGRAM, SITE_TELEGRAM_BOT } from "@/lib/site";
import { telHref } from "@/lib/phone";
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="bg-[#0f1b3d] text-slate-300">
        <div className="mx-auto max-w-[1200px] px-4 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="font-bold text-white">DREAM KOREA</div>
            <div className="text-xs tracking-widest text-slate-400">KOREAN LANGUAGE CENTER</div>
            <p className="mt-3 text-slate-400 leading-relaxed">Koreys tilini o‘rganing, orzuingizga yaqinlashing! TOPIK, EPS-TOPIK va universitetlarga tayyorgarlik.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={telHref(SITE_PHONE_E164)} className="rounded-full bg-white text-[#0f1b3d] px-3 py-1.5 text-xs font-semibold hover:bg-slate-100">📞 {SITE_PHONE_DISPLAY}</a>
            </div>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Bo‘limlar</div>
            <ul className="space-y-2">
              <li><Link href="/courses" className="hover:text-white">Kurslar</Link></li>
              <li><Link href="/topik" className="hover:text-white">TOPIK</Link></li>
              <li><Link href="/universities" className="hover:text-white">Universitetlar</Link></li>
              <li><Link href="/admission" className="hover:text-white">Qabul</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Aloqa</div>
            <div className="space-y-1.5">
              <a href={telHref(SITE_PHONE_E164)} className="block hover:text-white">{SITE_PHONE_DISPLAY}</a>
              <a href={telHref(SITE_PHONE2_E164)} className="block hover:text-white">{SITE_PHONE2_DISPLAY}</a>
              <a href={`mailto:${SITE_EMAIL}`} className="block hover:text-white">{SITE_EMAIL}</a>
              <span className="block text-slate-400">{SITE_ADDRESS}</span>
              <div className="pt-1 flex gap-2">
                <a href={SITE_TELEGRAM} target="_blank" rel="noopener noreferrer" className="text-xs underline underline-offset-4 hover:text-white">Telegram kanal</a>
                <a href={SITE_TELEGRAM_BOT} target="_blank" rel="noopener noreferrer" className="text-xs underline underline-offset-4 hover:text-white">Telegram bot</a>
              </div>
            </div>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Ijtimoiy tarmoqlar</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <a href={SITE_TELEGRAM} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-3 py-1.5 hover:bg-white/10">Telegram kanal</a>
              <a href={SITE_TELEGRAM_BOT} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-3 py-1.5 hover:bg-white/10">Telegram bot</a>
            </div>
            <p className="mt-6 text-xs text-slate-500">© 2026 DREAM KOREA. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
