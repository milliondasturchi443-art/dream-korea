// Original teaching content — 8 units. Media (video URLs) is added by admin.
export type SeedVocab = { ko: string; uz: string; tr?: string; exampleKo?: string; exampleUz?: string };
export type SeedGrammar = { title: string; pattern?: string; explain: string; examples: { ko: string; uz: string }[]; exercises: { q: string; options: string[]; correct: number; hint?: string }[] };
export type SeedListening = { title: string; audioText?: string; transcript?: string; questions: { text: string; options: { key: string; text: string }[]; correct: string; explanation?: string }[] };
export type SeedWriting = { title: string; prompt: string; criteria?: string; sampleAnswer?: string };
export type SeedUnit = {
  order: number; title: string; topic: string; level: "TOPIK I" | "TOPIK II"; description: string;
  vocab: SeedVocab[]; videos: { title: string; videoUrl: string; duration?: string }[];
  grammars: SeedGrammar[]; listenings: SeedListening[]; writings: SeedWriting[];
};

export const SEED_UNITS: SeedUnit[] = [
  {
    order: 1, title: "Tanishuv", topic: "인사 · Salomlashish", level: "TOPIK I",
    description: "O'zingizni tanishtirish, salomlashish va shaxsiy ma'lumot aytish.",
    vocab: [
      { ko: "안녕하세요", uz: "Assalomu alaykum", tr: "annyeonghaseyo", exampleKo: "안녕하세요, 만나서 반갑습니다.", exampleUz: "Assalomu alaykum, tanishganimdan xursandman." },
      { ko: "학생", uz: "Talaba", tr: "haksaeng", exampleKo: "저는 학생입니다.", exampleUz: "Men talabaman." },
      { ko: "이름", uz: "Ism", tr: "ireum", exampleKo: "이름이 뭐예요?", exampleUz: "Ismingiz nima?" },
      { ko: "사람", uz: "Odamlar, shaxs", tr: "saram", exampleKo: "그 사람은 누구예요?", exampleUz: "U odam kim?" },
      { ko: "선생님", uz: "O'qituvchi", tr: "seonsaengnim", exampleKo: "선생님은 한국어를 가르쳐요.", exampleUz: "O'qituvchi koreys tilini o'rgatadi." },
      { ko: "만나다", uz: "Uchrashish", tr: "mannada", exampleKo: "친구를 만나요.", exampleUz: "Do'stim bilan uchrashaman." },
      { ko: "반갑습니다", uz: "Tanishganimdan xursandman", tr: "bagesseumnida", exampleKo: "만나서 반갑습니다.", exampleUz: "Tanishganimdan xursandman." },
      { ko: "감사합니다", uz: "Rahmat", tr: "gamsahamnida", exampleKo: "도와주셔서 감사합니다.", exampleUz: "Yordam berganingiz uchun rahmat." },
    ],
    videos: [],
    grammars: [
      { title: "문법 1 · 입니다 / 입니까", pattern: "Ot + 입니다 (tasdiq) / 입니까 (savol)", explain: "입니다 — rasmiy tasdiq, 입니까 — rasmiy savol. Undoshdan keyin ham bir xil yoziladi: 학생입니다.", examples: [{ ko: "저는 학생입니다.", uz: "Men talabaman." }, { ko: "여기는 학교입니까?", uz: "Bu yer maktabmi?" }], exercises: [{ q: "Rasmiy tasdiq: 저는 학생__.", options: ["입니까", "입니다", "을"], correct: 1, hint: "입니다 — tasdiq shakli." }, { q: "Rasmiy savol: 민수 씨입___?", options: ["니까", "니다", "ㅂ니다"], correct: 0, hint: "Savolda 입니까." }] },
    ],
    listenings: [
      { title: "듣기 · Tanishuv dialogi", audioText: "안녕하세요. 제 이름은 리씨입니다. 저는 학생입니다. 만나서 반갑습니다.", transcript: "안녕하세요. 제 이름은 리씨입니다. 저는 학생입니다. 만나서 반갑습니다.", questions: [
        { text: "리씨는 누구입니까?", options: [{ key: "A", text: "선생님" }, { key: "B", text: "학생" }, { key: "C", text: "의사" }], correct: "B", explanation: "저는 학생입니다 — Men talabaman." },
        { text: "처음 인사할 때 무엇을 합니까?", options: [{ key: "A", text: "밥을 먹어요" }, { key: "B", text: "인사해요" }, { key: "C", text: "자요" }], correct: "B", explanation: "안녕하세요 — salomlashish." },
      ] },
    ],
    writings: [],
  },
  {
    order: 2, title: "Oilam va ish", topic: "가족과 직업 · Oilaviy hayot va kasb", level: "TOPIK I",
    description: "Oila a'zolari va kasb haqida gapirish.",
    vocab: [
      { ko: "가족", uz: "Oila", tr: "gajok", exampleKo: "가족이 모두 어디에 있어요?", exampleUz: "Oila a'zolari qayerda?" },
      { ko: "어머니", uz: "Ona", tr: "eomeoni", exampleKo: "어머니는 간호사예요.", exampleUz: "Onam hamshira." },
      { ko: "아버지", uz: "Ota", tr: "abeoji", exampleKo: "아버지는 회사에 다녀요.", exampleUz: "Otam kompaniyada ishlaydi." },
      { ko: "형", uz: "Katta ukam (yigit)", tr: "hyeong", exampleKo: "형은 서울에 살아요.", exampleUz: "Katta ukam Seulda yashaydi." },
      { ko: "누나", uz: "Katta opam (qiz)", tr: "nuna", exampleKo: "누나는 대학생이에요.", exampleUz: "Katta opam talaba." },
      { ko: "회사원", uz: "Xodim (ofis)", tr: "hoesawon", exampleKo: "저는 회사원입니다.", exampleUz: "Men ofis xodimiman." },
      { ko: "의사", uz: "Shifokor", tr: "uisa", exampleKo: "어머니는 의사예요.", exampleUz: "Onam shifokor." },
      { ko: "일하다", uz: "Ishlash", tr: "ilda", exampleKo: "어디에서 일해요?", exampleUz: "Qayerda ishlaysiz?" },
    ],
    videos: [],
    grammars: [
      { title: "문법 1 · 이에요 / 예요", pattern: "Unli bilan tugagan ot + 예요, undosh + 이에요", explain: "Unli harf bilan tugagan so'zdan keyin 예요, undoshdan keyin 이에요 yoziladi. Bu kundalik tasdiq shakli.", examples: [{ ko: "저는 학생이에요.", uz: "Men talabaman (kundalik)." }, { ko: "어머니는 의사예요.", uz: "Onam shifokor." }], exercises: [{ q: "의사___ (kundalik tasdiq)", options: ["예요", "이에요", "입니다"], correct: 0, hint: "의사 — unli bilan tugagan → 예요." }, { q: "친구___ (kundalik tasdiq)", options: ["예요", "이에요", "입니까"], correct: 1, hint: "친구 — undosh bilan tugagan → 이에요." }] },
    ],
    listenings: [
      { title: "듣기 · Oilam", audioText: "우리 가족은 다섯 명이에요. 아버지는 회사원이고 어머니는 간호사예요. 저는 누나 하나와 형 하나가 있어요.", transcript: "우리 가족은 다섯 명이에요. 아버지는 회사원이고 어머니는 간호사예요. 저는 누나 하나와 형 하나가 있어요.", questions: [
        { text: "가족은 모두 몇 명입니까?", options: [{ key: "A", text: "세 명" }, { key: "B", text: "네 명" }, { key: "C", text: "다섯 명" }], correct: "C", explanation: "다섯 명이에요 — 5 kishi." },
        { text: "어머니는 무엇을 합니까?", options: [{ key: "A", text: "간호사예요" }, { key: "B", text: "회사원이에요" }, { key: "C", text: "학생이에요" }], correct: "A", explanation: "어머니는 간호사예요." },
      ] },
    ],
    writings: [],
  },
  {
    order: 3, title: "Raqamlar va xarid", topic: "숫자와 쇼핑 · Raqamlar va xarid qilish", level: "TOPIK I",
    description: "Raqamlar, narx so'rash va do'konda suhbat.",
    vocab: [
      { ko: "얼마", uz: "Qancha (narx)", tr: "eolma", exampleKo: "이거 얼마예요?", exampleUz: "Buning narxi qancha?" },
      { ko: "만 원", uz: "10 ming von", tr: "man won", exampleKo: "만 원이에요.", exampleUz: "10 ming von." },
      { ko: "싸다", uz: "Arzon bo'lish", tr: "ssada", exampleKo: "이거 아주 싸요.", exampleUz: "Buni juda arzon." },
      { ko: "비싸다", uz: "Qimmat bo'lish", tr: "bissada", exampleKo: "이 가방은 비싸요.", exampleUz: "Bu sumka qimmat." },
      { ko: "사다", uz: "Sotib olish", tr: "sada", exampleKo: "사과 세 개를 사요.", exampleUz: "Uchta olma sotib olaman." },
      { ko: "카드", uz: "Karta", tr: "kadeu", exampleKo: "카드로 계산할게요.", exampleUz: "Karta orqali to'layman." },
      { ko: "계산", uz: "To'lov, hisob", tr: "gyesan", exampleKo: "계산해 주세요.", exampleUz: "Hisobni qiling." },
      { ko: "사과", uz: "Olma", tr: "sagua", exampleKo: "사과가 신선해요.", exampleUz: "Olma yangi." },
    ],
    videos: [],
    grammars: [
      { title: "문법 1 · 에요 / 아요 (kundalik ohang)", pattern: "Fe'l tarafi + (으)세요 (so'rov), -(으)ㄹ게요 (va'da)", explain: "Kundalik muloqotda so'rov uchun (으)세요, o'z rejamizni aytganda -(으)ㄹ게yo ishlatiladi.", examples: [{ ko: "이거 주세요.", uz: "Buni bering." }, { ko: "내일 전화할게요.", uz: "Ertaga qo'ng'iroq qilaman." }], exercises: [{ q: "Narsa so'rang: 이거 ___ 주세요.", options: ["을", "를", "이"], correct: 1, hint: "이거 — undosh, to'ldiruvchi 를." }, { q: "Va'da: 내일 갈___.", options: ["을게요", "아요", "ㅂ니다"], correct: 0, hint: "Reja — 갈게요." }] },
    ],
    listenings: [
      { title: "듣기 · Do'konda", audioText: "이 사과 얼마예요? 개당 천 원이에요. 그럼 세 개 주세요.", transcript: "이 사과 얼마예요? 개당 천 원이에요. 그럼 세 개 주세요.", questions: [
        { text: "사과는 개당 얼마입니까?", options: [{ key: "A", text: "만 원" }, { key: "B", text: "천 원" }, { key: "C", text: "백 원" }], correct: "B", explanation: "개당 천 원이에요 — bir donasi ming von." },
        { text: "고객은 사과를 몇 개 사요?", options: [{ key: "A", text: "두 개" }, { key: "B", text: "세 개" }, { key: "C", text: "다섯 개" }], correct: "B", explanation: "세 개 주세요 — uchta bering." },
      ] },
    ],
    writings: [],
  },
  {
    order: 4, title: "Kundalik hayot", topic: "일상생활 · Kundalik reja", level: "TOPIK I",
    description: "Kundalik ishlar, vaqt va odatlar haqida gapirish.",
    vocab: [
      { ko: "아침", uz: "Ertalab", tr: "achim", exampleKo: "아침에 운동해요.", exampleUz: "Ertalab sport qilaman." },
      { ko: "저녁", uz: "Kechqurun", tr: "jeonyeok", exampleKo: "저녁에 집에서 쉬어요.", exampleUz: "Kechqurun uyda dam olaman." },
      { ko: "운동", uz: "Sport, mashq", tr: "undong", exampleKo: "주말에 운동해요.", exampleUz: "Dam olish kunida sport qilaman." },
      { ko: "쉬다", uz: "Dam olish", tr: "swida", exampleKo: "한숨 쉬어요.", exampleUz: "Bir nafas olaman." },
      { ko: "공부하다", uz: "O'qish, o'rganish", tr: "gongbuhada", exampleKo: "도서관에서 공부해요.", exampleUz: "Kutubxonada o'qiyman." },
      { ko: "도서관", uz: "Kutubxona", tr: "doseogwan", exampleKo: "도서관에 갑니다.", exampleUz: "Kutubxonaga boraman." },
      { ko: "매일", uz: "Har kuni", tr: "maeil", exampleKo: "매일 한국어를 공부해요.", exampleUz: "Har kuni koreys tilini o'rganaman." },
      { ko: "여가", uz: "Bo'sh vaqt", tr: "yeoga", exampleKo: "여가 시간에 뭐 해요?", exampleUz: "Bo'sh vaqtingizda nima qilasiz?" },
    ],
    videos: [],
    grammars: [
      { title: "문법 1 · -(으)ㄹ 때", pattern: "Fe'l tarafi + (으)ㄹ 때", explain: "… qilganda, … vaqtda ma'nosini beradi. Unli undan keyin 을, undoshdan keyin 을.", examples: [{ ko: "밥을 먹을 때 핸드폰을 봐요.", uz: "Ovqat yeyishda telefon ko'raman." }, { ko: "한국에 갈 때 친구를 만났어요.", uz: "Koreyaga borishda do'stim bilan uchrashdim." }], exercises: [{ q: "___ 때 친구를 만나요. (borish)", options: ["갈", "가", "고"], correct: 0, hint: "Rejalik — 갈 때." }] },
    ],
    listenings: [
      { title: "듣기 · Kundalik reja", audioText: "저는 아침에 일곱 시에 일어나서 운동해요. 그다음에 도서관에서 한국어를 공부합니다.", transcript: "저는 아침에 일곱 시에 일어나서 운동해요. 그다음에 도서관에서 한국어를 공부합니다.", questions: [
        { text: "몇 시에 일어납니까?", options: [{ key: "A", text: "여섯 시" }, { key: "B", text: "일곱 시" }, { key: "C", text: "여덟 시" }], correct: "B", explanation: "일곱 시에 일어나요." },
        { text: "운동 후에 무엇을 합니까?", options: [{ key: "A", text: "공부해요" }, { key: "B", text: "자요" }, { key: "C", text: "밥을 먹어요" }], correct: "A", explanation: "그다음에 도서관에서 공부합니다." },
      ] },
    ],
    writings: [],
  },
  {
    order: 5, title: "Shahar va transport", topic: "교통과 도시 · Transport va shahar", level: "TOPIK I",
    description: "Yo'nalish so'rash, metro va avtobus.",
    vocab: [
      { ko: "지하철", uz: "Metro", tr: "jihacheol", exampleKo: "지하철로 갈게요.", exampleUz: "Metroda boraman." },
      { ko: "버스", uz: "Avtobus", tr: "beoseu", exampleKo: "버스를 타요.", exampleUz: "Avtobusga chiqaman." },
      { ko: "정류장", uz: "Bekat", tr: "jeongnyujang", exampleKo: "정류장이 어디예요?", exampleUz: "Bekat qayerda?" },
      { ko: "갈아타다", uz: "O'tirib qolish (transport)", tr: "garatada", exampleKo: "서울역에서 갈아타요.", exampleUz: "Seul bekatida o'tirib qolaman." },
      { ko: "방향", uz: "Yo'nalish", tr: "banghyang", exampleKo: "어느 방향이에요?", exampleUz: "Qaysi yo'nalish?" },
      { ko: "오다", uz: "Kelmoq", tr: "oda", exampleKo: "버스가 와요.", exampleUz: "Avtobus kelyapti." },
      { ko: "가다", uz: "Bormoq", tr: "gada", exampleKo: "학교에 가요.", exampleUz: "Maktabga boraman." },
      { ko: "거리", uz: "Ko'cha, masofa", tr: "geori", exampleKo: "이 거리는 아주 길어요.", exampleUz: "Bu ko'cha juda uzun." },
    ],
    videos: [],
    grammars: [
      { title: "문법 1 · 에서 / 에", pattern: "Joy + 에서 (uchdan) / 에 (gacha)", explain: "에서 — joydan harakat boshlanishi, 에 — manzil. 버스에서 내렸어요 vs 학교에 갔어요.", examples: [{ ko: "지하철에서 내렸어요.", uz: "Metrodan tushdim." }, { ko: "회사에 갔어요.", uz: "Ishga bordim." }], exercises: [{ q: "___에서 내렸어요. (metro)", options: ["에", "에서", "로"], correct: 1, hint: "Joydan harakat — 에서." }, { q: "학교___ 갔어요.", options: ["에서", "에", "를"], correct: 1, hint: "Manzil — 에." }] },
    ],
    listenings: [
      { title: "듣기 · Yo'nalish so'rash", audioText: "저기요, 이 버스가 시장에 가요? 아니요, 이 버스는 병원 방향이에요. 시장은 3번 버스를 타세요.", transcript: "저기요, 이 버스가 시장에 가요? 아니요, 이 버스는 병원 방향이에요. 시장은 3번 버스를 타세요.", questions: [
        { text: "이 버스는 어디 방향입니까?", options: [{ key: "A", text: "시장" }, { key: "B", text: "병원" }, { key: "C", text: "학교" }], correct: "B", explanation: "병원 방향이에요." },
        { text: "시장에 가려면?", options: [{ key: "A", text: "1번 버스" }, { key: "B", text: "2번 버스" }, { key: "C", text: "3번 버스" }], correct: "C", explanation: "3번 버스를 타세요." },
      ] },
    ],
    writings: [
      { title: "Yo'nalish tarifi", prompt: "Do'stingiz bozorga qanday borishini yozing (metro/avtobus bilan). 80 harfdan ko'proq.", criteria: "Yo'nalish so'zlari: 에서, 에, 갈아타다, 타다", sampleAnswer: "지하철에서 시장 방향으로 타고 두 정류장에서 내리면 시장이 있어요." },
    ],
  },
  {
    order: 6, title: "Fikr bildirish", topic: "의견과 느낌 · Fikr va his-tuyg'u", level: "TOPIK II",
    description: "O'z fikrini bildirish, sabab aytish, rozilik/norozilik.",
    vocab: [
      { ko: "생각하다", uz: "O'ylash, fikr bildirish", tr: "saenggakhada", exampleKo: "제 생각에는 좋아요.", exampleUz: "Mening fikrimcha, yaxshi." },
      { ko: "그러나", uz: "Lekin, ammo", tr: "geureona", exampleKo: "좋습니다. 그러나 비쌉니다.", exampleUz: "Yaxshi. Lekin qimmat." },
      { ko: "때문에", uz: "… tufayli", tr: "tteonimye", exampleKo: "비 때문에 못 갔어요.", exampleUz: "Yomg'ir tufayli bora olmadim." },
      { ko: "중요하다", uz: "Muhim bo'lish", tr: "junyohada", exampleKo: "안전이 중요해요.", exampleUz: "Xavfsizlik muhim." },
      { ko: "노력하다", uz: "Intilish", tr: "noryeokhada", exampleKo: "열심히 노력할게요.", exampleUz: "Jid bilan intilaman." },
      { ko: "발전하다", uz: "Rivojlanish", tr: "baljeonhada", exampleKo: "도시가 발전하고 있어요.", exampleUz: "Shahar rivojlanmoqda." },
      { ko: "환경", uz: "Atrof-muhit", tr: "hwangyeong", exampleKo: "환경을 지켜야 해요.", exampleUz: "Atrof-muhitni himoya qilish kerak." },
      { ko: "문화", uz: "Madaniyat", tr: "munhwa", exampleKo: "한국 문화에 관심이 많아요.", exampleUz: "Koreya madaniyatiga qiziqaman." },
    ],
    videos: [],
    grammars: [
      { title: "문법 1 · -(으)ㄴ다는 생각이다", pattern: "Fe'l + (ㄴ다는 생각이다)", explain: "O'z fikrini yumshoq bildiradi: «… deb o'ylayman». Rasmiy matnlarda ko'p ishlatiladi.", examples: [{ ko: "이 제도가 도움이 된다는 생각입니다.", uz: "Bu yordam beradi deb o'ylayman." }, { ko: "환경 보호가 중요하다고 생각해요.", uz: "Atrof-muhitni himoya qilish muhim deb o'ylayman." }], exercises: [{ q: "Fikr: 이것은 좋___ 생각이다.", options: ["다는", "을", "고"], correct: 0, hint: "고 생각이다 / 라는 생각이다." }] },
      { title: "문법 2 · -(으)므로", pattern: "Fe'l/형용사 + (으)므로", explain: "Rasmiy sabab bog'lovchisi: «… uchun». Yozma matn va rasmiy maqolalarda.", examples: [{ ko: "비용이 높으므로 신중해야 합니다.", uz: "Xarajat yuqori, ehtiyot bo'lish kerak." }], exercises: [{ q: "Rasmiy sabab: 바쁘___ 참석하지 못했습니다.", options: ["서", "므로", "지만"], correct: 1, hint: "으므로 — rasmiy sabab." }] },
    ],
    listenings: [
      { title: "듣기 · Fikr munozarasi", audioText: "외국어 공부가 중요하다고 생각하나요? 네, 세계화 때문에 중요합니다. 다만 회화보다 독해를 먼저 해야 한다는 의견도 있어요.", transcript: "외국어 공부가 중요하다고 생각하나요? 네, 세계화 때문에 중요합니다. 다만 회화보다 독해를 먼저 해야 한다는 의견도 있어요.", questions: [
        { text: "화자는 외국어 공부가 왜 중요하다고 합니까?", options: [{ key: "A", text: "세계화 때문에" }, { key: "B", text: "비용이 싸서" }, { key: "C", text: "시간이 많아서" }], correct: "A", explanation: "세계화 때문에 중요합니다." },
        { text: "두 번째 의견은 무엇입니까?", options: [{ key: "A", text: "회화를 먼저" }, { key: "B", text: "독해를 먼저" }, { key: "C", text: "아예 공부하지 말자" }], correct: "B", explanation: "독해를 먼저 해야 한다는 의견." },
      ] },
    ],
    writings: [
      { title: "Fikr matni (의견 글)", prompt: "외국어 학습의 중요성에 대해 자신의 생각을 쓰십시오. (150자 이상)", criteria: "Fikr + sabab + misol", sampleAnswer: "요즘 외국어를 배우는 사람이 늘고 있다. 세계화 때문에 외국어는 필수가 되었다." },
    ],
  },
  {
    order: 7, title: "Ish va uchrashuv", topic: "직장과 면접 · Ish va suhbat", level: "TOPIK II",
    description: "Ishga kirish, suhbat va kasbiy muloqot.",
    vocab: [
      { ko: "이력서", uz: "Rezyume", tr: "ireokseo", exampleKo: "이력서를 보내 주세요.", exampleUz: "Rezyumeni yuboring." },
      { ko: "면접", uz: "Suhbat (ishga)", tr: "myeonjeop", exampleKo: "내일 면접이 있어요.", exampleUz: "Ertaga suhbat bor." },
      { ko: "경험", uz: "Tajriba", tr: "gyeongheom", exampleKo: "많은 경험이 있어요.", exampleUz: "Ko'p tajribam bor." },
      { ko: "자격증", uz: "Malumotnoma, sertifikat", tr: "jageukjeung", exampleKo: "자격증이 세 개 있어요.", exampleUz: "Uchta sertifikatim bor." },
      { ko: "지원하다", uz: "Ariza berish", tr: "jiwonhada", exampleKo: "그 회사에 지원했어요.", exampleUz: "O'sha kompaniyaga ariza berdim." },
      { ko: "합격하다", uz: "O'tish", tr: "hapgyeokhada", exampleKo: "면접에 합격했어요!", exampleUz: "Suhbatdan o'tdim!" },
      { ko: "급여", uz: "Maosh", tr: "geupyeo", exampleKo: "급여는 어떻게 되나요?", exampleUz: "Maosh qanday?" },
      { ko: "근무하다", uz: "Ishlash (joyda)", tr: "geunmuha", exampleKo: "서울에서 근무합니다.", exampleUz: "Seulda ishlayman." },
    ],
    videos: [],
    grammars: [
      { title: "문법 1 · -(으)ㄹ 수 있다 / 없다", pattern: "Fe'l + (으)ㄹ 수 있다/없다", explain: "Imkoniyat yoki cheklov: «… olmoq/mumkin» va «… ololmoq/yo'q».", examples: [{ ko: "한국어로 이야기할 수 있어요.", uz: "Koreys tilida gapira olaman." }, { ko: "내일은 갈 수 없어요.", uz: "Ertaga bora olmayman." }], exercises: [{ q: "Imkoniyat: 저도 같이 갈___.", options: ["수 있어요", "ㅂ니다", "았어요"], correct: 0, hint: "ㄹ 수 있다 — imkoniyat." }] },
    ],
    listenings: [
      { title: "듣기 · Suhbat", audioText: "이력서를 보고 연락드렸습니다. 어떤 경험을 가지고 있습니까? 두 해 동안 회사에서 일한 경험이 있습니다.", transcript: "이력서를 보고 연락드렸습니다. 어떤 경험을 가지고 있습니까? 두 해 동안 회사에서 일한 경험이 있습니다.", questions: [
        { text: "이 상황은 어디입니까?", options: [{ key: "A", text: "면접" }, { key: "B", text: "병원" }, { key: "C", text: "학교" }], correct: "A", explanation: "이력서, 경험 이야기 — 면접 상황." },
        { text: "지원자는 어떤 경험이 있습니까?", options: [{ key: "A", text: "학교 경험" }, { key: "B", text: "회사 경험" }, { key: "C", text: "경험 없음" }], correct: "B", explanation: "회사에서 일한 경험이 있습니다." },
      ] },
    ],
    writings: [
      { title: "자기소개서 발췌", prompt: "자신의 경험을 중심으로 지원 동기와 각오를 쓰십시오. (200자 이상)", criteria: "경험 + 동기 + 각오", sampleAnswer: "저는 두 해 동안 서비스 업무를 했습니다. 그 경험을 살려 더 큰 무대에서 일하고 싶습니다." },
    ],
  },
  {
    order: 8, title: "Jamoaviy mavzular", topic: "사회 문제 · Jamoaviy muammolar", level: "TOPIK II",
    description: "Ijtimoiy muammolar, ekologiya, texnologiya — chuqur matnlar uchun lug'at.",
    vocab: [
      { ko: "고령화", uz: "Aholi qarishi", tr: "goryeonghwa", exampleKo: "고령화 문제가 심각해요.", exampleUz: "Qarish muammosi jiddiy." },
      { ko: "저출산", uz: "Tug'urilish pastligi", tr: "jeochulsan", exampleKo: "저출산 정책이 필요합니다.", exampleUz: "Tug'urilish bo'yicha siyosat kerak." },
      { ko: "재활용", uz: "Qayta ishlash", tr: "jaehwaryong", exampleKo: "재활용을 생활화해야 해요.", exampleUz: "Qayta ishlashni odatga aylantirish kerak." },
      { ko: "디지털", uz: "Raqamli", tr: "dijiteol", exampleKo: "디지털 시대에 살고 있어요.", exampleUz: "Raqamli asrda yashayapmiz." },
      { ko: "양극화", uz: "Qutblanish (farq)", tr: "yanggeukhwa", exampleKo: "소득 양극화가 커지고 있어요.", exampleUz: "Daromad farqi kattalashmoqda." },
      { ko: "정책", uz: "Siyosat", tr: "cheongchaek", exampleKo: "정부 정책을 지지합니다.", exampleUz: "Hukumat siyosatini qo'llab-quvvatlayman." },
      { ko: "해결", uz: "Hal qilish", tr: "haegyeol", exampleKo: "문제를 해결해야 합니다.", exampleUz: "Muammoni hal qilish kerak." },
      { ko: "공감", uz: "Tushunish, hamdardlik", tr: "gonggam", exampleKo: "서로 공감해야 합니다.", exampleUz: "Bir-birimizni tushunishimiz kerak." },
    ],
    videos: [],
    grammars: [
      { title: "문법 1 · -기 때문에 / -기 때문이다", pattern: "명사형 -기 때문(에)", explain: "Nom shakli + uchun. Rasmiy matnlarda sababni bildiradi.", examples: [{ ko: "교통이 발전하기 때문에 이동이 편해졌다.", uz: "Transport rivojlangani uchun harakat qulaylashdi." }], exercises: [{ q: "___ 때문에 시간이 부족합니다. (바쁘기)", options: ["바쁜", "바쁘기", "바빠서"], correct: 1, hint: "-기 때문에 — nom shakldan." }] },
      { title: "문법 2 · -(으)ㄹ 것이다 (kemik nazar)", pattern: "Fe'l + (으)ㄹ 것이다", explain: "Taxmin yoki kelajak: «… bo'ladi/degan fikrdaman».", examples: [{ ko: "앞으로 더 발전할 것이다.", uz: "Kelajakda yana rivojlanadi deb o'ylayman." }], exercises: [{ q: "Taxmin: 문제도 곧 해결될__.", options: ["수 있다", "것이다", "지만"], correct: 1, hint: "ㄹ 것이다 — taxmin." }] },
    ],
    listenings: [
      { title: "듣기 · Ijtimoiy muhokama", audioText: "요즘 고령화로 인해 노인 빈곤 문제가 커지고 있습니다. 정부와 지역 사회가 함께 해결책을 찾아야 합니다.", transcript: "요즘 고령화로 인해 노인 빈곤 문제가 커지고 있습니다. 정부와 지역 사회가 함께 해결책을 찾아야 합니다.", questions: [
        { text: "이 이야기의 주제는 무엇입니까?", options: [{ key: "A", text: "교육" }, { key: "B", text: "노인 빈곤" }, { key: "C", text: "교통" }], correct: "B", explanation: "고령화, 노인 빈곤 문제." },
        { text: "해결책은 누구의 역할입니까?", options: [{ key: "A", text: "정부와 지역 사회" }, { key: "B", text: "학교만" }, { key: "C", text: "아무도" }], correct: "A", explanation: "정부와 지역 사회가 함께." },
      ] },
    ],
    writings: [
      { title: "사회 문제 에세이", prompt: "저출산 문제의 원인과 해결 방법에 대해 자신의 생각을 쓰십시오. (300자 이상, 원인+해결책 구조)", criteria: "원인 2개 + 해결책 2개 + 결론", sampleAnswer: "출산율이 낮아지는 이유는 육아 부담과 주거비 때문이다. 정부는 지원금과 어린이집 확충으로 해결할 수 있다." },
    ],
  },
];
