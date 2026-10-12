// Grammatika — papka-papka, mavzu-mavzu. Har papka ichida mavzular, misollar, mashqlar.
export type GrammarExercise = { q: string; options: string[]; correct: number; hint?: string };
export type GrammarTopic = {
  id: string;
  title: string;
  roman?: string;
  desc: string;
  level: "A1" | "A2" | "B1";
  explain: string;
  examples: { ko: string; uz: string }[];
  exercises: GrammarExercise[];
};
export type GrammarFolder = { id: string; title: string; icon: string; desc: string; topics: GrammarTopic[] };

export const grammarFolders: GrammarFolder[] = [
  {
    id: "particles",
    title: "Yuklamalar",
    icon: "▫️",
    desc: "Koreys tilining yuragi — yuklamalarni bilmasdan gap tuzib bo'lmaydi",
    topics: [
      {
        id: "p-1", title: "은 / 는", roman: "eun / neun", desc: "Mavzu yuklamasi", level: "A1",
        explain: "Gapning mavzusini ko'rsatadi. Undosh bilan tugasa 은, unli bilan 는. Mavzuni ta'kidlash, solishtirishda ishlatiladi.",
        examples: [{ ko: "저는 학생입니다.", uz: "Men talabaman." }, { ko: "한국은 아름답습니다.", uz: "Koreya go'zal." }, { ko: "오늘은 날씨가 좋아요.", uz: "Bugun havo yaxshi." }],
        exercises: [
          { q: "저 __ 학생입니다. (to'g'risini tanlang)", options: ["는", "가", "를"], correct: 0, hint: "저 + 는" },
          { q: "이 책__ 재미있어요.", options: ["은", "는", "가"], correct: 0, hint: "책(undosh) → 은" },
        ],
      },
      {
        id: "p-2", title: "이 / 가", roman: "i / ga", desc: "Ega yuklamasi", level: "A1",
        explain: "Yangi axborot, ega (kim/nima) ni ta'kidlash. Savolga javobda ko'p ishlatiladi.",
        examples: [{ ko: "누가 왔어요? — 민수가 왔어요.", uz: "Kim keldi? — Minsu keldi." }, { ko: "비가 와요.", uz: "Yomg'ir yog'yapti." }],
        exercises: [
          { q: "누가 왔어요? — 민수__ 왔어요.", options: ["는", "가", "를"], correct: 1 },
          { q: "고양이__ 귀여워요.", options: ["는", "가", "를"], correct: 1 },
        ],
      },
      {
        id: "p-3", title: "을 / 를", roman: "eul / reul", desc: "Tushum kelishigi (obyekt)", level: "A1",
        explain: "Fe'lning obyekti (nimani). Undosh→을, unli→를.",
        examples: [{ ko: "밥을 먹어요.", uz: "Ovqat yeyapman." }, { ko: "책을 읽어요.", uz: "Kitob o'qiyapman." }, { ko: "한국어를 공부해요.", uz: "Koreys tilini o'rganaman." }],
        exercises: [
          { q: "물__ 마셔요.", options: ["을", "가", "은"], correct: 0 },
          { q: "사과__ 먹어요.", options: ["를", "가", "는"], correct: 0 },
        ],
      },
      {
        id: "p-4", title: "에", roman: "e", desc: "O'rin / payt", level: "A1",
        explain: "Qayerga, qachon: joy va vaqtni bildiradi. 학교에 가요 (maktabga boraman), 7시에 만나요 (7 da uchrashamiz).",
        examples: [{ ko: "학교에 가요.", uz: "Maktabga boraman." }, { ko: "9시에 시작해요.", uz: "Soat 9 da boshlanadi." }, { ko: "집에 있어요.", uz: "Uyda man." }],
        exercises: [
          { q: "학교__ 가요.", options: ["에", "에서", "하고"], correct: 0 },
          { q: "아침 7시__ 일어나요.", options: ["에", "에서", "를"], correct: 0 },
        ],
      },
      {
        id: "p-5", title: "에서", roman: "eseo", desc: "Harakat joyi / boshlanish", level: "A2",
        explain: "Qayerda harakat bo'layotgani, yoki qayerdan kelgani. 에서 = da (harakat).",
        examples: [{ ko: "카페에서 커피를 마셔요.", uz: "Kafeda qahva ichaman." }, { ko: "한국에서 왔어요.", uz: "Koreyadan keldim." }],
        exercises: [
          { q: "도서관__ 공부해요.", options: ["에서", "에", "를"], correct: 0 },
          { q: "부산__ 왔어요.", options: ["에서", "에", "를"], correct: 0 },
        ],
      },
      {
        id: "p-6", title: "도", roman: "do", desc: "Ham / hamda", level: "A1",
        explain: "도 = ham. Qo'shimcha, ham degan ma'noni beradi.",
        examples: [{ ko: "저도 학생입니다.", uz: "Men ham talabaman." }, { ko: "한국어도 공부해요.", uz: "Koreys tilini ham o'rganaman." }],
        exercises: [
          { q: "저__ 가고 싶어요.", options: ["도", "는", "를"], correct: 0 },
        ],
      },
    ],
  },
  {
    id: "verbs",
    title: "Fe'llar",
    icon: "▶️",
    desc: "Fe'l turlari, zamon, hurmat — hayotda eng ko'p kerak bo'ladigan qism",
    topics: [
      {
        id: "v-1", title: "입니다 / 입니까", roman: "imnida / imnikka", desc: "Rasmiy bo'lish", level: "A1",
        explain: "Ot dan keyin: 입니다 (tasdiq), 입니까 (savol). Rasmiy uslub.",
        examples: [{ ko: "저는 학생입니다.", uz: "Men talabaman." }, { ko: "학생입니까?", uz: "Talabamisan?" }, { ko: "선생님입니다.", uz: "O'qituvchi." }],
        exercises: [
          { q: "저는 의사__.", options: ["입니다", "입니까", "이에요"], correct: 0 },
          { q: "이것은 책__?", options: ["입니다", "입니까", "이에요"], correct: 1 },
        ],
      },
      {
        id: "v-2", title: "아요 / 어요", roman: "ayo / eoyo", desc: "Norasmiy hozirgi zamon", level: "A1",
        explain: "Fe'l+아요/어요 — kundalik gapda hozirgi/kelasi. 가다→가요, 먹다→먹어요, 하다→해요.",
        examples: [{ ko: "학교에 가요.", uz: "Maktabga boraman." }, { ko: "밥을 먹어요.", uz: "Ovqat yeyapman." }, { ko: "공부해요.", uz: "O'qiyapman." }],
        exercises: [
          { q: "가다 → __.", options: ["가요", "가어요", "갑니다"], correct: 0 },
          { q: "먹다 → __.", options: ["먹어요", "먹아요", "먹습니다"], correct: 0 },
        ],
      },
      {
        id: "v-3", title: "았습니다 / 었습니다", roman: "atseumnida / eosseumnida", desc: "O'tgan zamon (rasmiy)", level: "A1",
        explain: "Fe'l+았/었+습니다. 갔다 (bor dim), 먹었다 (yedim).",
        examples: [{ ko: "어제 친구를 만났습니다.", uz: "Kecha do'st bilan uchrashdim." }, { ko: "밥을 먹었습니다.", uz: "Ovqat yedim." }],
        exercises: [
          { q: "가다 (o'tgan) → __.", options: ["갔습니다", "가요", "갑니다"], correct: 0 },
          { q: "어제 영화를 ___ .", options: ["봤습니다", "봐요", "봅니다"], correct: 0 },
        ],
      },
      {
        id: "v-4", title: "고 싶다", roman: "go sipda", desc: "Xohlash", level: "A1",
        explain: "Fe'l+고 싶다 — nimadir qilishni xohlash.",
        examples: [{ ko: "한국에 가고 싶어요.", uz: "Koreyaga bormoqchiman." }, { ko: "커피를 마시고 싶어요.", uz: "Qahva ichgim kelyapti." }],
        exercises: [
          { q: "공장에서 일__ .", options: ["하고 싶어요", "하고 있어요", "할 거예요"], correct: 0 },
        ],
      },
      {
        id: "v-5", title: "(으)세요", roman: "(eu)seyo", desc: "Hurmat / iltimos", level: "A2",
        explain: "Fe'l+(으)세요 — hurmat bilan iltimos/buyruq.",
        examples: [{ ko: "앉으세요.", uz: "O'tiring (iltimos)." }, { ko: "드세요.", uz: "Yeng (hurmat)." }],
        exercises: [
          { q: "앉다 → __.", options: ["앉으세요", "앉아요", "앉습니다"], correct: 0 },
        ],
      },
    ],
  },
  {
    id: "connect",
    title: "Bog'lovchilar",
    icon: "🔗",
    desc: "Gaplarni bog'lash, sabab, qarama-qarshilik — TOPIK'da juda ko'p chiqadi",
    topics: [
      {
        id: "c-1", title: "그리고", roman: "geurigo", desc: "Va (gap boshi)", level: "A1",
        explain: "Gap boshida 'va' — keyingi fikrni qo'shish.",
        examples: [{ ko: "저는 학생입니다. 그리고 한국어를 공부합니다.", uz: "Men talabaman. Va koreys tilini o'rganaman." }],
        exercises: [
          { q: "그리고 nimani bildiradi?", options: ["Va (qo'shish)", "Lekin", "Shuning uchun"], correct: 0 },
        ],
      },
      {
        id: "c-2", title: "그래서 / 그러니까", roman: "geuraeseo", desc: "Shuning uchun", level: "A1",
        explain: "Sabab → natija: 그래서 = shuning uchun.",
        examples: [{ ko: "비가 와요. 그래서 우산을 가져가요.", uz: "Yomg'ir yog'yapti. Shuning uchun soyabon oldim." }],
        exercises: [
          { q: "비가 와요. __ 우산을 가져가요.", options: ["그래서", "그리고", "하지만"], correct: 0 },
        ],
      },
      {
        id: "c-3", title: "하지만 / 그런데", roman: "hajiman", desc: "Lekin", level: "A1",
        explain: "Qarama-qarshilik: lekin, ammo.",
        examples: [{ ko: "한국어는 어렵지만 재미있어요.", uz: "Koreys tili qiyin, lekin qiziq." }],
        exercises: [
          { q: "어렵다 __ 재미있다.", options: ["하지만", "그래서", "그리고"], correct: 0 },
        ],
      },
      {
        id: "c-4", title: "때문에 / (으)니까", roman: "ttaemune", desc: "Sabab (chunki)", level: "A2",
        explain: "Sababni ko'rsatish. 비 때문에 (yomg'ir tufayli), 피곤하니까 쉬세요 (charchagani uchun dam oling).",
        examples: [{ ko: "비 때문에 행사가 취소됐어요.", uz: "Yomg'ir tufayli tadbir bekor qilindi." }],
        exercises: [
          { q: "비 __ 행사가 취소됐어요.", options: ["때문에", "그리고", "하지만"], correct: 0 },
        ],
      },
    ],
  },
  {
    id: "honorific",
    title: "Hurmat nutqi",
    icon: "🙏",
    desc: "Koreyada hurmat — madaniyatning bir qismi; TOPIK'da tez-tez chiqadi",
    topics: [
      {
        id: "h-1", title: "시 / 으시", roman: "si", desc: "Hurmat qo'shimchasi", level: "A2",
        explain: "Fe'lga 시 qo'shilsa hurmat. 가다→가시다, 먹다→드시다.",
        examples: [{ ko: "선생님이 가십니다.", uz: "O'qituvchi ketyapti (hurmat)." }, { ko: "할머니가 진지를 드세요.", uz: "Buvi ovqat yeyapti (hurmat)." }],
        exercises: [
          { q: "선생님이 ___ . (hurmat)", options: ["가십니다", "가요", "갑니다"], correct: 0 },
        ],
      },
      {
        id: "h-2", title: "드리다 / 주다", roman: "deurida", desc: "Bermoq (hurmat)", level: "A2",
        explain: "Kichik kattaga bersa 드리다, teng yoki kattadan kichikka 주다.",
        examples: [{ ko: "선생님께 선물을 드렸어요.", uz: "O'qituvchiga sovg'a berdim." }],
        exercises: [
          { q: "선생님께 책을 ___ .", options: ["드렸어요", "줬어요", "받았어요"], correct: 0 },
        ],
      },
    ],
  },
  {
    id: "eps",
    title: "EPS uchun",
    icon: "🏭",
    desc: "Zavod, ish joyi, xavfsizlik — EPS-TOPIK'da majburiy",
    topics: [
      {
        id: "e-1", title: "아야 / 어야 하다", roman: "aya hada", desc: "-ish kerak", level: "A2",
        explain: "Majburiyat: 해야 합니다 (qilish kerak).",
        examples: [{ ko: "안전모를 써야 합니다.", uz: "Kaska kiyish kerak." }, { ko: "매일 8시간 일해야 합니다.", uz: "Har kuni 8 soat ishlash kerak." }],
        exercises: [
          { q: "안전모를 ___ .", options: ["써야 합니다", "벗어야 합니다", "버려야 합니다"], correct: 0 },
        ],
      },
      {
        id: "e-2", title: "(으)면 안 되다", roman: "myeon an doeda", desc: "Mumkin emas", level: "A2",
        explain: "Taqiq: 하면 안 됩니다 (qilsa bo'lmaydi).",
        examples: [{ ko: "여기서 담배를 피우면 안 됩니다.", uz: "Bu yerda chekish mumkin emas." }, { ko: "기계를 만지면 안 됩니다.", uz: "Mashinaga tegish mumkin emas." }],
        exercises: [
          { q: "여기서 사진을 찍__ .", options: ["으면 안 됩니다", "어야 합니다", "고 싶습니다"], correct: 0 },
        ],
      },
    ],
  },

  {
    id: "counters",
    title: "Raqamlar va hisob",
    icon: "🔢",
    desc: "Soni, necha, qancha — do'kon, ish, imtihonda har kuni kerak",
    topics: [
      { id: "n-1", title: "한 / 두 / 세 ...", roman: "han / du", desc: "O'tirgan sonlar", level: "A1",
        explain: "Bir son noaniq otdan oldin: 한 (bir), 두 (ikki), 세 (uch), 네 (to'rt), 다섯 (besh), 여섯 (olti), 일곱 (yetti), 여덟 (sakkiz), 아홉 (to'qqiz), 열 (o'n).",
        examples: [{ ko: "한 사람", uz: "bir kishi" }, { ko: "두 개", uz: "ikki ta" }, { ko: "세 권", uz: "uch dona" }],
        exercises: [{ q: "'Ikki' nima?", options: ["두", "한", "세"], correct: 0 }, { q: "'Uch' nima?", options: ["세", "두", "네"], correct: 0 }, { q: "'On' nima?", options: ["열", "한", "네"], correct: 0 }] },
      { id: "n-2", title: "개 / 명 / 분", roman: "gae / myeong", desc: "Hisoblovchi", level: "A1",
        explain: "Umumiy hisoblovchi 개 (narsa), 명/분 (odam), 병 (shisha), 자루 (quroli). Narsa turiga qarab tanlanadi.",
        examples: [{ ko: "사과 다섯 개", uz: "besh dona olma" }, { ko: "사람 세 명", uz: "uch kishi" }, { ko: "물 두 병", uz: "ikki shisha suv" }],
        exercises: [{ q: "사과 다섯 ___ .", options: ["개", "명", "분"], correct: 0 }, { q: "사람 세 ___ .", options: ["명", "개", "병"], correct: 0 }] },
      { id: "n-3", title: "얼마 / 몇", roman: "eolma", desc: "Qancha / nechta", level: "A1",
        explain: "얼마 = qancha (pul/narsa miqdori), 몇 = nechta (son so'rashda).",
        examples: [{ ko: "이거 얼마예요?", uz: "Nech pul?" }, { ko: "몇 시예요?", uz: "Soat nechada?" }, { ko: "몇 개 필요해요?", uz: "Nechta kerak?" }],
        exercises: [{ q: "물건 puli? → ___ ?", options: ["얼마", "몇", "무엇"], correct: 0 }, { q: "soat? → ___ 시?", options: ["몇", "얼마", "무엇"], correct: 0 }] },
      { id: "n-4", title: "Soni: 1-100", roman: "su", desc: "Raqam o'qish", level: "A1",
        explain: "1 하나, 2 둘, 3 셋, 4 넷, 5 다섯 ... 10 열, 20 스물, 30 서른, 40 마흔, 50 쉰, 60 예순, 70 이른, 80 여든, 90 아흔, 100 백.",
        examples: [{ ko: "스물다섯", uz: "yigirma besh" }, { ko: "서른", uz: "o'ttiz" }, { ko: "백 원", uz: "yuz von" }],
        exercises: [{ q: "20 nima?", options: ["스물", "열", "서른"], correct: 0 }, { q: "30 nima?", options: ["서른", "스물", "쉰"], correct: 0 }] },
    ],
  },
  {
    id: "time",
    title: "Vaqt va sana",
    icon: "🕐",
    desc: "Kun, oy, hafta, vaqt — suhbatning eng ko'p qismi",
    topics: [
      { id: "t-1", title: "Oylar", roman: "wol", desc: "1-12 oy", level: "A1",
        explain: "1월 일, 2월 이, 3월 삼, 4월 사, 5월 오, 6월 육, 7월 칠, 8월 팔, 9월 구, 10월 시, 11월 십일, 12월 십이.",
        examples: [{ ko: "3월에 갑니다", uz: "Mart oyida boraman" }, { ko: "12월", uz: "Dekabr" }],
        exercises: [{ q: "Mart = ?", options: ["3월", "5월", "12월"], correct: 0 }, { q: "12월 = ?", options: ["Dekabr", "Yanvar", "Noyabr"], correct: 0 }] },
      { id: "t-2", title: "Hafta kunlari", roman: "yuil", desc: "Dush-Yak", level: "A1",
        explain: "월(oy)火(wed)...: 월요일, 화요일, 수요일, 목요일, 금요일, 토요일, 일요일.",
        examples: [{ ko: "월요일에 만나요", uz: "Dushanba uchrashamiz" }, { ko: "일요일은 쉽니다", uz: "Yakshanba dam" }],
        exercises: [{ q: "Juma = ?", options: ["금요일", "목요일", "토요일"], correct: 0 }, { q: "Shanba = ?", options: ["토요일", "일요일", "금요일"], correct: 0 }] },
      { id: "t-3", title: "O'tgan / hozir / kelasi", roman: "geoseon", desc: "Zamon", level: "A1",
        explain: "어제 (kecha), 오늘 (bugun), 내일 (ertaga). 했어요 (qildim), 해요 (qilaman), 할 거예요 (qilaman).",
        examples: [{ ko: "어제 뭘 했어요?", uz: "Kecha nima qilding?" }, { ko: "내일 만나요", uz: "Ertaga uchrashamiz" }],
        exercises: [{ q: "Ertaga = ?", options: ["내일", "어제", "오늘"], correct: 0 }, { q: "Kecha = ?", options: ["어제", "오늘", "내일"], correct: 0 }] },
      { id: "t-4", title: "Onda-chora", roman: "si", desc: "Daqiqa/soat", level: "A1",
        explain: "시 (soat), 분 (daqiqa), 초 (soniya). 3시 30분 = uch yarim.",
        examples: [{ ko: "세 시 삼십 분", uz: "3:30" }, { ko: "두 시간", uz: "ikki soat" }],
        exercises: [{ q: "5 daqiqa = ?", options: ["5분", "5시", "5초"], correct: 0 }] },
    ],
  },
  {
    id: "questions",
    title: "Savol so'zlari",
    icon: "❓",
    desc: "Nima, qayer, qachon, qanday — suhbat boshlash uchun",
    topics: [
      { id: "q-1", title: "무엇 / 뭐 / 무엇을", roman: "mueot", desc: "Nima", level: "A1",
        explain: "무엇 = nima (rasmiy), 뭐 = nima (norasmiy). 무엇을/뭐를 = nimani.",
        examples: [{ ko: "무엇을 먹어요?", uz: "Nima yeysan?" }, { ko: "이게 뭐예요?", uz: "Bu nima?" }],
        exercises: [{ q: "Nima (norasmiy) = ?", options: ["뭐", "무엇", "누구"], correct: 0 }, { q: "Nimani = ?", options: ["무엇을", "어디에", "언제"], correct: 0 }] },
      { id: "q-2", title: "어디 / 어디에", roman: "eodi", desc: "Qayer", level: "A1",
        explain: "어디 = qayer, 어디에 = qayerga (maqsad), 어디서 = qayerda (harakat joyi).",
        examples: [{ ko: "어디에 살아요?", uz: "Qayerda yashaysan?" }, { ko: "어디서 일해요?", uz: "Qayerda ishlaysan?" }],
        exercises: [{ q: "Qayerda (harakat) = ?", options: ["어디서", "어디에", "언제"], correct: 0 }] },
      { id: "q-3", title: "언제 / 몇 시", roman: "eonje", desc: "Qachon", level: "A1",
        explain: "언제 = qachon (umuman), 몇 시 = soat nechada.",
        examples: [{ ko: "언제 와요?", uz: "Qachon kelasan?" }, { ko: "몇 시에 만나요?", uz: "Soat nechada uchrashamiz?" }],
        exercises: [{ q: "Soat qachon = ?", options: ["몇 시", "언제", "어디"], correct: 0 }] },
      { id: "q-4", title: "어떻게 / 왜", roman: "eotteoke", desc: "Qanday / Nega", level: "A2",
        explain: "어떻게 = qanday (usul), 왜 = nega (sabab), 누가 = kim (ega).",
        examples: [{ ko: "어떻게 가요?", uz: "Qanday boriladi?" }, { ko: "왜 안 왔어요?", uz: "Nega kelmading?" }],
        exercises: [{ q: "Nega = ?", options: ["왜", "어떻게", "무엇"], correct: 0 }] },
    ],
  },
  {
    id: "sentence",
    title: "Gap tuzilishi",
    icon: "✏️",
    desc: "Koreys gapida fe'l doim oxirida turadi — bu asosiy qoida",
    topics: [
      { id: "s-1", title: "SOV tartibi", roman: "suv", desc: "Ota-Fe'l", level: "A1",
        explain: "Koreys tilida tartib: Ota → yuklama → fe'l. 'Men maktabga boraman' = 저는 학교에 갑니다. Fe'l HAR DOIM oxirida.",
        examples: [{ ko: "저는 학교에 가요.", uz: "Men maktabga boraman." }, { ko: "친구하고 영화를 봐요.", uz: "Do'st bilan kino ko'raman." }],
        exercises: [{ q: "Fe'l qayerda turadi?", options: ["Oxirida", "Boshida", "Ortasida"], correct: 0 }, { q: "'Men yeyman' qaysi?", options: ["저는 먹어요", "먹어요 저는", "먹는 저는"], correct: 0 }] },
      { id: "s-2", title: "안 / 못", roman: "an", desc: "Nega / qila olmaslik", level: "A1",
        explain: "안 = emas (raqam qilmaslik), 못 = qila olmaslik (imkon yo'q). 안 가요 (bormayman), 못 가요 (bora olmayman).",
        examples: [{ ko: "오늘 학교에 안 가요.", uz: "Bugun maktabga bormayman." }, { ko: "한국어를 못해요.", uz: "Koreys tilini qila olmayman." }],
        exercises: [{ q: "'Qila olmayman' = ?", options: ["못", "안", "안에"], correct: 0 }, { q: "'Bormayman' = ?", options: ["안 가요", "못 가요", "가요"], correct: 0 }] },
      { id: "s-3", title: "도착 / 목적", roman: "ka", desc: "мaqsad", level: "A1",
        explain: "에 = maqsad joyi (bormoqchi). 로/으로 = orqali (yo'nalish).",
        examples: [{ ko: "회사에 갑니다", uz: "Ofisga boraman." }, { ko: "버스로 갑니다", uz: "Avtobusda boraman." }],
        exercises: [{ q: "Maqsad = ?", options: ["에", "에서", "도"], correct: 0 }] },
    ],
  },
  {
    id: "daily",
    title: "Kundalik fe'llar",
    icon: "🍳",
    desc: "Ovqat, uyqu, ish — har kuni ishlatiladigan 20+ fe'l",
    topics: [
      { id: "d-1", title: "먹다 / 마시다", roman: "meokda", desc: "Yeyish / ichish", level: "A1",
        explain: "먹다 (yeyish), 마시다 (ichish). Metni: 먹어요, 마셔요.",
        examples: [{ ko: "밥을 먹어요", uz: "Ovqat yeyaman." }, { ko: "물을 마셔요", uz: "Suv ichaman." }],
        exercises: [{ q: "Yeyish = ?", options: ["먹다", "마시다", "자다"], correct: 0 }, { q: "비빔밥을 ___ .", options: ["먹어요", "마셔요", "읽어요"], correct: 0 }] },
      { id: "d-2", title: "가다 / 오다", roman: "gada", desc: "Borish / kelish", level: "A1",
        explain: "가다 (borish), 오다 (kelish). Opposite juft.",
        examples: [{ ko: "집에 가요", uz: "Uyg'a boraman." }, { ko: "여기로 와요", uz: "Shu yerga keling." }],
        exercises: [{ q: "Kelish = ?", options: ["오다", "가다", "있다"], correct: 0 }] },
      { id: "d-3", title: "있다 / 없다", roman: "itda", desc: "Bor / yo'q", level: "A1",
        explain: "있다 = bor (joyida turish / egallash), 없다 = yo'q.",
        examples: [{ ko: "집에 사람이 있어요", uz: "Uyda odam bor." }, { ko: "시간이 없어요", uz: "Vaqt yo'q." }],
        exercises: [{ q: "'Bor' = ?", options: ["있다", "없다", "하다"], correct: 0 }] },
      { id: "d-4", title: "하다", roman: "hada", desc: "Qilish (universal)", level: "A1",
        explain: "하다 = qilish. 공부하다 (o'qish), 일하다 (ishlash), 운동하다 (sport).",
        examples: [{ ko: "공부해요", uz: "O'qiyapman." }, { ko: "한국어 공부를 해요", uz: "Koreys tilini o'rganaman." }],
        exercises: [{ q: "O'qish = ?", options: ["공부하다", "먹다", "자다"], correct: 0 }] },
      { id: "d-5", title: "자다 / 일어나다", roman: "jada", desc: "Uxlash / turish", level: "A1",
        explain: "자다 (uxlash), 일어나다 (turish), 씻다 (yuvish).",
        examples: [{ ko: "열두 시에 자요", uz: "Soat 12 da uxlayman." }, { ko: "일곱 시에 일어나요", uz: "Soat 7 da turaman." }],
        exercises: [{ q: "Turish = ?", options: ["일어나다", "자다", "쓰다"], correct: 0 }] },
    ],
  },
  {
    id: "expression",
    title: "Iltimos va madaniyat",
    icon: "🍽️",
    desc: "Restoran, do'kon, yordam so'rash — turmush uchun",
    topics: [
      { id: "x-1", title: "주세요 / 주세요", roman: "juseyo", desc: "Bering (iltimos)", level: "A1",
        explain: "Narsa + 주세요 = bering. 피자를 주세요 (pitsa bering).",
        examples: [{ ko: "물 좀 주세요", uz: "Suv bering, iltimos." }, { ko: "이걸로 주세요", uz: "Shuni bering." }],
        exercises: [{ q: "Suv bering = ?", options: ["물 주세요", "물 있어요", "물 먹어요"], correct: 0 }] },
      { id: "x-2", title: "감사합니다 / 죄송합니다", roman: "gamsahamnida", desc: "Rahmat / Kechirasiz", level: "A1",
        explain: "감사합니다 = rahmat (rasmiy), 죄송합니다/미안합니다 = kechirasiz.",
        examples: [{ ko: "정말 감사합니다", uz: "Juda rahmat." }, { ko: "죄송합니다", uz: "Kechirasiz." }],
        exercises: [{ q: "Rahmat = ?", options: ["감사합니다", "죄송합니다", "안녕하세요"], correct: 0 }] },
      { id: "x-3", title: "얼마입니까 / 계산", roman: "eolma", desc: "To'lov", level: "A2",
        explain: "계산해 주세요 = hisob bering, 카드로 = karta orqali, 영수증 = chek.",
        examples: [{ ko: "계산해 주세요", uz: "Hisob, iltimos." }, { ko: "카드로 할게요", uz: "Karta bilan to'layman." }],
        exercises: [{ q: "Hisob = ?", options: ["계산", "영수증", "카드"], correct: 0 }] },
      { id: "x-4", title: "인사 — kun boshlanishi", roman: "insa", desc: "Salomlashish", level: "A1",
        explain: "안녕하세요 (salom), 안녕 (rasmiy emas), 처음 뵙겠습니다 (birinchi tanishuv).",
        examples: [{ ko: "안녕하세요, 저는 민주예요", uz: "Salom, men Minju." }, { ko: "처음 뵙겠습니다", uz: "Birinchi tanishamiz." }],
        exercises: [{ q: "Rasmiy salom = ?", options: ["안녕하세요", "안녕", "잘자"], correct: 0 }] },
    ],
  },
];
