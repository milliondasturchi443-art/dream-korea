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

export type UniversityDetail = {
  id: string; name: string; city: string; programs: string[];
  topik: string; tuition: string; description: string;
  ranking: number; faculties: string[]; deadline: string; language: string;
  dorm: string; website: string; image: string;
};

export const universities: UniversityDetail[] = [
  { id: "1", name: "Seoul National University (SNU)", city: "Seoul", programs: ["Korean Language", "Engineering", "Business", "Medicine"], topik: "TOPIK 4", tuition: "$4,200 / yil", description: "Koreyaning #1 universiteti. QS Top 40. Kuchli tadqiqot bazasi. Chet elliklar uchun til kursi + bakalavr/magistratura.", ranking: 1, faculties: ["Humanities", "Engineering", "Medicine", "Business", "Natural Sciences"], deadline: "Mart / Sentabr", language: "Koreys / Ingliz", dorm: "Bor (oyiga ~$250)", website: "snu.ac.kr", image: "" },
  { id: "2", name: "Korea University", city: "Seoul", programs: ["Humanities", "Law", "Medicine", "Business"], topik: "TOPIK 4", tuition: "$5,100 / yil", description: "SKY uchligidan biri. Biznes va huquq kuchli. Katta stipendiya dasturlari.", ranking: 2, faculties: ["Law", "Business", "Medicine", "Korean Studies", "Engineering"], deadline: "Aprel / Oktabr", language: "Koreys / Ingliz", dorm: "Bor", website: "korea.ac.kr", image: "" },
  { id: "3", name: "Yonsei University", city: "Seoul", programs: ["Business", "Korean Studies", "Engineering", "Medicine"], topik: "TOPIK 3", tuition: "$4,800 / yil", description: "Xalqaro almashinuv kuchli. DREAM KOREA talabalarini tez-tez qabul qiladi.", ranking: 3, faculties: ["Business", "Engineering", "Korean Language", "International Studies"], deadline: "Mart / Sentabr", language: "Koreys / Ingliz", dorm: "Bor", website: "yonsei.ac.kr", image: "" },
  { id: "4", name: "Sungkyunkwan University (SKKU)", city: "Seoul", programs: ["Engineering", "Business", "Korean Language", "Design"], topik: "TOPIK 3", tuition: "$4,500 / yil", description: "Samsung homiyligida. Muhandislik va biznes top. Zamonaviy kampus.", ranking: 4, faculties: ["Engineering", "Business", "Design", "Korean Language"], deadline: "Aprel / Oktabr", language: "Koreys", dorm: "Bor", website: "skku.edu", image: "" },
  { id: "5", name: "Hanyang University", city: "Seoul", programs: ["Engineering", "Architecture", "Business"], topik: "TOPIK 3", tuition: "$4,300 / yil", description: "Muhandislik #1. Startap ekotizimi kuchli.", ranking: 5, faculties: ["Engineering", "Architecture", "Business", "Humanities"], deadline: "Mart / Sentabr", language: "Koreys", dorm: "Bor", website: "hanyang.ac.kr", image: "" },
  { id: "6", name: "Kyung Hee University", city: "Seoul", programs: ["Hospitality", "Korean Language", "Medicine"], topik: "TOPIK 3", tuition: "$4,000 / yil", description: "Turizm va mehmondo'stlik sohasida yetakchi.", ranking: 6, faculties: ["Hospitality", "Korean Language", "Medicine", "Arts"], deadline: "May / Noyabr", language: "Koreys", dorm: "Bor", website: "khu.ac.kr", image: "" },
  { id: "7", name: "Busan National University", city: "Busan", programs: ["Engineering", "Korean Language", "Business"], topik: "TOPIK 3", tuition: "$3,200 / yil", description: "Busan shahridagi davlat universiteti. Arzon kontrakt, dengiz bo'yida.", ranking: 8, faculties: ["Engineering", "Korean Language", "Business", "Natural Sciences"], deadline: "Mart / Sentabr", language: "Koreys", dorm: "Bor (arzon)", website: "pusan.ac.kr", image: "" },
  { id: "8", name: "Inha University", city: "Incheon", programs: ["Logistics", "Engineering"], topik: "TOPIK 3", tuition: "$3,600 / yil", description: "Logistika va muhandislik ixtisosligi. Aeroport yaqin.", ranking: 9, faculties: ["Logistics", "Engineering", "Business"], deadline: "Aprel / Oktabr", language: "Koreys", dorm: "Bor", website: "inha.ac.kr", image: "" },
  { id: "9", name: "Chung-Ang University (CAU)", city: "Seoul", programs: ["Film & Arts", "Business", "Korean Language"], topik: "TOPIK 3", tuition: "$4,100 / yil", description: "Kino va san'at kuchli. Ko'plab aktyorlar shu yerda o'qigan.", ranking: 7, faculties: ["Film & Arts", "Business", "Korean Language"], deadline: "Mart / Sentabr", language: "Koreys", dorm: "Bor", website: "cau.ac.kr", image: "" },
  { id: "10", name: "Sejong University", city: "Seoul", programs: ["Hotel & Tourism", "Business", "Korean Language"], topik: "TOPIK 3", tuition: "$3,800 / yil", description: "Turizm va mehmonxona ishi. Amaliyotga yo'naltirilgan.", ranking: 10, faculties: ["Hotel & Tourism", "Business", "Arts"], deadline: "Mart / Sentabr", language: "Koreys", dorm: "Bor", website: "sejong.ac.kr", image: "" },
  { id: "11", name: "Konkuk University", city: "Seoul", programs: ["Business", "Veterinary", "Korean Language"], topik: "TOPIK 3", tuition: "$3,900 / yil", description: "Biznes va veterinariya. Keng kampus, ko'l bilan.", ranking: 11, faculties: ["Business", "Veterinary", "Korean Language", "Arts"], deadline: "Aprel / Oktabr", language: "Koreys", dorm: "Bor", website: "konkuk.ac.kr", image: "" },
  { id: "12", name: "Ajou University", city: "Suwon", programs: ["Engineering", "Medicine", "Business"], topik: "TOPIK 3", tuition: "$3,700 / yil", description: "Suwon shahrida. Muhandislik va IT kuchli, Samsung bilan hamkor.", ranking: 12, faculties: ["Engineering", "IT", "Business", "Medicine"], deadline: "Mart / Sentabr", language: "Koreys / Ingliz", dorm: "Bor", website: "ajou.ac.kr", image: "" },
  { id: "13", name: "Keimyung University", city: "Daegu", programs: ["Korean Language", "Business", "Arts"], topik: "TOPIK 2-3", tuition: "$3,000 / yil", description: "Daegu shahrida — arzon variant. Til kursi arzon va samarali.", ranking: 15, faculties: ["Korean Language", "Business", "Arts"], deadline: "Har chorak", language: "Koreys", dorm: "Bor (juda arzon)", website: "kmu.ac.kr", image: "" },
  { id: "14", name: "Chonnam National University", city: "Gwangju", programs: ["Korean Language", "Engineering", "Agriculture"], topik: "TOPIK 3", tuition: "$2,900 / yil", description: "Davlat universiteti, kontrakt eng arzonlardan. Qishloq xo'jaligi kuchli.", ranking: 13, faculties: ["Engineering", "Korean Language", "Agriculture"], deadline: "Mart / Sentabr", language: "Koreys", dorm: "Bor", website: "jnu.ac.kr", image: "" },
  { id: "15", name: "Pusan National University (PNU)", city: "Busan", programs: ["Korean Language", "Engineering", "Medicine"], topik: "TOPIK 3", tuition: "$3,300 / yil", description: "PNU — Busan milliy universiteti, davlat. Dengiz manzarasi.", ranking: 8, faculties: ["Engineering", "Medicine", "Korean Language"], deadline: "Mart / Sentabr", language: "Koreys", dorm: "Bor", website: "pusan.ac.kr", image: "" },
  { id: "16", name: "Dankook University", city: "Yongin / Cheonan", programs: ["Architecture", "Korean Language", "Business"], topik: "TOPIK 3", tuition: "$3,800 / yil", description: "Arxitektura va dizayn. Ikkita kampus: Yongin va Cheonan.", ranking: 14, faculties: ["Architecture", "Design", "Business", "Korean Language"], deadline: "Aprel / Oktabr", language: "Koreys", dorm: "Bor", website: "dankook.ac.kr", image: "" },
  { id: "17", name: "Hankuk University of Foreign Studies (HUFS)", city: "Seoul", programs: ["Korean Language", "Translation", "International Studies"], topik: "TOPIK 3", tuition: "$4,000 / yil", description: "Tillar universiteti — tarjimonlik va xalqaro aloqalar uchun ideal.", ranking: 6, faculties: ["Translation", "Korean Language", "International Studies"], deadline: "Mart / Sentabr", language: "Koreys / Ingliz", dorm: "Bor", website: "hufs.ac.kr", image: "" },
  { id: "18", name: "Kookmin University", city: "Seoul", programs: ["Design", "Engineering", "Business"], topik: "TOPIK 3", tuition: "$3,600 / yil", description: "Dizayn va avtomobilsozlik (Hyundai/Kia hamkor).", ranking: 11, faculties: ["Design", "Engineering", "Business"], deadline: "Mart / Sentabr", language: "Koreys", dorm: "Bor", website: "kookmin.ac.kr", image: "" },
];

export const books = [
  { id: "1", title: "TOPIK I — Reading", level: "TOPIK I", pages: 320, color: "from-blue-600 to-indigo-600" },
  { id: "2", title: "Korean Grammar in Use — Beginner", level: "A1-A2", pages: 408, color: "from-emerald-600 to-teal-600" },
  { id: "3", title: "EPS-TOPIK Standard Textbook", level: "EPS", pages: 280, color: "from-violet-600 to-purple-600" },
  { id: "4", title: "Vocabulary 2000 — Essential Words", level: "A1-B1", pages: 360, color: "from-rose-600 to-pink-600" },
];
