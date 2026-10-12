// Kitoblar — hozircha lokal kontent + PDF download. Keyin real PDF url qo'shilsa, <iframe>da ochiladi.
export type BookDef = { id: string; title: string; level: string; pages: number; color: string; description: string; pdfUrl?: string; chapters: { title: string; body: string[] }[] };

export const booksData: BookDef[] = [
  {
    id: "1", title: "TOPIK I — Reading & Listening", level: "TOPIK I", pages: 320, color: "from-blue-600 to-indigo-600",
    description: "TOPIK I rasmiy imtihonga yaqin savollar, o'qish va tinglash.",
    chapters: [
      { title: "1-dars: O'qish — asosiy strategiya", body: ["Matnni avval savol bilan o'qing, keyin javob izlang.", "Misol: 도서관 개방시간 09:00~18:00 — savol 'qachon yopiq?' → 토·일.", "Mashq: quyidagi e'londan savol tuzing."] },
      { title: "2-dars: Listening — kalit so'zlar", body: ["Eshiting, yozib olmang — kalit so'zni ushlang: 시간, 장소, 사람.", "Misol: 공장에서 일하고 싶어요 → 이력서.", "Mashq: audio '오후 세 시'를 tinglab yozing."] },
    ],
  },
  {
    id: "2", title: "Korean Grammar in Use — Beginner", level: "A1-A2", pages: 408, color: "from-emerald-600 to-teal-600",
    description: "Boshlang'ich grammatika: zarralar, fe'llar, bog'lovchilar — misollar bilan.",
    chapters: [
      { title: "입니다 / 입니까 — rasmiy bo'lish", body: ["입니다 — tasdiq, 입니까 — savol. 학생입니다 / 학생입니까?", "Mashq: 저는 의사___ (to'g'risini tanlang)."] },
      { title: "은/는, 이/가 — farqi nima?", body: ["은/는 mavzu, 이/가 yangi axborot. 저는 학생입니다 vs 민수가 왔어요.", "Mashq: 5 gapda yuklamani toping."] },
    ],
  },
  {
    id: "3", title: "EPS-TOPIK Standard Textbook", level: "EPS", pages: 280, color: "from-violet-600 to-purple-600",
    description: "Zavod, ish joyi, xavfsizlik — EPS imtihoni uchun majburiy lug'at va grammatika.",
    chapters: [
      { title: "Ish joyi — xavfsizlik", body: ["안전모를 써야 합니다 — kaska kiyish kerak.", "비상벨을 누르세요 — favqulodda tugmani bosing.", "Mashq: 10 ta xavfsizlik so'zini yodlang."] },
      { title: "Ish vaqti, maosh", body: ["월급은 매달 25일에 입금됩니다.", "하루 8시간 일합니다.", "Mashq: ish jadvalini koreyschaga yozing."] },
    ],
  },
  {
    id: "4", title: "Vocabulary 2000 — Essential Words", level: "A1-B1", pages: 360, color: "from-rose-600 to-pink-600",
    description: "Eng kerak 2000 so'z — kundalik, ish, imtihon.",
    chapters: [
      { title: "1-qism: Kundalik 500", body: ["가다, 오다, 먹다, 마시다, 자다 — har kuni 10 tadan.", "Har so'zga gap tuzing: 학교에 가요.", "Mashq: 20 so'zdan dialog tuzing."] },
    ],
  },
  {
    id: "5", title: "TOPIK II — Reading (O'rta)", level: "TOPIK II", pages: 340, color: "from-slate-700 to-slate-900",
    description: "TOPIK II o'rta daraja — maqola, grafik, uzun matnlar.",
    chapters: [
      { title: "Maqola o'qish", body: ["정부는 외국인 근로자의 안전교육을 강화하기로 했다 — nima kuchayadi? 안전교육.", "Mashq: gazetadan 1 maqola topib, 2 savol tuzing."] },
      { title: "Grafik va jadval", body: ["Grafik: 10만→25만 = 증가했다.", "Mashq: o'zingiz grafik chizing va tushuntiring."] },
    ],
  },
  {
    id: "6", title: "Listening Mastery — TOPIK I·II", level: "TOPIK I-II", pages: 260, color: "from-teal-600 to-cyan-600",
    description: "Joy, vaqt, narx, odam — eshitib tushunish mashqlari.",
    chapters: [
      { title: "Joy va vaqt eshitish", body: ["어디에서 일해요? — 병원에서.", "몇 시에 만나요? — 오후 세 시.", "Mashq: 5 dialogni tinglab yozing."] },
    ],
  },
  {
    id: "7", title: "Hangeul — Alifbodan boshlab", level: "A0-A1", pages: 140, color: "from-amber-600 to-orange-600",
    description: "Hangeul harflari, bo'g'in, o'qish qoidalari — 0 dan boshlovchilar uchun.",
    chapters: [
      { title: "Undosh va unlilar", body: ["ㄱ[g], ㄴ[n], ㅏ[a], ㅓ[eo] — harfni yozing va ayting.", "Mashq: 한글 yozuvini ko'chirib yozing."] },
    ],
  },
  {
    id: "8", title: "Koreys tili — Kundalik dialoglar", level: "A1-A2", pages: 200, color: "from-pink-600 to-rose-600",
    description: "Do'kon, kasalxona, ish joyi — hayotda kerak bo'ladigan dialoglar.",
    chapters: [
      { title: "Do'konda", body: ["이거 얼마예요? — 만 오천 원이에요.", "Mashq: do'konda dialog tuzing."] },
      { title: "Kasalxonada", body: ["어디가 아파요? — 머리가 아파요.", "Mashq: shifokor bilan dialog."] },
    ],
  },
];

// PDF generatsiya — jsPDF bilan, koreys matni UNICODE (latin transliteratsiyasi bilan)
// Koreys tili jsPDF'ning default fontida to'g'ri chiqmaydi, shuning uchun PDF uzbek + transliteratsiya bilan beriladi.
// Keyin real PDF (serverda /public/books/...) paydo bo'lsa, booksData.pdfUrl ni to'ldirib <iframe>da ochamiz.
