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
];
