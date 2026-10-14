// Haqiqiy kitoblar — public/books ichidagi siqilgan PDF'lar.
export type BookCategory = "TOPIK" | "Darslik" | "Ishchi daftar" | "O'qish";

export type Book = {
  id: string;
  title: string;
  subtitle: string;
  category: BookCategory;
  level: string;
  pages: number;
  sizeMb: number;
  color: string;
  code: string;
  description: string;
  file: string;
};

export const BOOK_CATEGORIES: BookCategory[] = ["TOPIK", "Darslik", "Ishchi daftar", "O'qish"];

// Kitob kartochkasining gradient ranglari (admin tanlaydi, server tekshiradi)
export const BOOK_COLORS: string[] = [
  "from-blue-700 to-indigo-800",
  "from-blue-600 to-indigo-700",
  "from-rose-600 to-pink-700",
  "from-rose-500 to-red-600",
  "from-amber-600 to-orange-700",
  "from-orange-500 to-rose-600",
  "from-emerald-600 to-teal-700",
  "from-green-600 to-emerald-700",
  "from-lime-600 to-green-700",
  "from-teal-600 to-cyan-700",
  "from-cyan-600 to-blue-700",
  "from-violet-600 to-purple-700",
  "from-purple-600 to-indigo-700",
  "from-fuchsia-600 to-pink-700",
];

