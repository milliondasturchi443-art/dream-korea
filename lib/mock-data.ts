// Statik kontent — koreys tili bo'yicha haqiqiy materiallar (so'zlar, grammatika, kitoblar, universitetlar).
// Kurslar/testlar/materiallar/videolar — MongoDB (admin /admin/content orqali boshqaradi).

export const vocabulary = [
  { ko: "사랑", tr: "사랑 — sarang", uz: "sevgi", level: "A1" },
  { ko: "학교", tr: "hakgyo", uz: "maktab", level: "A1" },
  { ko: "친구", tr: "chingu", uz: "do‘st", level: "A1" },
  { ko: "가족", tr: "gajok", uz: "oila", level: "A1" },
  { ko: "시간", tr: "sigan", uz: "vaqt", level: "A2" },
  { ko: "열심히", tr: "yeolsimhi", uz: "tirishtirib", level: "A2" },
  { ko: "꿈", tr: "kkum", uz: "orzu", level: "A1" },
  { ko: "한국어", tr: "hangugeo", uz: "koreys tili", level: "A1" },
];

export const grammarList = [
  { id: "1", title: "입니다", desc: "Bo‘lishlik qo‘shimchasi — rasmiy uslub", level: "A1" },
  { id: "2", title: "은 / 는", desc: "Mavzu yuklamasi", level: "A1" },
  { id: "3", title: "이 / 가", desc: "Ega yuklamasi", level: "A1" },
  { id: "4", title: "을 / 를", desc: "Tushum kelishigi", level: "A1" },
  { id: "5", title: "에", desc: "O‘rin-payt kelishigi", level: "A1" },
  { id: "6", title: "에서", desc: "Chiqish / o‘rin kelishigi", level: "A2" },
  { id: "7", title: "하고", desc: "Va, bilan", level: "A1" },
  { id: "8", title: "그리고", desc: "Va (gap bog‘lovchisi)", level: "A1" },
];

export const universities = [
  { id: "1", name: "Seoul National University", city: "Seoul", programs: ["Korean Language", "Engineering", "Business"], topik: "TOPIK 4", tuition: "$4,200 / yil" },
  { id: "2", name: "Korea University", city: "Seoul", programs: ["Humanities", "Law", "Medicine"], topik: "TOPIK 4", tuition: "$5,100 / yil" },
  { id: "3", name: "Yonsei University", city: "Seoul", programs: ["Business", "Korean Studies"], topik: "TOPIK 3", tuition: "$4,800 / yil" },
  { id: "4", name: "Busan National University", city: "Busan", programs: ["Engineering", "Korean Language"], topik: "TOPIK 3", tuition: "$3,200 / yil" },
  { id: "5", name: "Inha University", city: "Incheon", programs: ["Logistics", "Engineering"], topik: "TOPIK 3", tuition: "$3,600 / yil" },
  { id: "6", name: "Kyung Hee University", city: "Seoul", programs: ["Hospitality", "Korean Language"], topik: "TOPIK 3", tuition: "$4,000 / yil" },
];

export const books = [
  { id: "1", title: "TOPIK I — Reading", level: "TOPIK I", pages: 320, color: "from-blue-600 to-indigo-600" },
  { id: "2", title: "Korean Grammar in Use — Beginner", level: "A1-A2", pages: 408, color: "from-emerald-600 to-teal-600" },
  { id: "3", title: "EPS-TOPIK Standard Textbook", level: "EPS", pages: 280, color: "from-violet-600 to-purple-600" },
  { id: "4", title: "Vocabulary 2000 — Essential Words", level: "A1-B1", pages: 360, color: "from-rose-600 to-pink-600" },
];
