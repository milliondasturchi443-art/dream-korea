// Original teaching content. Media must be supplied by the administrator.
export const SEED_UNITS = [
  { order: 1, title: "Tanishuv", topic: "인사 · Tanishuv", level: "TOPIK I", description: "O‘zingizni tanishtirish va salomlashish.",
    vocab: [
      { ko: "학생", uz: "Talaba", tr: "haksaeng", exampleKo: "저는 학생입니다.", exampleUz: "Men talabaman." },
      { ko: "이름", uz: "Ism", tr: "ireum", exampleKo: "이름이 뭐예요?", exampleUz: "Ismingiz nima?" },
      { ko: "친구", uz: "Do‘st", tr: "chingu", exampleKo: "친구를 만나요.", exampleUz: "Do‘stim bilan uchrashaman." },
    ],
    videos: [] as { title: string; videoUrl: string; duration?: string }[],
    grammars: [{ title: "문법 1 · 입니다", pattern: "Ot + 입니다", explain: "입니다 otga qo‘shilib, rasmiy-hurmatli tasdiq gap yasaydi. Savol shakli 입니까? Unli yoki undoshdan keyin bir xil yoziladi.", examples: [{ ko: "저는 학생입니다.", uz: "Men talabaman." }], exercises: [{ q: "Rasmiy tasdiq: 저는 학생__.", options: ["입니까", "입니다", "을"], correct: 1 }] }],
    listenings: [{ title: "듣기 · Tanishuv", audioText: "안녕하세요. 제 이름은 민수입니다. 저는 학생입니다.", transcript: "안녕하세요. 제 이름은 민수입니다. 저는 학생입니다.", questions: [{ text: "민수는 누구입니까?", options: [{ key: "A", text: "의사" }, { key: "B", text: "학생" }, { key: "C", text: "선생님" }], correct: "B", explanation: "저는 학생입니다 — Men talabaman." }] }],
    writings: [] as { title: string; prompt: string; criteria?: string }[],
  },
];