export const booksData: Book[] = [
  {
    id: "esp-topik", title: "EPS-TOPIK imtihonga tayyorgarlik", subtitle: "esp topik · ishchi uchun to'liq kurs",
    category: "TOPIK", level: "TOPIK I (EPS)", pages: 388, sizeMb: 21.9,
    color: "from-blue-700 to-indigo-800", code: "EP",
    description: "EPS-TOPIK imtihonining barcha bo'limlari: o'qish, tinglash, lug'at va amaliy mashqlar.",
    file: "/books/esp-topik-tayyorgarlik.pdf",
  },
  {
    id: "all-about-writing", title: "All about Writing — F-TOPIK", subtitle: "yozish bo'yicha to'liq qo'llanma",
    category: "TOPIK", level: "TOPIK I", pages: 301, sizeMb: 41.4,
    color: "from-rose-600 to-pink-700", code: "WR",
    description: "F-TOPIK yozish bo'limi: namunalar, shablonlar va mashq savollari bilan.",
    file: "/books/all-about-writing-topik.pdf",
  },
  {
    id: "haggyeok-recipe", title: "합격 레시피 · Imtihon retsepti", subtitle: "TOPIK uchun sinalgan strategiya",
    category: "TOPIK", level: "TOPIK I-II", pages: 289, sizeMb: 39.9,
    color: "from-amber-600 to-orange-700", code: "RC",
    description: "Imtihonda o'tish «retsepti»: vaqt boshqaruvi, xatolar tahlili va top strategiyalar.",
    file: "/books/haggyeok-recipe.pdf",
  },
  {
    id: "seoul-2a", title: "Seoul Darsligi · Student's Book 2A", subtitle: "서울대 한국어 2A",
    category: "Darslik", level: "TOPIK I-III", pages: 227, sizeMb: 28.7,
    color: "from-emerald-600 to-teal-700", code: "2A",
    description: "Seoul National University darsligi — 2A daraja, dialoglar, grammatika va mashqlar.",
    file: "/books/seoul-student-2a.pdf",
  },
  {
    id: "seoul-2b", title: "Seoul Darsligi · Student's Book 2B", subtitle: "서울대 한국어 2B",
    category: "Darslik", level: "TOPIK I-III", pages: 228, sizeMb: 28.4,
    color: "from-teal-600 to-cyan-700", code: "2B",
    description: "2B davomi: kundalik mavzular, tinglash mashqlari va suhbatlar.",
    file: "/books/seoul-student-2b.pdf",
  },
  {
    id: "seoul-3a", title: "Seoul Darsligi · Student's Book 3A", subtitle: "서울대 한국어 3A",
    category: "Darslik", level: "TOPIK II", pages: 232, sizeMb: 29.8,
    color: "from-violet-600 to-purple-700", code: "3A",
    description: "O'rta daraja: murakkab grammatika, maqolalar va fikr bildirish mashqlari.",
    file: "/books/seoul-student-3a.pdf",
  },
  {
    id: "seoul-3b", title: "Seoul Darsligi · Student's Book 3B", subtitle: "서울대 한국어 3B",
    category: "Darslik", level: "TOPIK II", pages: 228, sizeMb: 29.0,
    color: "from-fuchsia-600 to-pink-700", code: "3B",
    description: "3B davomi: akademik matnlar, munozara va yuqori daraja lug'ati.",
    file: "/books/seoul-student-3b.pdf",
  },
  {
    id: "workbook-2a", title: "Seoul Ishchi Daftari 2A", subtitle: "서울대 연습장 2A",
    category: "Ishchi daftar", level: "TOPIK I-III", pages: 204, sizeMb: 24.6,
    color: "from-lime-600 to-green-700", code: "W2A",
    description: "2A darsligiga mos yozma mashqlar, so'z biriktirish va grammatika drill.",
    file: "/books/seoul-workbook-2a.pdf",
  },
  {
    id: "workbook-2b", title: "Seoul Ishchi Daftari 2B", subtitle: "서울대 연습장 2B",
    category: "Ishchi daftar", level: "TOPIK I-III", pages: 207, sizeMb: 25.7,
    color: "from-green-600 to-emerald-700", code: "W2B",
    description: "2B konsolidatsiya: gap tuzish, matn yozish va takrorlash mashqlari.",
    file: "/books/seoul-workbook-2b.pdf",
  },
  {
    id: "workbook-3a", title: "Seoul Ishchi Daftari 3A", subtitle: "서울대 연습장 3A",
    category: "Ishchi daftar", level: "TOPIK II", pages: 198, sizeMb: 24.1,
    color: "from-cyan-600 to-blue-700", code: "W3A",
    description: "3A daraja mashqlari: murakkab gaplar, xatolar tahlili va yozma ishlar.",
    file: "/books/seoul-workbook-3a.pdf",
  },
  {
    id: "workbook-3b", title: "Seoul Ishchi Daftari 3B", subtitle: "서울대 연습장 3B",
    category: "Ishchi daftar", level: "TOPIK II", pages: 193, sizeMb: 24.2,
    color: "from-blue-600 to-indigo-700", code: "W3B",
    description: "3B yakuniy mustahkamlash: imtihon uslubidagi qo'shimcha savollar.",
    file: "/books/seoul-workbook-3b.pdf",
  },
  {
    id: "culture-reading-1", title: "Madaniyat bilan o'qish 1", subtitle: "문화가 있는 한국어 읽기 1",
    category: "O'qish", level: "TOPIK I-II", pages: 185, sizeMb: 12.4,
    color: "from-orange-500 to-rose-600", code: "C1",
    description: "Qisqa hikoyalar va maqolalar orqali koreys madaniyati bilan birga o'qish mahorati.",
    file: "/books/culture-reading-1.pdf",
  },
  {
    id: "culture-reading-2", title: "Madaniyat bilan o'qish 2", subtitle: "문화가 있는 한국어 읽기 2",
    category: "O'qish", level: "TOPIK I-II", pages: 198, sizeMb: 14.4,
    color: "from-rose-500 to-red-600", code: "C2",
    description: "Ikkilamchi daraja matnlari: an'analar, hayot va zamonaviy Koreya.",
    file: "/books/culture-reading-2.pdf",
  },
  {
    id: "culture-reading-3", title: "Madaniyat bilan o'qish 3", subtitle: "문화가 있는 한국어 읽기 3",
    category: "O'qish", level: "TOPIK II", pages: 189, sizeMb: 13.9,
    color: "from-purple-600 to-indigo-700", code: "C3",
    description: "Yuqori o'rta matnlar: tafakkur, munozara va chuqur tushunish uchun o'qishlar.",
    file: "/books/culture-reading-3.pdf",
  },
];
