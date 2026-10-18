export const metadata = {
  title: "Maxfiylik siyosati — DREAM KOREA",
  description: "DREAM KOREA platformasining maxfiylik siyosati va shaxsiy maʼlumotlar bilan ishlash qoidalari.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[820px] p-4 lg:p-8 space-y-6 text-slate-800">
      <h1 className="text-2xl font-bold text-slate-900">Maxfiylik siyosati</h1>
      <p className="text-sm text-slate-500">Oxirgi yangilanish: 18-oktabr 2026 · Sayt: dream-korea.onrender.com</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">1. Biz qanday maʼlumot toʻplaymiz</h2>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Ism va email manzili (roʻyxatdan oʻtishda);</li>
          <li>Parolingiz — maxfiy kod (hash) koʻrinishida saqlanadi, ochiq matnda emas;</li>
          <li>Oʻquv natijalaringiz: test javoblari, ballar, daraja, darslar boʻyicha progress, yozish mashqlari;</li>
          <li>Xabarlar va bildirishnomalar tarixi;</li>
          <li>AI boʻlimiga yuklangan rasmlar — faqat javob generatsiya qilish uchun, boshqa maqsadda ishlatilmaydi.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2. Maqsad</h2>
        <p className="text-sm">
          Maʼlumotlar faqat platformani taqdim etish, hisobingizni boshqarish va oʻquv natijalaringizni saqlash uchun
          ishlatiladi. Reklama uchun sotilmaydi yoki uchinchi tomonga berilmaydi.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">3. Uchinchi tomon xizmatlari</h2>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li><b>MongoDB Atlas</b> — maʼlumotlar bazasi (AQSh hududida joylashgan serverlar);</li>
          <li><b>Render</b> — ilova hostingi;</li>
          <li><b>OpenRouter</b> — AI boʻlimidagi soʻrovlarni qayta ishlash (faqat rasm/matnni generatsiya uchun);</li>
          <li><b>Brevo</b> — email xabarnomalarni yuborish.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">4. Mobil ilova (APK)</h2>
        <p className="text-sm">
          DREAM KOREA mobil ilovasi shu saytni oʻz ichidagi xavfsiz WebView oynasida ochadi. Ilova brauzer
          kengaytmalaridan foydalanmaydi va sizning qurilmangizdan maʼlumot yigʻmaydi; kirish maʼlumotlari
          ilova ichida (DOM storage) saqlanadi.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">5. Hisobingizni oʻchirish</h2>
        <p className="text-sm">
          Hisobingizni oʻchirish yoki maʼlumotlaringiz haqida savol boʻlsa, administratorga yozing:
          {" "}<a className="text-[#2563eb] underline" href="mailto:dreamkorea@adminstator.kr">dreamkorea@adminstator.kr</a>.
          Soʻrov bajarilgandan soʻng maʼlumotlar oʻchiriladi.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">6. Bolalar</h2>
        <p className="text-sm">
          Platforma oʻquv maqsadida foydalaniladi. 14 yoshgacha boʻlgan foydalanuvchilarning hisobini
          ota-ona yoki homiy boshqaradi.
        </p>
      </section>
    </div>
  );
}
