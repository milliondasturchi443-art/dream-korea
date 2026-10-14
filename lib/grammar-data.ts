// Grammatika — papka-papka, mavzu-mavzu. Har papkada: formulа, izoh, misollar, xato, mashq.
export type GrammarExercise = { q: string; options: string[]; correct: number; hint?: string };
export type GrammarExample = { ko: string; uz: string };
export type GrammarTopic = {
  id: string;
  title: string;
  roman?: string;
  desc: string;
  level: "A1" | "A2" | "B1";
  /** Qoidaning formulasi — masalan "N + 은/는" */
  pattern: string;
  /** Qisqa, tushunarli izoh */
  explain: string;
  examples: GrammarExample[];
  /** Ko'p uchraydigan xato */
  mistake?: string;
  exercises: GrammarExercise[];
};
export type GrammarFolder = {
  id: string;
  title: string;
  icon: string;
  desc: string;
  accent: string;
  soft: string;
  topics: GrammarTopic[];
};

export const grammarFolders: GrammarFolder[] = [
  {
    id: "particles",
    title: "Yuklamalar",
    icon: "Y",
    desc: "Gapning suyagi — 6 ta asosiy yuklama",
    accent: "#2563eb",
    soft: "#eff6ff",
    topics: [
      {
        id: "p-1", title: "은 / 는", roman: "eun / neun", desc: "Mavzu yuklamasi", level: "A1",
        pattern: "Noun + 은 (unlisiz) / 는 (unli bilan)",
        explain: "Gapda nima haqida aytilayotganini ko'rsatadi — «mavzu». Undosh harf bilan tugasa 은, unli bilan 는. Gapni solishtirishda yoki mavzuni ajratishda ishlatiladi.",
        examples: [
          { ko: "저는 학생입니다.", uz: "Men talabaman." },
          { ko: "한국은 아름답습니다.", uz: "Koreya go'zal." },
          { ko: "오늘은 날씨가 좋아요.", uz: "Bugun havo yaxshi." },
        ],
        mistake: "«저는» va «한국은» — bitta harfni unutib qoldirmang: 저는 / 한국은.",
        exercises: [
          { q: "저 __ 학생입니다.", options: ["가", "는", "를"], correct: 1, hint: "저 (unli) → 는" },
          { q: "이 책__ 재미있어요.", options: ["은", "가", "는"], correct: 0, hint: "책 (undosh) → 은" },
          { q: "오늘__ 비가 와요.", options: ["에", "을", "는"], correct: 2 },
        ],
      },
      {
        id: "p-2", title: "이 / 가", roman: "i / ga", desc: "Ega yuklamasi (yangi axborot)", level: "A1",
        pattern: "Noun + 이 (unlisiz) / 가 (unli bilan)",
        explain: "«Kim? Nima?» degan savolga javob beradi va YANGI axborotni keltiradi. ism undosh bilan tugasa 이, unli bilan 가.",
        examples: [
          { ko: "누가 왔어요? — 민수가 왔어요.", uz: "Kim keldi? — Minsu keldi." },
          { ko: "비가 와요.", uz: "Yomg'ir yog'yapti." },
          { ko: "고양이가 귀여워요.", uz: "Mushuk yoqqan." },
        ],
        mistake: "Mavzu (은/는) — eski gap, ega (이/가) — yangi gap. «민수가 왔어요» to'g'ri, «민수는 왔어요» faqat solishtirishda.",
        exercises: [
          { q: "누가 왔어요? — 민수__ 왔어요.", options: ["가", "는", "를"], correct: 0, hint: "Yangi axborot → 가" },
          { q: "고양이__ 귀여워요.", options: ["을", "가", "는"], correct: 1, hint: "고양이 (unli) → 가" },
          { q: "어디__ 우산이 있어요?", options: ["가", "를", "은"], correct: 0 },
        ],
      },
      {
        id: "p-3", title: "을 / 를", roman: "eul / reul", desc: "Tushum (obyekt) — nimani?", level: "A1",
        pattern: "Noun + 을 (unlisiz) / 를 (unli bilan)",
        explain: "Fe'l nima ustida qilinganini bildiradi — «nimani». Undosh → 을, unli → 를. Odatda fe'ldan OLDIN turadi.",
        examples: [
          { ko: "밥을 먹어요.", uz: "Ovqat yeyapman." },
          { ko: "책을 읽어요.", uz: "Kitob o'qiyapman." },
          { ko: "한국어를 공부해요.", uz: "Koreys tilini o'rganaman." },
        ],
        mistake: "Yuklamani OXIRIDA qo'ymang: 「밥을 먹어요」 to'g'ri, 「먹어요 밥을」 emas.",
        exercises: [
          { q: "물__ 마셔요.", options: ["을", "은", "가"], correct: 0 },
          { q: "사과__ 먹어요.", options: ["를", "는", "가"], correct: 0, hint: "사과 (unli) → 를" },
          { q: "한국어__ 공부해요.", options: ["를", "에", "이"], correct: 0 },
        ],
      },
      {
        id: "p-4", title: "에", roman: "e", desc: "Qayerga / qachon — maqsad", level: "A1",
        pattern: "Noun + 에 (joy yoki vaqt)",
        explain: "QAYERGA bormoqchi yoki QACHON bo'layotganini bildiradi (maqsad, joy, vaqt). Harakat bor joyi uchun 에서 ishlatiladi — aralashtirmang.",
        examples: [
          { ko: "학교에 가요.", uz: "Maktabga boraman." },
          { ko: "9시에 시작해요.", uz: "Soat 9 da boshlanadi." },
          { ko: "집에 있어요.", uz: "Uydamiz." },
        ],
        mistake: "에 = qayerga (maqsad), 에서 = qayerda (harakat joyi). 「학교에서 공부해요」 — maktabda o'qiyman.",
        exercises: [
          { q: "학교__ 가요.", options: ["에서", "에", "를"], correct: 1, hint: "Bormoqchi → maqsad → 에" },
          { q: "아침 7시__ 일어나요.", options: ["를", "에서", "에"], correct: 2 },
          { q: "집__ 있어요.", options: ["에서", "도", "에"], correct: 2 },
        ],
      },
      {
        id: "p-5", title: "에서", roman: "eseo", desc: "Qayerda harakat / qayerdan", level: "A2",
        pattern: "Noun + 에서 (joyda harakat) / 에서 + 오다 (kelish)",
        explain: "Ikki ma'no: 1) qayerda biror ish bo'layotgani (도서관에서 공부 — kutubxonada o'qish); 2) qayerdan kelgan (한국에서 왔어요 — Koreyadan keldim).",
        examples: [
          { ko: "카페에서 커피를 마셔요.", uz: "Kafeda qahva ichaman." },
          { ko: "한국에서 왔어요.", uz: "Koreyadan keldim." },
          { ko: "회사에서 일해요.", uz: "Ofisda ishlayman." },
        ],
        mistake: "Faol joy uchun 에서, tinch joy (maqsad) uchun 에: 「집에 가요」 (uyga boraman), «집에서 쉬어요» (uyda dam olaman).",
        exercises: [
          { q: "도서관__ 공부해요.", options: ["에", "에서", "를"], correct: 1, hint: "O'qish harakati → 에서" },
          { q: "부산__ 왔어요.", options: ["를", "에서", "에"], correct: 1 },
          { q: "지금 회사__ 있어요.", options: ["에서", "도", "을"], correct: 0 },
        ],
      },
      {
        id: "p-6", title: "도", roman: "do", desc: "Ham — qo'shish", level: "A1",
        pattern: "Noun + 도",
        explain: "«Ham», «hamda» ma'nosini beradi — avval aytilgan narsaga qo'shadi. Boshqa yuklamalar joyiga keladi.",
        examples: [
          { ko: "저도 학생입니다.", uz: "Men ham talabaman." },
          { ko: "한국어도 공부해요.", uz: "Koreys tilini ham o'rganaman." },
          { ko: "커피도 마셔요.", uz: "Qahva ham ichaman." },
        ],
        mistake: "Bitta yuklama joyiga ikkitasini qo'ymang: 「저도는」 emas, «저도».",
        exercises: [
          { q: "저__ 가고 싶어요.", options: ["를", "도", "는"], correct: 1 },
          { q: "저는 학생입니다. 민수__ 학생입니다.", options: ["도", "는", "을"], correct: 0, hint: "Qo'shish → 도" },
          { q: "물__ 마셔요. 커피__ 마셔요.", options: ["가", "에", "도"], correct: 2 },
        ],
      },
    ],
  },
  {
    id: "verbs",
    title: "Fe'llar",
    icon: "F",
    desc: "Zamon, xohlash, iltimos — har kuni kerak",
    accent: "#7c3aed",
    soft: "#f5f3ff",
    topics: [
      {
        id: "v-1", title: "입니다 / 입니까", roman: "imnida / imnikka", desc: "Rasmiy «-dir»", level: "A1",
        pattern: "Noun + 입니다 (javob) / Noun + 입니까? (savol)",
        explain: "Ot dan keyin «-dir» degan ma'no beradi (rasmiy uslub). Savolda ㅂ ni o'zgartirib 입니까 qilamiz. So'z undosh bilan tugasa 입니다, unli bilan 이에요/예요 (norasmiy).",
        examples: [
          { ko: "저는 학생입니다.", uz: "Men talabaman." },
          { ko: "학생입니까?", uz: "Talabamisan?" },
          { ko: "선생님이에요.", uz: "O'qituvchi (norasmiy)." },
        ],
        mistake: "Rasmiy savolni «입니까?» bilan so'rang — «입니다?» emas.",
        exercises: [
          { q: "저는 의사__.", options: ["이에요", "입니까", "입니다"], correct: 2 },
          { q: "이것은 책__?", options: ["입니까", "이예요", "입니다"], correct: 0 },
          { q: "민수는 학생이에요 = rasmiy: 민수는 학생__.", options: ["어요", "니까", "입니다"], correct: 2 },
        ],
      },
      {
        id: "v-2", title: "아요 / 어요", roman: "ayo / eoyo", desc: "Norasmiy hozirgi zamon", level: "A1",
        pattern: "Verb stem + 아요 (osa unli) / 어요 (qolganlari)",
        explain: "Kundalik gapda ishlatiladigan «-aman / -yapman». Yumshoq unli (ㅗ, ㅏ) bilan tugagan bo'lsa 아요, qolganlari 어요. 하다 → 해요, 가다 → 가요, 먹다 → 먹어요.",
        examples: [
          { ko: "학교에 가요.", uz: "Maktabga boraman." },
          { ko: "밥을 먹어요.", uz: "Ovqat yeyapman." },
          { ko: "한국어를 공부해요.", uz: "Koreys tilini o'rganaman." },
        ],
        mistake: "하다 qisqa shakli — 해요 (ha + eyo emas).",
        exercises: [
          { q: "가다 → __.", options: ["가요", "가어요", "갑니다"], correct: 0, hint: "ㅏ → 아요" },
          { q: "먹다 → __.", options: ["먹습니다", "먹어요", "먹아요"], correct: 1, hint: "ㅗ dan boshqa → 어요" },
          { q: "하다 → __.", options: ["합니다", "하아요", "해요"], correct: 2 },
        ],
      },
      {
        id: "v-3", title: "았습니다 / 었습니다", roman: "at-seumnida", desc: "O'tgan zamon (rasmiy)", level: "A1",
        pattern: "Verb stem + 았/었습니다 (rasmiy) / 았/었어요 (norasmiy)",
        explain: "O'tgan qilingan ishni bildiradi.osa unli bilan 았, qolgani 었. 조음 va hokazo aralashmasi paytida ㅆ bo'ladi (갔습니다).",
        examples: [
          { ko: "어제 친구를 만났습니다.", uz: "Kecha do'stim bilan uchrashdim." },
          { ko: "밥을 먹었습니다.", uz: "Ovqat yedim." },
          { ko: "한국에 갔어요.", uz: "Koreyaga bordim." },
        ],
        mistake: "가다 → 갔습니다 (ㅆ paydo bo'ladi), «가았습니다» emas.",
        exercises: [
          { q: "가다 (o'tgan, rasmiy) → __.", options: ["갔습니다", "가요", "갑니다"], correct: 0 },
          { q: "어제 영화를 ___ .", options: ["봤습니다", "봅니다", "봐요"], correct: 0, hint: "보다 → 봤습니다" },
          { q: "먹다 (norasmiy o'tgan) → __.", options: ["먹어요", "먹습니다", "먹었어요"], correct: 2 },
        ],
      },
      {
        id: "v-4", title: "고 싶다", roman: "go sipda", desc: "Xohlash — -moqchiman", level: "A1",
        pattern: "Verb stem + 고 싶다 / 고 싶어요",
        explain: "«-moqchiman», «-moqchisan» ma'nosini beradi. Fa'ol ishlar bilan to'g'ridan-to'g'ri ishlatiladi.",
        examples: [
          { ko: "한국에 가고 싶어요.", uz: "Koreyaga bormoqchiman." },
          { ko: "커피를 마시고 싶어요.", uz: "Qahva ichgim kelyapti." },
          { ko: "바다에서 일하고 싶어요.", uz: "Dengizda ishlamoqchiman." },
        ],
        mistake: "Otdan keyin emas — FE'L + 고 싶다: 「카페고 싶다」 emas, 「가고 싶다」.",
        exercises: [
          { q: "공장에서 일__ .", options: ["하고 있어요", "하고 싶어요", "할 거예요"], correct: 1 },
          { q: "한국에 __ .", options: ["가고 싶어요", "가고 있습니다", "가서 싶어요"], correct: 0 },
          { q: "물을 __ .", options: ["마셔요", "마시고 싶어요", "마십니다"], correct: 1 },
        ],
      },
      {
        id: "v-5", title: "(으)세요", roman: "(eu)seyo", desc: "Hurmatli iltimos / buyruq", level: "A2",
        pattern: "Verb stem + (으)세요 — osa unlidan keyin 세요, qolgani 으세요",
        explain: "«-ing (iltimos)» degan hurmatli buyruq. ㅗ/ㅏ bilan tugaganda 세요, qolganlarda 으세요. Kishini hurmatlashda ham ishlatiladi.",
        examples: [
          { ko: "앉으세요.", uz: "O'tiring (iltimos)." },
          { ko: "드세요.", uz: "Yeng (hurmat bilan)." },
          { ko: "여기 보세요.", uz: "Bu yerga qarang." },
        ],
        mistake: "Unli: 앉으세요 (으 kesilmaydi), «앉세요» emas.",
        exercises: [
          { q: "앉다 → __.", options: ["앉습니다", "앉아요", "앉으세요"], correct: 2 },
          { q: "먹다 (hurmat) → __.", options: ["드세요", "먹습니다", "먹어요"], correct: 0 },
          { q: "오다 → __.", options: ["오세요", "오으세요", "옵니다"], correct: 0 },
        ],
      },
    ],
  },
  {
    id: "connect",
    title: "Bog'lovchilar",
    icon: "🔗",
    desc: "Va, sabab, lekin — gaplarni bog'lang",
    accent: "#059669",
    soft: "#ecfdf5",
    topics: [
      {
        id: "c-1", title: "그리고", roman: "geuri-go", desc: "Va (gap boshi)", level: "A1",
        pattern: "Gap 1. 그리고 Gap 2.",
        explain: "Ikkita fikrni qo'shishda «va». Gap boshida turadi; o'rtada qo'shib boradi.",
        examples: [
          { ko: "저는 학생입니다. 그리고 한국어를 공부합니다.", uz: "Men talabaman. Va koreys tilini o'rganaman." },
          { ko: "아침에 빵을 먹어요. 그리고 우유를 마셔요.", uz: "Ertalab non yeyman va sut ichaman." },
        ],
        mistake: "Bir gap ichida «va» = -고 ham bo'ladi: 「빵을 먹고 우유를 마셔요».",
        exercises: [
          { q: "그리고 nimani bildiradi?", options: ["Lekin", "Shuning uchun", "Va (qo'shish)"], correct: 2 },
          { q: "나는 학생이다. __ 한국어를 배운다.", options: ["하지만", "그래서", "그리고"], correct: 2 },
          { q: "「Va» = ?", options: ["하지만", "그리고", "그래서"], correct: 1 },
        ],
      },
      {
        id: "c-2", title: "그래서", roman: "geu-rae-seo", desc: "Shuning uchun (natija)", level: "A1",
        pattern: "Sabab gap. 그래서 Natija gap.",
        explain: "Oldingi sababdan kelib chiqadigan NATIJANI aytadi — «shuning uchun». Sabab → natija tartibida ishlatiladi.",
        examples: [
          { ko: "비가 와요. 그래서 우산을 가져가요.", uz: "Yomg'ir yog'yapti. Shuning uchun soyabon olib ketyapman." },
          { ko: "피곤해요. 그래서 일찍 자요.", uz: "Charchadim. Shuning uchun erta uxlayman." },
        ],
        mistake: "Natijani sababdan keyin qo'ymang: 「그래서 비가 와요» emas (bu notog'ri sabab-natija).",
        exercises: [
          { q: "비가 와요. __ 우산을 가져가요.", options: ["그래서", "하지만", "그리고"], correct: 0 },
          { q: "「Shuning uchun» = ?", options: ["그래서", "하지만", "그리고"], correct: 0 },
          { q: "시험을 못 봤어요. __ 집에서 공부해요.", options: ["그리고", "그래서", "그런데"], correct: 1 },
        ],
      },
      {
        id: "c-3", title: "하지만 / 그런데", roman: "ha-ji-man", desc: "Lekin, ammo", level: "A1",
        pattern: "Gap 1. 하지만 / 그런데 Gap 2. (qarama-qarshilik)",
        explain: "Kutilmagan yoki teskari fikrni bildiradi. 하지만 — kuchli «lekin», 그런데 — yumshoqroq «biroq / gap qoldi». TOPIK'da tez-tez chiqadi.",
        examples: [
          { ko: "한국어는 어렵지만 재미있어요.", uz: "Koreys tili qiyin, lekin qiziq." },
          { ko: "옷을 샀어요. 그런데 너무 비쌌어요.", uz: "Kiyim oldim. Biroq juda qimmat bo'ldi." },
        ],
        mistake: "하지만 — gap boshida, -지만 — fe'l orasida. Bir xil ma'no, boshqacha shakl.",
        exercises: [
          { q: "어렵다 __ 재미있다.", options: ["그리고", "하지만", "그래서"], correct: 1 },
          { q: "「Lekin» = ?", options: ["때문에", "하지만", "그래서"], correct: 1 },
          { q: "돈이 있어요. __ 못 사요.", options: ["하지만", "그래서", "그리고"], correct: 0 },
        ],
      },
      {
        id: "c-4", title: "때문에 / (으)니까", roman: "ttae-mu-ne", desc: "Sabab — chunki", level: "A2",
        pattern: "Noun + 때문에 / Adjective·Verb + (으)니까",
        explain: "Sababni ko'rsatadi. Otdan keyin 때문에, fe'l/adjective dan keyin (으)니까. «Chunki» ma'nosida gap boshida ham keladi.",
        examples: [
          { ko: "비 때문에 행사가 취소됐어요.", uz: "Yomg'ir tufayli tadbir bekor qilindi." },
          { ko: "피곤하니까 쉬세요.", uz: "Charchagani uchun dam oling." },
        ],
        mistake: "Otdan keyin (으)니까 emas: 「비 때문에」 to'g'ri, «비이니까» emas.",
        exercises: [
          { q: "비 __ 행사가 취소됐어요.", options: ["그리고", "때문에", "하지만"], correct: 1, hint: "Otdan keyin → 때문에" },
          { q: "피곤하__ 일찍 자요.", options: ["고", "니까", "지만"], correct: 1 },
          { q: "「Chunki» = ?", options: ["하지만", "때문에", "그래서"], correct: 1 },
        ],
      },
    ],
  },
  {
    id: "honorific",
    title: "Hurmat nutqi",
    icon: "🙏",
    desc: "Koreys madaniyati — hurmat qo'shimchalari",
    accent: "#d97706",
    soft: "#fffbeb",
    topics: [
      {
        id: "h-1", title: "시 / 으시", roman: "si", desc: "Hurmat qo'shimchasi", level: "A2",
        pattern: "Verb stem + 시 / 으시",
        explain: "Kattaga, mehmonga yoki faxriy kishiga nisbatan hurmat bildiradi. ㅗ/ㅏ dan keyin 시, qolgani 으시. о'zga fe'lda ham paydo bo'ladi: 가다→가시다.",
        examples: [
          { ko: "선생님이 가십니다.", uz: "O'qituvchi ketyapti (hurmat)." },
          { ko: "할머니가 진지를 드세요.", uz: "Buvi ovqat yeyapti (hurmat)." },
          { ko: "이게 무슨 책이십니까?", uz: "Bu qanday kitob (hurmat)?" },
        ],
        mistake: "Kichik do'stingizga 시 qo'ymang — quruq bo'lib tuyuladi.",
        exercises: [
          { q: "선생님이 ___ . (hurmat)", options: ["갑니다", "가요", "가십니다"], correct: 2 },
          { q: "할머니가 밥을 ___ .", options: ["먹어요", "드세요", "먹습니다"], correct: 1 },
          { q: "가다 + hurmat → __.", options: ["가지다", "가니다", "가시다"], correct: 2 },
        ],
      },
      {
        id: "h-2", title: "드리다 / 주다", roman: "deu-ri-da", desc: "Bermoq (hurmat vs oddiy)", level: "A2",
        pattern: "Kichik → katta: 주다 + 드리다 (드리다) / Teng yoki kattadan kichikka: 주다",
        explain: "Biror narsa berish. Kimdan kimkaga qarab tanlanadi: kichik kattaga bersa 드리다 (beraman → 드렸어요), teng yoki kattadan kattadan kichikka bersa 주다.",
        examples: [
          { ko: "선생님께 선물을 드렸어요.", uz: "O'qituvchiga sovg'a berdim." },
          { ko: "친구에게 책을 줬어요.", uz: "Do'stimga kitob berdim." },
          { ko: "물 좀 주세요.", uz: "Suv bering (iltimos)." },
        ],
        mistake: "Do'stingizga 「드렸어요» demang — ko'pincha kulgili eshitiladi.",
        exercises: [
          { q: "선생님께 책을 ___ .", options: ["줬어요", "드렸어요", "받았어요"], correct: 1 },
          { q: "친구에게 사과를 ___ .", options: ["줬어요", "드렸어요", "왔어요"], correct: 0 },
          { q: "「Beraman (hurmat)» = ?", options: ["드립니다", "줍니다", "받습니다"], correct: 0 },
        ],
      },
    ],
  },
  {
    id: "eps",
    title: "EPS uchun",
    icon: "E",
    desc: "Zavod, xavfsizlik, buyruq — EPS-TOPIK majburiy",
    accent: "#dc2626",
    soft: "#fef2f2",
    topics: [
      {
        id: "e-1", title: "아야 / 어야 하다", roman: "a-ya ha-da", desc: "Majburiyat — qilish kerak", level: "A2",
        pattern: "Verb stem + 아야/어야 합니다 (rasmiy) / 해요 (norasmiy)",
        explain: "«Qilish shart», «kerak». ㅗ/ㅏ dan keyin 아야, qolgani 어야. Rasmiy uslubda 합니다.",
        examples: [
          { ko: "안전모를 써야 합니다.", uz: "Kaska kiyish kerak." },
          { ko: "매일 8시간 일해야 합니다.", uz: "Har kuni 8 soat ishlash kerak." },
          { ko: "먼저 손을 씻어야 해요.", uz: "Avval qo'lni yuvish kerak." },
        ],
        mistake: "Otdan keyin emas — FE'L + 아야: 「안전모는 써야 합니다」 to'g'ri, «안전모야» emas.",
        exercises: [
          { q: "안전모를 ___ .", options: ["벗어야 합니다", "버려야 합니다", "써야 합니다"], correct: 2 },
          { q: "먼저 손을 ___ .", options: ["씁니다", "씻어야 해요", "씻어요"], correct: 1 },
          { q: "「Qilish kerak» = ?", options: ["하고 있습니다", "해야 합니다", "하고 싶습니다"], correct: 1 },
        ],
      },
      {
        id: "e-2", title: "(으)면 안 되다", roman: "myeon an doe-da", desc: "Taqiq — mumkin emas", level: "A2",
        pattern: "Verb stem + (으)면 안 됩니다",
        explain: "«Qilsa bo'lmaydi», «taqiqlangan». Qoida, xavfsizlik, intizomni aytishda ishlatiladi. EPS imtihonida eng ko'p beriladigan savol.",
        examples: [
          { ko: "여기서 담배를 피우면 안 됩니다.", uz: "Bu yerda chekish mumkin emas." },
          { ko: "기계를 만지면 안 됩니다.", uz: "Mashinaga tegish mumkin emas." },
          { ko: "안전모 없이는 들어가면 안 돼요.", uz: "Kaskasiz kirit mumkin emas." },
        ],
        mistake: "안 돼요 — ogohlantirish; 안 됩니다 — rasmiy taqiq. Imtihonda 안 됩니다 variantini tanlang.",
        exercises: [
          { q: "여기서 사진을 찍__ .", options: ["으면 안 됩니다", "고 싶습니다", "어야 합니다"], correct: 0 },
          { q: "기계를 만지면 ___ .", options: ["싶습니다", "됩니다", "안 됩니다"], correct: 2 },
          { q: "「Mumkin emas» = ?", options: ["합니다", "됩니다", "안 됩니다"], correct: 2 },
        ],
      },
    ],
  },
  {
    id: "counters",
    title: "Raqamlar va hisob",
    icon: "🔢",
    desc: "Soni, necha, qancha — do'kon va imtihon uchun",
    accent: "#0891b2",
    soft: "#ecfeff",
    topics: [
      {
        id: "n-1", title: "한 / 두 / 세 …", roman: "han / du", desc: "O'tirgan sonlar", level: "A1",
        pattern: "한/두/세/네 + Noun (hisoblovchisiz)",
        explain: "Noaniq otdan oldin maxsus o'tirgan sonlar ishlatiladi: 한 (bir), 두 (ikki), 세 (uch), 네 (to'rt), 다섯 (besh) … 열 (o'n). Raqamli yozuv (1, 2, 3) faqat rasmiy hujjatda.",
        examples: [
          { ko: "한 사람", uz: "bir kishi" },
          { ko: "두 개", uz: "ikki dona" },
          { ko: "세 권", uz: "uch dona (kitob)" },
        ],
        mistake: "Raqamli yozuv (1개) faqat hujjatda. Kundalikda 한/두/세 bilan hisoblang.",
        exercises: [
          { q: "«Ikki» = ?", options: ["두", "세", "한"], correct: 0 },
          { q: "«Uch» = ?", options: ["네", "세", "두"], correct: 1 },
          { q: "«O'n» = ?", options: ["열", "한", "네"], correct: 0 },
        ],
      },
      {
        id: "n-2", title: "개 / 명 / 분", roman: "gae / myeong", desc: "Hisoblovchilar", level: "A1",
        pattern: "N + NUMBER + 개 / 명 / 분 / 병",
        explain: "Narsaning turi bo'yicha tanlanadi: 개 — umumiy (narsa), 명/분 — odam, 병 — shisha, 자루 — qurol, 잔 — piyola. 명 — rasmiy/oddiy, 분 — hurmatli.",
        examples: [
          { ko: "사과 다섯 개", uz: "besh dona olma" },
          { ko: "사람 세 명", uz: "uch kishi" },
          { ko: "물 두 병", uz: "ikki shisha suv" },
        ],
        mistake: "Odamlarga 개 ishlatmang: 「사람 다섯 개」 emas — «사람 다섯 명».",
        exercises: [
          { q: "사과 다섯 ___ .", options: ["분", "개", "명"], correct: 1 },
          { q: "사람 세 ___ .", options: ["명", "병", "개"], correct: 0 },
          { q: "물 한 ___ .", options: ["병", "명", "개"], correct: 0 },
        ],
      },
      {
        id: "n-3", title: "얼마 / 몇", roman: "eol-ma", desc: "Qancha / nechta", level: "A1",
        pattern: "얼마(예요)? — pul/narsa narxi / 몇 — nechta (son) yoki nechada (vaqt)",
        explain: "얼마 = qancha (narx, miqdor); 몇 = nechta (son so'rashda) va qachonda «몇 시» (soat nechada). 무어 = nim.",
        examples: [
          { ko: "이거 얼마예요?", uz: "Nech pul buni?" },
          { ko: "몇 시예요?", uz: "Soat nechada?" },
          { ko: "몇 개 필요해요?", uz: "Nechta kerak?" },
        ],
        mistake: "Vaqt uchun 언제, SOAT uchun 몇 시 — aralashtirmang.",
        exercises: [
          { q: "Mol-hol narxi? → ___ 예요?", options: ["얼마", "무엇", "몇"], correct: 0 },
          { q: "Soat qachon? → ___ 시?", options: ["몇", "얼마", "무엇"], correct: 0 },
          { q: "«Nechta» = ?", options: ["몇", "얼마", "언제"], correct: 0 },
        ],
      },
      {
        id: "n-4", title: "Soni: 1–100", roman: "su", desc: "O'qish tartibi", level: "A1",
        pattern: "1 하나 2 둘 3 셋 4 넷 5 다섯 … 10 열 20 스물 30 서른 40 마흔 50 쉰 100 백",
        explain: "Uzun sonlar qo'shiladi: 스물다섯 (25), 서른세 (33). Har bir o'nlikning o'z nomi bor — 10 tasi bilan kundalik hayot to'liq yopiladi.",
        examples: [
          { ko: "스물다섯", uz: "yigirma besh (25)" },
          { ko: "서른", uz: "o'ttiz (30)" },
          { ko: "백 원", uz: "yuz von (100₩)" },
        ],
        mistake: "«이십» (sino-koreyscha 20) kundalik emas — 스물 deyiladi.",
        exercises: [
          { q: "20 = ?", options: ["서른", "스물", "열"], correct: 1 },
          { q: "30 = ?", options: ["스물", "쉰", "서른"], correct: 2 },
          { q: "100 = ?", options: ["백", "천", "열"], correct: 0 },
        ],
      },
    ],
  },
  {
    id: "time",
    title: "Vaqt va sana",
    icon: "🕐",
    desc: "Kun, oy, hafta, zamon — suhbatning yarmi",
    accent: "#db2777",
    soft: "#fdf2f8",
    topics: [
      {
        id: "t-1", title: "Oylar", roman: "wol", desc: "1–12 oy", level: "A1",
        pattern: "NUMBER + 월 (oy) + 에 (vaqt)",
        explain: "Son + 월. 1일(month) kunlari haqida emas — oy. Oyga 에 qo'shiladi: 3월에 (mart oyida).",
        examples: [
          { ko: "3월에 갑니다.", uz: "Mart oyida boraman." },
          { ko: "12월은 추워요.", uz: "Dekabr sovuq." },
          { ko: "5월에 결혼했어요.", uz: "May oyida turmush qurdim." },
        ],
        mistake: "Hafta kuni -일 (월요일), oy -월 (3월) — oxiridagi harfni adashtirmang.",
        exercises: [
          { q: "Mart = ?", options: ["5월", "3월", "12월"], correct: 1 },
          { q: "12월 = ?", options: ["Dekabr", "Noyabr", "Yanvar"], correct: 0 },
          { q: "「Mart oyida» = ?", options: ["3시에", "3월에", "3일에"], correct: 1 },
        ],
      },
      {
        id: "t-2", title: "Hafta kunlari", roman: "yu-il", desc: "Dush → Yak", level: "A1",
        pattern: "火/水/木/金/土/日 + 요일 (hafta kuni)",
        explain: "Har kun davriy jadval raqami bilan: 月요일 (Dush), 火요일 (Sesh), 水요일 (Chor), 木요일 (Pay), 金요일 (Jum), 土요일 (Shan), 日요일 (Yak).",
        examples: [
          { ko: "월요일에 만나요.", uz: "Dushanba uchrashamiz." },
          { ko: "일요일은 쉽니다.", uz: "Yakshanba dam." },
          { ko: "금요일에 퇴근해요.", uz: "Juma kuni ishdan chiqaman." },
        ],
        mistake: "«요일» qo'shilmaydigan kunlar uchun — 오는 화요일 kabi qo'shimcha kerak bo'ladi.",
        exercises: [
          { q: "Juma = ?", options: ["토요일", "목요일", "금요일"], correct: 2 },
          { q: "Shanba = ?", options: ["금요일", "일요일", "토요일"], correct: 2 },
          { q: "Yakshanba = ?", options: ["월요일", "수요일", "일요일"], correct: 2 },
        ],
      },
      {
        id: "t-3", title: "어제 / 오늘 / 내일", roman: "eo-je", desc: "O'tgan · hozir · kelasi", level: "A1",
        pattern: "어제 (kecha) · 오늘 (bugun) · 내일 (ertaga) + 에",
        explain: "Kun nomlari: 어제, 오늘, 내일, 모레 (indigan), 그저께 (ikkiga oldin). Zamon: 했어요 (qildim), 해요 (qilaman), 할 거예요 (qilaman).",
        examples: [
          { ko: "어제 뭘 했어요?", uz: "Kecha nima qildingiz?" },
          { ko: "내일 만나요.", uz: "Ertaga uchrashamiz." },
          { ko: "오늘은 바빠요.", uz: "Bugun bandman." },
        ],
        mistake: "내일 = ertaga, 모레 = indigan («indigan» bilan adashtirmang).",
        exercises: [
          { q: "Ertaga = ?", options: ["오늘", "어제", "내일"], correct: 2 },
          { q: "Kecha = ?", options: ["내일", "어제", "오늘"], correct: 1 },
          { q: "「Bugun» = ?", options: ["어제", "모레", "오늘"], correct: 2 },
        ],
      },
      {
        id: "t-4", title: "시 / 분 / 초", roman: "si", desc: "Soat, daqiqa, soniya", level: "A1",
        pattern: "NUMBER + 시 / NUMBER + 분 / NUMBER + 초",
        explain: "시 = soat, 분 = daqiqa, 초 = soniya, 시간 = soat (davomiylik). 3시 30분 = uch yarim; 두 시간 = ikki soat (davom).",
        examples: [
          { ko: "세 시 삼십 분", uz: "3:30" },
          { ko: "두 시간 걸려요.", uz: "Ikki soat ketadi." },
          { ko: "지금 몇 시예요?", uz: "Hozir soat nechada?" },
        ],
        mistake: "시 (soat nuqtasi) va 시간 (davomiylik) — farq: 3시 (3 da) / 3시간 (3 soat davom).",
        exercises: [
          { q: "5 daqiqa = ?", options: ["5분", "5초", "5시"], correct: 0 },
          { q: "Ikki soat (davom) = ?", options: ["두 분", "두 시간", "두 시"], correct: 1 },
          { q: "«Soat nechada?» = ?", options: ["몇 개예요?", "몇 분예요?", "몇 시예요?"], correct: 2 },
        ],
      },
    ],
  },
  {
    id: "questions",
    title: "Savol so'zlari",
    icon: "❓",
    desc: "Nima · qayer · qachon · qanday — suhbat boshlash",
    accent: "#4f46e5",
    soft: "#eef2ff",
    topics: [
      {
        id: "q-1", title: "무엇 / 뭐", roman: "mu-eot", desc: "Nima / nimani", level: "A1",
        pattern: "무엇이/뭐가 — nima (ega) · 무엇을/뭐를 — nimani (obyekt)",
        explain: "무엇 — rasmiy, 뭐 — norasmiy (kundalik). Qo'shimchalar bilan o'zgaradi: 무엇이에요 (nima), 무엇을 (nimani), 무엇에서 (qayerda).",
        examples: [
          { ko: "무엇을 먹어요?", uz: "Nima yeysiz?" },
          { ko: "이게 뭐예요?", uz: "Bu nima?" },
          { ko: "뭐 하고 있어요?", uz: "Nima qilyapsiz?" },
        ],
        mistake: "Kundalikda 대부분 «뭐» ishlatiladi — «무엇» biroz mantiqan tarang eshitiladi.",
        exercises: [
          { q: "Norasmiy «Nima» = ?", options: ["누구", "무엇", "뭐"], correct: 2 },
          { q: "«Nimani» = ?", options: ["언제", "어디에", "무엇을"], correct: 2 },
          { q: "이거 ___ 예요?", options: ["뭐", "언제", "누구"], correct: 0 },
        ],
      },
      {
        id: "q-2", title: "어디", roman: "eo-di", desc: "Qayer", level: "A1",
        pattern: "어디 (qayer) · 어디에 (qayerga) · 어디서 (qayerda) · 어디로 (qayerga, yo'nalish)",
        explain: "Joyni so'rash va aytish. Bilan keladigan yuklama ma'noni aniqlaydi: 에 = maqsad, 에서 = harakat joyi, 로 = yo'nalish.",
        examples: [
          { ko: "어디에 살아요?", uz: "Qayerda yashaysiz?" },
          { ko: "어디서 일해요?", uz: "Qayerda ishlaysiz?" },
          { ko: "어디로 가요?", uz: "Qayerga ketyapsiz?" },
        ],
        mistake: "어디서 (qayerda) ≠ 어디에 (qayerga). «집에서» = uyda, «집에» = uyga.",
        exercises: [
          { q: "Harakat joyi «qayerda» = ?", options: ["어디에", "언제", "어디서"], correct: 2 },
          { q: "«Qayerga» (maqsad) = ?", options: ["어디서", "무엇을", "어디에"], correct: 2 },
          { q: "어디__ 살아요?", options: ["에서", "를", "에"], correct: 2 },
        ],
      },
      {
        id: "q-3", title: "언제 / 몇 시", roman: "eon-je", desc: "Qachon", level: "A1",
        pattern: "언제 (qachon) · 몇 시 (soat nechada) · 부터 (dan boshlab) · 까지 (gacha)",
        explain: "언제 — umumiy qachon; 몇 시 — aniq vaqt (soat). Vaqt boshlanishi 부터, tugashi 까지.",
        examples: [
          { ko: "언제 와요?", uz: "Qachon kelasiz?" },
          { ko: "몇 시에 만나요?", uz: "Soat nechada uchrashamiz?" },
          { ko: "9시부터 5시까지 일해요.", uz: "9 dan 5 gacha ishlayman." },
        ],
        mistake: "«Qachon kelasan?» → 언제, lekin «soat nechada?» → 몇 시.",
        exercises: [
          { q: "Soat qachon? = ?", options: ["몇 시", "어디", "언제"], correct: 0 },
          { q: "Umumiy «qachon» = ?", options: ["몇 시", "언제", "무엇"], correct: 1 },
          { q: "9시___ 5시까지 일해요.", options: ["까지", "부터", "에서"], correct: 1 },
        ],
      },
      {
        id: "q-4", title: "어떻게 / 왜", roman: "eo-tto-ke", desc: "Qanday · Nega · Kim", level: "A2",
        pattern: "어떻게 (qanday) · 왜 (nega) · 누가 (kim) · 얼마나 (qanchalik)",
        explain: "어떻게 — usul; 왜 — sabab; 누가 — ega (kim); 얼마나 — qanchalik/darajada.",
        examples: [
          { ko: "어떻게 가요?", uz: "Qanday boriladi?" },
          { ko: "왜 안 왔어요?", uz: "Nega kelmadingiz?" },
          { ko: "누가 그랬어요?", uz: "Kim bunday dedi?" },
        ],
        mistake: "왜 — sabab so'raydi, 어떻게 — usul. «왜 이렇게?» = nega bunday (ikkalasi aralash).",
        exercises: [
          { q: "«Nega» = ?", options: ["왜", "어떻게", "무엇"], correct: 0 },
          { q: "«Qanday» (usul) = ?", options: ["어떻게", "누가", "왜"], correct: 0 },
          { q: "누가 ___ ?", options: ["먹어요", "왔어요", "갑니다"], correct: 1 },
        ],
      },
    ],
  },
  {
    id: "sentence",
    title: "Gap tuzilishi",
    icon: "M",
    desc: "Fe'l oxirida — koreys tilining asosiy qoidasi",
    accent: "#0f766e",
    soft: "#f0fdfa",
    topics: [
      {
        id: "s-1", title: "SOV tartibi", roman: "seu-o-vi", desc: "Ota → yuklama → Fe'l", level: "A1",
        pattern: "Ega + Obyekt + Joy/Vaqt + FE'L (oxirida!)",
        explain: "Koreys gapida fe'l HAR DOIM oxirida turadi. «Men maktabga boraman» → 저는 학교에 갑니다. Shu sababli yuklamalar fe'ldan oldin yopishadi.",
        examples: [
          { ko: "저는 학교에 가요.", uz: "Men maktabga boraman." },
          { ko: "친구하고 영화를 봐요.", uz: "Do'stim bilan kino ko'raman." },
          { ko: "내일 일곱 시에 일어나요.", uz: "Ertaga soat 7 da turaman." },
        ],
        mistake: "Inglizcha tartibda yozmang: 「I go school」 emas — 「저는 학교에 가요».",
        exercises: [
          { q: "Fe'l qayerda turadi?", options: ["Oxirida", "Ortasida", "Boshida"], correct: 0 },
          { q: "«Men yeyman» qaysi?", options: ["저는 먹어요", "먹어요 저는", "먹는 저는"], correct: 0 },
          { q: "Koreyscha asosiy qoida = ?", options: ["Fe'l boshida", "Yuklamasiz gap", "Fe'l oxirida"], correct: 2 },
        ],
      },
      {
        id: "s-2", title: "안 / 못", roman: "an / mot", desc: "Rad · imkon yo'qligi", level: "A1",
        pattern: "안 + V (qilmayman) · 못 + V (qila olmayman)",
        explain: "안 — iroda bilan rad («xohlamayman»), 못 — imkon bo'lmaslik («qila olmayman»). Ikkalasi ham fe'lning OLDIN turadi.",
        examples: [
          { ko: "오늘 학교에 안 가요.", uz: "Bugun maktabga bormayman." },
          { ko: "한국어를 못해요.", uz: "Koreys tilini qila olmayman." },
          { ko: "시간이 없어서 못 갔어요.", uz: "Vaqt yo'qligi uchun bora olmadim." },
        ],
        mistake: "안 vs 못: «안 먹어요» = yemayman (rad), «못 먹어요» = yeye olmayman (og'iz og'riq).",
        exercises: [
          { q: "«Qila olmayman» = ?", options: ["안", "안에", "못"], correct: 2 },
          { q: "«Bormayman» (iroda) = ?", options: ["못 가요", "안 가요", "가요"], correct: 1 },
          { q: "안 __ ? («Yeysanmi?» rad)", options: ["먹었어요", "먹을래요", "먹어요"], correct: 2 },
        ],
      },
      {
        id: "s-3", title: "에 / 로", roman: "e / ro", desc: "Maqsad va yo'nalish", level: "A1",
        pattern: "Joy + 에 (qayerga) · Transport + 로/으로 (orqali)",
        explain: "에 — maqsad (qayerga), 로/으로 — yo'nalish yoki vosita (orqali). Undosh bilan tugasa 로, unli/ㄹ dan keyin 으로.",
        examples: [
          { ko: "회사에 갑니다.", uz: "Ofisga boraman." },
          { ko: "버스로 갑니다.", uz: "Avtobus orqali boraman." },
          { ko: "지하철로 왔어요.", uz: "Metro orqali keldim." },
        ],
        mistake: "집으로 = uyga (yo'nalish) va 집에 = uyga (maqsad) — ko'p joyda almashsa ham bo'ladi, lekin vositada 로 shart.",
        exercises: [
          { q: "Maqsad «qayerga» = ?", options: ["도", "에서", "에"], correct: 2 },
          { q: "Vosita «orqali» = ?", options: ["에", "로", "서"], correct: 1 },
          { q: "학교__ 갑니다. (maqsad)", options: ["에서", "로", "에"], correct: 2 },
        ],
      },
    ],
  },
  {
    id: "daily",
    title: "Kundalik fe'llar",
    icon: "🍳",
    desc: "Ovqat, uyqu, ish — har kuni ishlatiladigan fe'llar",
    accent: "#ea580c",
    soft: "#fff7ed",
    topics: [
      {
        id: "d-1", title: "먹다 / 마시다", roman: "meok-da", desc: "Yeyish / ichish", level: "A1",
        pattern: "Noun + 을/를 + 먹다 / 마시다",
        explain: "먹다 (yeyish), 마시다 (ichish). Metni: 먹어요, 마셔요; o'tgan: 먹었어요. 주다 (berish) bilan juftlashadi.",
        examples: [
          { ko: "밥을 먹어요.", uz: "Ovqat yeyaman." },
          { ko: "물을 마셔요.", uz: "Suv ichaman." },
          { ko: "아침을 먹었어요.", uz: "Nonushta qildim." },
        ],
        mistake: "«Ichish» = 마시다, «pishiromaslik» = 굽다 — aralashtirmang.",
        exercises: [
          { q: "«Yeyish» = ?", options: ["먹다", "마시다", "자다"], correct: 0 },
          { q: "비빔밥을 ___ .", options: ["먹어요", "마셔요", "읽어요"], correct: 0 },
          { q: "물을 ___ .", options: ["달어요", "먹어요", "마셔요"], correct: 2 },
        ],
      },
      {
        id: "d-2", title: "가다 / 오다", roman: "ga-da", desc: "Borish / kelish", level: "A1",
        pattern: "가다 (boraman) ↔ 오다 (kelaman)",
        explain: "Bir-biriga teskari fe'llar. 가다 — o'zdan uzoqlashish, 오다 — o'zga tomon kelish. 샌다/온다 shakllari ham bor.",
        examples: [
          { ko: "집에 가요.", uz: "Uyg'a boraman." },
          { ko: "여기로 와요.", uz: "Shu yerga keling." },
          { ko: "내일 올게요.", uz: "Ertaga kelaman." },
        ],
        mistake: "«Keldim» = 왔어요, «Bordim» = 갔어요 — tish (ㅆ) ni unutmang.",
        exercises: [
          { q: "«Kelish» = ?", options: ["오다", "있다", "가다"], correct: 0 },
          { q: "«Bordim» (rasmiy) = ?", options: ["먹었습니다", "왔습니다", "갔습니다"], correct: 2 },
          { q: "집__ 가요.", options: ["로", "서", "에"], correct: 2 },
        ],
      },
      {
        id: "d-3", title: "있다 / 없다", roman: "it-da", desc: "Bor / yo'q", level: "A1",
        pattern: "N + 이/가 + 있다 (bor) / 없다 (yo'q)",
        explain: "있다 — narsa joyida turadi yoki egallash (kishi bor); 없다 — yo'q. «Hozir bor» va «egallangan» ikkala ma'no ham bor.",
        examples: [
          { ko: "집에 사람이 있어요.", uz: "Uyda odam bor." },
          { ko: "시간이 없어요.", uz: "Vaqt yo'q." },
          { ko: "커피 있어요?", uz: "Qahva bormi?" },
        ],
        mistake: "«Keldi» (o'tgan) emas — 있다 = mavjudlik: 「책이 있어요» (kitob bor).",
        exercises: [
          { q: "«Bor» (mavjudlik) = ?", options: ["없다", "있다", "하다"], correct: 1 },
          { q: "«Yo'q» = ?", options: ["있다", "옵니다", "없다"], correct: 2 },
          { q: "시간이 ___ .", options: ["있어요", "없어요", "왔어요"], correct: 1 },
        ],
      },
      {
        id: "d-4", title: "하다", roman: "ha-da", desc: "Qilish — universal fe'l", level: "A1",
        pattern: "Noun + 하다 (o'zlashtirish) / o'z fe'li + 하다",
        explain: "Har qanday ishga qo'llanadi: 공부하다 (o'qish), 일하다 (ishlash), 운동하다 (sport), 말하다 (gapirish). Ko'p otdan fe'l hosil qiladi.",
        examples: [
          { ko: "공부해요.", uz: "O'qiyapman." },
          { ko: "한국어 공부를 해요.", uz: "Koreys tilini o'rganaman." },
          { ko: "전화해요.", uz: "Qo'ng'iroq qilaman." },
        ],
        mistake: "하다 → 해요 (qisqa), «하어요» emas.",
        exercises: [
          { q: "«O'qish» = ?", options: ["자다", "공부하다", "먹다"], correct: 1 },
          { q: "하다 (hozirgi) → ?", options: ["해요", "합니다", "하요"], correct: 0 },
          { q: "전화를 ___ .", options: ["자요", "먹어요", "해요"], correct: 2 },
        ],
      },
      {
        id: "d-5", title: "자다 / 일어나다", roman: "ja-da", desc: "Uxlash / turish / yuvish", level: "A1",
        pattern: "자다 (uxlayman) ↔ 일어나다 (turaman) · 씻다 (yuvaman)",
        explain: "Kundalik rutina: 자다, 일어나다, 씻다 (yuvish), 준비하다 (tayyorlash), 퇴근하다 (ishdan chiqish).",
        examples: [
          { ko: "열두 시에 자요.", uz: "Soat 12 da uxlayman." },
          { ko: "일곱 시에 일어나요.", uz: "Soat 7 da turaman." },
          { ko: "아침에 세수해요.", uz: "Ertalab yuz yuvaman." },
        ],
        mistake: "일어나다 — «turish» (emov), 일어서다 — «o'tirib turish» (tana) — farq bor.",
        exercises: [
          { q: "«Turish» = ?", options: ["일어나다", "쓰다", "자다"], correct: 0 },
          { q: "«Uxlab qoldim» = ?", options: ["잠들었어요", "씻었어요", "일어났어요"], correct: 0 },
          { q: "밤 열한 시에 ___ .", options: ["씻어요", "일어나요", "자요"], correct: 2 },
        ],
      },
    ],
  },
  {
    id: "expression",
    title: "Iltimos va madaniyat",
    icon: "🍽️",
    desc: "Restoran, do'kon, salomlashish — turmush uchun",
    accent: "#be185d",
    soft: "#fdf2f8",
    topics: [
      {
        id: "x-1", title: "주세요", roman: "ju-se-yo", desc: "Bering, iltimos", level: "A1",
        pattern: "Noun + 주세요 (briting) · N + 좀 주세요 (bir oz bering)",
        explain: "Odatdagi iltimos. 「물 주세요» — suv bering. Yumshoqroq: 「좀 주세요». Narx bilan: 「이걸로 주세요» (shuni bering).",
        examples: [
          { ko: "물 좀 주세요.", uz: "Suv bering, iltimos." },
          { ko: "이걸로 주세요.", uz: "Shuni bering." },
          { ko: "메뉴 좀 주세요.", uz: "Menyu bering, iltimos." },
        ],
        mistake: "«주세요» fe'ldan keyin emas — odatda narsa bilan: 「물 주세요».",
        exercises: [
          { q: "«Suv bering» = ?", options: ["물 주세요", "물 있어요", "물 먹어요"], correct: 0 },
          { q: "«Menyu» = ?", options: ["카드", "메뉴", "계산"], correct: 1 },
          { q: "이걸로 ___ .", options: ["주세요", "있어요", "갑니다"], correct: 0 },
        ],
      },
      {
        id: "x-2", title: "감사합니다 / 죄송합니다", roman: "gam-sa", desc: "Rahmat / Kechirasiz", level: "A1",
        pattern: "감사합니다 (rahmat) · 죄송합니다/미안합니다 (kechirasiz)",
        explain: "Rasmiy rahmat — 감사합니다 (kundalik: 고마워요). Kechir so'rash — 죄송합니다 (rasmiy), 미안합니다 (keng).",
        examples: [
          { ko: "정말 감사합니다.", uz: "Juda rahmat." },
          { ko: "죄송합니다.", uz: "Kechirasiz." },
          { ko: "아니에요, 괜찮아요.", uz: "Yo'q, hechqisi yo'q." },
        ],
        mistake: "«Rahmat» = 감사합니다, «kechirasiz» = 죄송합니다 — almashtirmang.",
        exercises: [
          { q: "«Rahmat» = ?", options: ["안녕하세요", "죄송합니다", "감사합니다"], correct: 2 },
          { q: "«Kechirasiz» = ?", options: ["죄송합니다", "안녕히 계세요", "감사합니다"], correct: 0 },
          { q: "도와주셔서 __ .", options: ["미안합니다", "감사합니다", "안녕하세요"], correct: 1 },
        ],
      },
      {
        id: "x-3", title: "계산 / 카드 / 영수증", roman: "gye-san", desc: "To'lov, karta, chek", level: "A2",
        pattern: "계산해 주세요 (hisob bering) · 카드로 (karta orqali) · 영수증 (chek)",
        explain: "To'lov mavzusi: 계산 (hisob), 카드 (karta), 현금 (naqd pul), 영수증 (chek), 세일 (chevirish).",
        examples: [
          { ko: "계산해 주세요.", uz: "Hisob, iltimos." },
          { ko: "카드로 할게요.", uz: "Karta bilan to'layman." },
          { ko: "영수증 주세요.", uz: "Chek bering." },
        ],
        mistake: "「카드로 할게요» — «karta bilan qilaman» (tilov), «카드예요» — «karta (o'zi)».",
        exercises: [
          { q: "«Hisob» = ?", options: ["계산", "영수증", "카드"], correct: 0 },
          { q: "«Chek» = ?", options: ["계산", "영수증", "현금"], correct: 1 },
          { q: "카드__ 할게요.", options: ["로", "서", "에"], correct: 0 },
        ],
      },
      {
        id: "x-4", title: "인사 — Salomlashish", roman: "in-sa", desc: "Kun boshi va yakuni", level: "A1",
        pattern: "안녕하세요 (salom) · 처음 뵙겠습니다 (birinchi tanishuv) · 안녕히 계세요 (xayr)",
        explain: "Koreyscha salomlashish madaniyati: kunduzi 안녕하세요, kechqurun 안녕하세요, uzoqlashganda 안녕히 가세요 (ketayotganga) / 안녕히 계세요 (qolayotganga).",
        examples: [
          { ko: "안녕하세요, 저는 민주예요.", uz: "Salom, men Minju." },
          { ko: "처음 뵙겠습니다.", uz: "Birinchi tanishamiz." },
          { ko: "안녕히 계세요.", uz: "Xayr (siz qolasiz)." },
        ],
        mistake: "«Xayr» uchun: ketyotgan odamga → 안녕히 가세요, qolayotgan odamga → 안녕히 계세요.",
        exercises: [
          { q: "Rasmiy salom = ?", options: ["안녕하세요", "안녕", "잘자"], correct: 0 },
          { q: "Qolayotgan odamga xayr = ?", options: ["안녕히 가세요", "안녕히 계세요", "잘 자요"], correct: 1 },
          { q: "Birinchi tanishuv = ?", options: ["죄송합니다", "처음 뵙겠습니다", "감사합니다"], correct: 1 },
        ],
      },
    ],
  },
];

// Barcha mavzularni tekish qulaylik uchun
export const allGrammarTopics = grammarFolders.flatMap(f => f.topics.map(t => ({ ...t, folderId: f.id, folderTitle: f.title, folderIcon: f.icon })));
