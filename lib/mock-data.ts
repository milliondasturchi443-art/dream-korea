// Central mock data for DREAM KOREA
export const mockUser = {
  id: "u1",
  name: "Bobur",
  fullName: "Bobur Karimov",
  email: "student@dreamkorea.uz",
  avatar: "BK",
  topikLevel: "TOPIK I",
  streak: 12,
};

export const courses = [
  {
    id: "1",
    title: "Koreys tili 1-daraja",
    subtitle: "Boshlang‘ich daraja (A1)",
    level: "A1",
    teacher: "Kim Ji-Hoon",
    lessons: 36,
    completed: 26,
    progress: 72,
    price: "890 000 so‘m",
    image: "gradient",
    color: "from-[#1e3a8a] to-[#3b82f6]",
  },
  {
    id: "2",
    title: "TOPIK I tayyorgarlik",
    subtitle: "Rasmiy imtihon uchun",
    level: "TOPIK I",
    teacher: "Lee Min-Jung",
    lessons: 35,
    completed: 19,
    progress: 54,
    price: "1 200 000 so‘m",
    image: "gradient",
    color: "from-[#0f766e] to-[#06b6d4]",
  },
  {
    id: "3",
    title: "EPS-TOPIK",
    subtitle: "Ishga joylashish uchun",
    level: "EPS",
    teacher: "Park Sang-Ho",
    lessons: 35,
    completed: 11,
    progress: 31,
    price: "950 000 so‘m",
    image: "gradient",
    color: "from-[#7c3aed] to-[#a855f7]",
  },
  {
    id: "4",
    title: "Koreys tili 2-daraja",
    subtitle: "O‘rta daraja (A2)",
    level: "A2",
    teacher: "Choi Soo-Jin",
    lessons: 40,
    completed: 0,
    progress: 0,
    price: "1 100 000 so‘m",
    image: "gradient",
    color: "from-[#be123c] to-[#f43f5e]",
  },
  {
    id: "5",
    title: "TOPIK II tayyorgarlik",
    subtitle: "Yuqori daraja",
    level: "TOPIK II",
    teacher: "Kim Ji-Hoon",
    lessons: 48,
    completed: 0,
    progress: 0,
    price: "1 500 000 so‘m",
    image: "gradient",
    color: "from-[#0c4a6e] to-[#0284c7]",
  },
  {
    id: "6",
    title: "Talaffuz va Listening",
    subtitle: "Amaliy mashg‘ulotlar",
    level: "B1",
    teacher: "Lee Min-Jung",
    lessons: 28,
    completed: 0,
    progress: 0,
    price: "750 000 so‘m",
    image: "gradient",
    color: "from-[#14532d] to-[#22c55e]",
  },
];

export const lessonsByCourse: Record<string, { id: string; title: string; duration: string; done?: boolean; locked?: boolean }[]> = {
  "1": [
    { id: "1", title: "Hangul bilan tanishuv", duration: "18 daq", done: true },
    { id: "2", title: "Unli harflar ㅏ ㅓ ㅗ ㅜ", duration: "22 daq", done: true },
    { id: "3", title: "Undosh harflar ㄱ ㄴ ㄷ", duration: "20 daq", done: true },
    { id: "4", title: "Salomlashish — 안녕하세요", duration: "15 daq", done: false },
    { id: "5", title: "O‘zini tanishtirish", duration: "19 daq", done: false },
    { id: "6", title: "Raqamlar va sana", duration: "17 daq", locked: true },
  ],
};

export const topikQuestions = [
  {
    id: 1,
    text: "다음 중 맞는 것을 고르십시오.",
    image: null,
    options: [
      { key: "A", text: "학생입니다." },
      { key: "B", text: "요리사입니다." },
      { key: "C", text: "선생님입니다." },
      { key: "D", text: "회사원입니다." },
    ],
    correct: "C",
    explanation: "Rasmdagi odam doskada yozmoqda — demak o‘qituvchi (선생님).",
  },
  {
    id: 2,
    text: "빈칸에 알맞은 것을 고르십시오: 저는 ___ 입니다.",
    options: [
      { key: "A", text: "학교" },
      { key: "B", text: "학생" },
      { key: "C", text: "책상" },
      { key: "D", text: "의자" },
    ],
    correct: "B",
    explanation: "‘저는 학생입니다’ — Men talabaman.",
  },
  {
    id: 3,
    text: "다음 대화를 읽고 질문에 답하십시오: — 안녕하세요? — 안녕하세요. 저는 민준입니다.",
    options: [
      { key: "A", text: "민준은 학생입니다." },
      { key: "B", text: "인사하는 대화입니다." },
      { key: "C", text: "학교에 갑니다." },
      { key: "D", text: "책을 읽습니다." },
    ],
    correct: "B",
    explanation: "Bu salomlashish dialogi.",
  },
];

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

export const videos = [
  { id: "1", title: "Hangul — 40 daqiqada o‘rganamiz", duration: "42:10", teacher: "Kim Ji-Hoon", views: "24K", category: "Koreys tili" },
  { id: "2", title: "TOPIK I Listening — strategiyalar", duration: "28:15", teacher: "Lee Min-Jung", views: "18K", category: "TOPIK" },
  { id: "3", title: "은/는 vs 이/가 — farqi nima?", duration: "15:40", teacher: "Park Sang-Ho", views: "31K", category: "Grammatik" },
  { id: "4", title: "Talaffuz: 쌍자음 ㅃ ㅉ ㄸ", duration: "12:05", teacher: "Choi Soo-Jin", views: "9K", category: "Talaffuz" },
];

export const demoAccounts = [
  { role: "Talaba", email: "student@dreamkorea.uz", password: "password123" },
  { role: "Ustoz", email: "teacher@dreamkorea.uz", password: "password123" },
  { role: "Admin", email: "admin@dreamkorea.uz", password: "password123" },
];
