// Original TOPIK II 쓰기 mashqlari — style of official prompts, but fully original content.
export type WritingPrompt = {
  id: string;
  no: number; // 51 | 53 | 54 (official part numbers)
  minutes: number;
  minChars: number;
  level: string; // "3-4" | "5-6"
  title: string;
  promptKo: string;
  promptUz: string;
  keywords: string[];
  sample: string;
};

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: "w51-1", no: 51, minutes: 10, minChars: 50, level: "3-4", title: "일상 일기",
    promptKo: "어제 주말에 무엇을 했는지에 대하여 50자 이상으로 쓰십시오.",
    promptUz: "Kecha dam olish kunida nima qilganingiz haqida 50 harfdan ko'proq yozing.",
    keywords: ["어제", "주말", "했"],
    sample: "어제 주말에 친구를 만나서 영화를 봤어요. 영화관에 갔다가 저녁에 함께 밥도 먹었어요.",
  },
  {
    id: "w51-2", no: 51, minutes: 10, minChars: 50, level: "3-4", title: "인기 있는 음식",
    promptKo: "가장 좋아하는 음식이 무엇인지, 왜 좋아하는지 50자 이상으로 쓰십시오.",
    promptUz: "Eng sevishingiz ovqat nima va nima uchun yoqishini 50 harfdan ko'proq yozing.",
    keywords: ["음식", "좋아", "왜"],
    sample: "제가 가장 좋아하는 음식은 비빔밥입니다. 맛있고 영양가가 높기 때문입니다.",
  },
  {
    id: "w53-1", no: 53, minutes: 20, minChars: 150, level: "3-4", title: "다문화 가정",
    promptKo: "다문화 가정에 대한 아래 내용을 중심으로 자신만의 생각을 150자 이상으로 쓰십시오.\n[출제 이유] 외국인과 결혼한 가정이 점점 늘고 있다. 서로 다른 문화를 이해하는 방법에 대해 생각해 보라.",
    promptUz: "Ko'p madaniyatli oilalar haqida o'z fikringizni 150 harfdan ko'proq yozing.\n[Savol sababi] Boshqa mamlakat odamlari bilan oila qurish ortib bormoqda. Madaniyatlarni qanday tushunish kerak?",
    keywords: ["다문화", "서로", "이해"],
    sample: "다문화 가정이 늘어나면서 서로 다른 문화를 존중하는 태도가 필요하다고 생각합니다.",
  },
  {
    id: "w53-2", no: 53, minutes: 20, minChars: 150, level: "3-4", title: "스트레스 해소",
    promptKo: "현대인의 스트레스와 그 해소 방법에 대해 아래 내용을 참고하여 150자 이상으로 쓰십시오.\n[출제 이유] 직장과 학업으로 인한 스트레스가 많다. 자신만의 해소 방법을 소개하라.",
    promptUz: "Zamonaviy odamlarning stressi va uni yengish usullari haqida 150 harfdan ko'proq yozing.",
    keywords: ["스트레스", "방법", "운동"],
    sample: "현대인은 많은 스트레스를 받는다. 저는 스트레스를 풀기 위해 운동과 음악을 듣습니다.",
  },
  {
    id: "w54-1", no: 54, minutes: 30, minChars: 400, level: "5-6", title: "외국어 학습",
    promptKo: "외국어를 배우는 것에 대한 아래 내용을 중심으로 자신의 생각을 다음과 같은 순서로 쓰십시오.\n1. 외국어를 배우는 사람이 늘고 있다. 2. 외국어를 배우는 이유는 다양하다. 3. 외국어 학습에 대한 자신의 생각 (400자 이상)",
    promptUz: "Chet til o'rganish haqida o'z fikringizni quyidagi tartibda 400 harfdan ko'proq yozing.\n1. Chet til o'rganuvchilar ko'paymoqda. 2. Sabablar turlicha. 3. O'z fikringiz.",
    keywords: ["외국어", "이유", "생각"],
    sample: "요즘 외국어를 배우는 사람이 점점 늘고 있다. 외국어를 배우는 이유는 일과 공부 등 다양하다.",
  },
  {
    id: "w54-2", no: 54, minutes: 30, minChars: 400, level: "5-6", title: "저출산 문제",
    promptKo: "저출산 문제에 대한 아래 내용을 중심으로 자신의 생각을 다음과 같은 순서로 쓰십시오.\n1. 출산율이 점점 낮아지고 있다. 2. 그 원인은 경제적 부담과 양육 문제 등이다. 3. 이 문제를 해결하기 위한 방법에 대한 자신의 생각 (400자 이상)",
    promptUz: "Tug'urilik darajasining pasayishi muammosi haqida o'z fikringizni 400 harfdan ko'proq yozing.",
    keywords: ["출산율", "원인", "해결"],
    sample: "한국에서는 출산율이 점점 낮아지고 있다. 그 원인은 주택비와 육아 부담이다.",
  },
  {
    id: "w54-3", no: 54, minutes: 30, minChars: 400, level: "5-6", title: "노인 문제",
    promptKo: "노인 문제에 대한 아래 내용을 중심으로 자신의 생각을 다음과 같은 순서로 쓰십시오.\n1. 노인 인구가 늘고 있다. 2. 노인들에게는 경제와 건강 등 여러 문제가 있다. 3. 이 문제를 해결하기 위한 방법에 대한 자신의 생각 (400자 이상)",
    promptUz: "Keksalar muammosi haqida o'z fikringizni 400 harfdan ko'proq yozing.",
    keywords: ["노인", "건강", "해결"],
    sample: "노인 인구가 늘면서 경제적 어려움과 건강 문제가 커지고 있다. 정부의 지원이 필요하다.",
  },
  {
    id: "w51-3", no: 51, minutes: 10, minChars: 50, level: "3-4", title: "주말 계획",
    promptKo: "다음 주말에 무엇을 할 계획인지 50자 이상으로 쓰십시오.",
    promptUz: "Kelasi dam olish kunida nima qilish rejangiz borligini 50 harfdan ko'proq yozing.",
    keywords: ["주말", "계획", "할"],
    sample: "다음 주말에는 도서관에 가서 한국어 공부를 할 계획입니다. 친구와도 만나기로 했습니다.",
  },
];

export function promptById(id: string) { return WRITING_PROMPTS.find(p => p.id === id) ?? null; }
