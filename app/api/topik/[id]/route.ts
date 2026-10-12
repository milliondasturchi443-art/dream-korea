import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";

// Встроенные вопросы — оригинальные, в стиле TOPIK I / EPS-TOPIK (не скопированы с topik.go.kr)
const SEED_QUESTIONS: Record<string, { text: string; audio?: string; options: { key: string; text: string }[]; correct: string; explanation: string }[]> = {
  seed_topik1_reading: [
    { text: "다음 중 맞는 것을 고르십시오.\n[사진: 칠판 앞에 선생님이 서 있다]", options: [{ key: "A", text: "학생입니다." }, { key: "B", text: "요리사입니다." }, { key: "C", text: "선생님입니다." }, { key: "D", text: "회사원입니다." }], correct: "C", explanation: "Rasmdagi odam doskada — 선생님." },
    { text: "빈칸에 알맞은 말을 고르십시오.\n저는 ___ 입니다.", options: [{ key: "A", text: "학교" }, { key: "B", text: "학생" }, { key: "C", text: "책상" }, { key: "D", text: "의자" }], correct: "B", explanation: "저는 학생입니다 — Men talabaman." },
    { text: "다음 대화를 읽고 알맞은 것을 고르십시오.\n— 안녕하세요?\n— 안녕하세요. 저는 민준입니다.", options: [{ key: "A", text: "민준은 학생입니다." }, { key: "B", text: "인사하는 대화입니다." }, { key: "C", text: "학교에 갑니다." }, { key: "D", text: "책을 읽습니다." }], correct: "B", explanation: "Salomlashish dialogi." },
    { text: "광고문을 읽고 질문에 답하십시오.\n[도서관 개방시간: 09:00~18:00, 토·일 휴관]\n이 도서관은 언제 쉽니까?", options: [{ key: "A", text: "월요일" }, { key: "B", text: "화요일" }, { key: "C", text: "토요일" }, { key: "D", text: "수요일" }], correct: "C", explanation: "토·일 휴관 — shanba va yakshanba yopiq." },
    { text: "빈칸: 어제 친구를 ___ 만났습니다.", options: [{ key: "A", text: "에서" }, { key: "B", text: "에게" }, { key: "C", text: "하고" }, { key: "D", text: "에서" }], correct: "A", explanation: "친구를 공원에서 만났습니다 — do'st bilan bog'da uchrashdim." },
    { text: "다음 중 반대말이 바르게 연결된 것은?", options: [{ key: "A", text: "크다 — 작다" }, { key: "B", text: "크다 — 높다" }, { key: "C", text: "크다 — 길다" }, { key: "D", text: "크다 — 넓다" }], correct: "A", explanation: "크다 ↔ 작다 (katta ↔ kichik)." },
    { text: "일기를 읽고 맞는 것을 고르십시오.\n오늘은 날씨가 좋았습니다. 공원에 가서 사진을 찍었습니다.", options: [{ key: "A", text: "오늘 날씨가 나빴습니다." }, { key: "B", text: "공원에 갔습니다." }, { key: "C", text: "학교에 갔습니다." }, { key: "D", text: "영화를 봤습니다." }], correct: "B", explanation: "일기: 공원에 가서 사진 — bog'ga borib rasmga tushdim." },
    { text: "다음 안내문을 읽고 알맞은 것을 고르십시오.\n[지하철 2호선 공사 — 10월 5일 운행 중단]", options: [{ key: "A", text: "10월 5일에 지하철이 안 됩니다." }, { key: "B", text: "버스가 안 됩니다." }, { key: "C", text: "매일 공사합니다." }, { key: "D", text: "1호선 공사입니다." }], correct: "A", explanation: "2호선 10월 5일 운행 중단." },
    { text: "빈칸: 저는 매일 아침 7시에 ___ .", options: [{ key: "A", text: "읽습니다" }, { key: "B", text: "일어납니다" }, { key: "C", text: "앉습니다" }, { key: "D", text: "씁니다" }], correct: "B", explanation: "아침 7시에 일어납니다 — turomаn." },
    { text: "다음 중 높임말이 바른 것은?", options: [{ key: "A", text: "선생님이 밥을 먹어요." }, { key: "B", text: "선생님이 진지를 드세요." }, { key: "C", text: "선생님이 밥을 잡수세요." }, { key: "D", text: "선생님이 밥을 드세요." }], correct: "B", explanation: "진지를 드시다 — hurmat shakli." },
    { text: "편지를 읽고 답하십시오.\n민수에게, 생일 축하해! 다음 주 토요일에 우리 집에 와. — 지훈\n지훈은 무엇을 초대합니까?", options: [{ key: "A", text: "생일 파티" }, { key: "B", text: "회의" }, { key: "C", text: "여행" }, { key: "D", text: "시험" }], correct: "A", explanation: "생일 축하 — tug'ilgan kun taklifi." },
    { text: "빈칸: 비가 ___ 우산을 가져가세요.", options: [{ key: "A", text: "오니까" }, { key: "B", text: "오다가" }, { key: "C", text: "오기 때문에" }, { key: "D", text: "오면" }], correct: "A", explanation: "비가 오니까 — yomg'ir yog'ayotgani uchun." },
    { text: "다음 중 맞는 문장을 고르십시오.", options: [{ key: "A", text: "저는 어제 친구를 만났습니다." }, { key: "B", text: "저는 어제 친구를 만났습니다에." }, { key: "C", text: "저는 어제 친구를 만나다." }, { key: "D", text: "저는 어제 친구를 만남니다." }], correct: "A", explanation: "만났습니다 — to'g'ri o'tgan zamon." },
    { text: "표지판을 읽으십시오.\n[금연 구역 — 여기서 담배를 피울 수 없습니다]\n이곳에서 무엇을 할 수 없습니까?", options: [{ key: "A", text: "담배를 피울 수 없습니다." }, { key: "B", text: "사진을 찍을 수 없습니다." }, { key: "C", text: "앉을 수 없습니다." }, { key: "D", text: "먹을 수 없습니다." }], correct: "A", explanation: "금연 — chekish taqiqlangan." },
    { text: "빈칸: 한국어는 ___ 어렵지 않습니다.", options: [{ key: "A", text: "생각보다" }, { key: "B", text: "빨리" }, { key: "C", text: "아주" }, { key: "D", text: "항상" }], correct: "A", explanation: "생각보다 어렵지 않습니다 — o'ylagandan qiyin emas." },
  ],
  seed_topik1_listening: [
    { text: "[Listening] 어디에 가요? — 학교에 가요.", audio: "어디에 가요? 학교에 가요.", options: [{ key: "A", text: "학교" }, { key: "B", text: "병원" }, { key: "C", text: "은행" }, { key: "D", text: "시장" }], correct: "A", explanation: "학교에 가요 — maktabga boraman." },
    { text: "[Listening] 지금 몇 시예요? — 열 시예요.", audio: "지금 몇 시예요? 열 시예요.", options: [{ key: "A", text: "9시" }, { key: "B", text: "10시" }, { key: "C", text: "11시" }, { key: "D", text: "12시" }], correct: "B", explanation: "열 시 = 10." },
    { text: "[Listening] 공장에서 일하고 싶어요. — 네, 이력서를 보내 주세요.", audio: "공장에서 일하고 싶어요. 네, 이력서를 보내 주세요.", options: [{ key: "A", text: "이력서" }, { key: "B", text: "여권" }, { key: "C", text: "돈" }, { key: "D", text: "옷" }], correct: "A", explanation: "이력서 — rezyume so'ralmoqda." },
    { text: "[Listening] 내일 몇 시에 만날까요? — 오후 세 시에 만나요.", audio: "내일 몇 시에 만날까요? 오후 세 시에 만나요.", options: [{ key: "A", text: "오전 세 시" }, { key: "B", text: "오후 세 시" }, { key: "C", text: "오후 두 시" }, { key: "D", text: "오전 두 시" }], correct: "B", explanation: "오후 세 시 — kunduz 15:00." },
    { text: "[Listening] 이 가방 얼마예요? — 만 오천 원이에요.", audio: "이 가방 얼마예요? 만 오천 원이에요.", options: [{ key: "A", text: "15,000원" }, { key: "B", text: "50,000원" }, { key: "C", text: "5,000원" }, { key: "D", text: "10,000원" }], correct: "A", explanation: "만 오천 원 = 15,000." },
    { text: "[Listening] 어디가 아파요? — 머리가 아파요.", audio: "어디가 아파요? 머리가 아파요.", options: [{ key: "A", text: "머리" }, { key: "B", text: "배" }, { key: "C", text: "다리" }, { key: "D", text: "손" }], correct: "A", explanation: "머리가 아파요 — bosh og'riyapti." },
    { text: "[Listening] 주말에 뭐 할 거예요? — 친구를 만날 거예요.", audio: "주말에 뭐 할 거예요? 친구를 만날 거예요.", options: [{ key: "A", text: "친구를 만난다" }, { key: "B", text: "영화를 본다" }, { key: "C", text: "책을 읽는다" }, { key: "D", text: "운동을 한다" }], correct: "A", explanation: "친구를 만날 거예요 — do'st bilan uchrashadi." },
    { text: "[Listening] 이 버스는 어디에 가요? — 서울역에 가요.", audio: "이 버스는 어디에 가요? 서울역에 가요.", options: [{ key: "A", text: "서울역" }, { key: "B", text: "부산역" }, { key: "C", text: "공항" }, { key: "D", text: "학교" }], correct: "A", explanation: "서울역 — Seul vokzali." },
    { text: "[Listening] 전화번호가 몇 번이에요? — 010-1234-5678이에요.", audio: "전화번호가 몇 번이에요? 공일공 일이삼사 오육칠팔이에요.", options: [{ key: "A", text: "010-1234-5678" }, { key: "B", text: "010-1234-6578" }, { key: "C", text: "010-1324-5678" }, { key: "D", text: "010-1234-5687" }], correct: "A", explanation: "Raqamni eshitib tanlash." },
    { text: "[Listening] 오늘 날씨가 어때요? — 비가 와요.", audio: "오늘 날씨가 어때요? 비가 와요.", options: [{ key: "A", text: "비가 와요" }, { key: "B", text: "눈이 와요" }, { key: "C", text: "맑아요" }, { key: "D", text: "바람이 불어요" }], correct: "A", explanation: "비가 와요 — yomg'ir yog'yapti." },
    { text: "[Listening] 밥 먹었어요? — 아니요, 아직 안 먹었어요.", audio: "밥 먹었어요? 아니요, 아직 안 먹었어요.", options: [{ key: "A", text: "먹었다" }, { key: "B", text: "아직 안 먹었다" }, { key: "C", text: "먹고 있다" }, { key: "D", text: "먹을 것이다" }], correct: "B", explanation: "아직 안 먹었어요 — hali yegan emas." },
    { text: "[Listening] 여보세요, 민수 씨 계세요? — 지금 자리에 안 계세요.", audio: "여보세요, 민수 씨 계세요? 지금 자리에 안 계세요.", options: [{ key: "A", text: "민수 씨가 있다" }, { key: "B", text: "민수 씨가 없다" }, { key: "C", text: "민수 씨가 잔다" }, { key: "D", text: "민수 씨가 온다" }], correct: "B", explanation: "자리에 안 계세요 — joyida yo'q." },
    { text: "[Listening] 이 옷이 어때요? — 너무 커요.", audio: "이 옷이 어때요? 너무 커요.", options: [{ key: "A", text: "너무 커요" }, { key: "B", text: "너무 작아요" }, { key: "C", text: "잘 맞아요" }, { key: "D", text: "예뻐요" }], correct: "A", explanation: "너무 커요 — juda katta." },
    { text: "[Listening] 내일 비가 올까요? — 네, 우산을 가져가세요.", audio: "내일 비가 올까요? 네, 우산을 가져가세요.", options: [{ key: "A", text: "우산을 가져가라" }, { key: "B", text: "우산을 샀다" }, { key: "C", text: "비가 안 온다" }, { key: "D", text: "우산이 없다" }], correct: "A", explanation: "우산을 가져가세요 — soyabon olib oling." },
    { text: "[Listening] 어디에서 일해요? — 병원에서 일해요.", audio: "어디에서 일해요? 병원에서 일해요.", options: [{ key: "A", text: "병원" }, { key: "B", text: "학교" }, { key: "C", text: "공장" }, { key: "D", text: "은행" }], correct: "A", explanation: "병원에서 일해요 — shifoxonada ishlaydi." },
  ],
  seed_topik1_full: [],
  seed_topik2_reading: [
    { text: "신문 기사를 읽고 답하십시오.\n[정부는 외국인 근로자의 안전교육을 강화하기로 했다.]\n정부는 무엇을 강화합니까?", options: [{ key: "A", text: "안전교육" }, { key: "B", text: "임금" }, { key: "C", text: "비자 발급" }, { key: "D", text: "숙소 제공" }], correct: "A", explanation: "안전교육을 강화 — xavfsizlik ta'limi kuchaytiriladi." },
    { text: "빈칸: 이 문제는 ___ 해결할 수 있다.", options: [{ key: "A", text: "쉽게" }, { key: "B", text: "어렵게" }, { key: "C", text: "빨리빨리" }, { key: "D", text: "천천히" }], correct: "A", explanation: "쉽게 해결할 수 있다 — oson hal qilish mumkin." },
    { text: "다음 글을 읽고 중심 생각을 고르십시오.\n한국어 공부는 꾸준함이 중요하다. 매일 조금씩 해도 1년이면 큰 변화가 생긴다.", options: [{ key: "A", text: "꾸준함이 중요하다" }, { key: "B", text: "한국어는 어렵다" }, { key: "C", text: "1년이면 끝난다" }, { key: "D", text: "매일 많이 해야 한다" }], correct: "A", explanation: "꾸준함 — izchillik muhim." },
    { text: "빈칸: 비가 많이 ___ 행사가 취소되었다.", options: [{ key: "A", text: "와서" }, { key: "B", text: "오니까" }, { key: "C", text: "와도" }, { key: "D", text: "오면" }], correct: "A", explanation: "비가 많이 와서 — kuchli yomg'ir tufayli bekor qilindi." },
    { text: "그래프를 보고 맞는 것을 고르십시오.\n[한국어 학습자: 2020년 10만 → 2024년 25만]\n무슨 변화가 있었습니까?", options: [{ key: "A", text: "학습자가 증가했다" }, { key: "B", text: "학습자가 감소했다" }, { key: "C", text: "변화가 없다" }, { key: "D", text: "절반으로 줄었다" }], correct: "A", explanation: "10만 → 25만 — ko'paydi." },
  ],
  seed_eps_reading: [
    { text: "[EPS] 작업장에서 안전모를 ___ .", options: [{ key: "A", text: "써야 합니다" }, { key: "B", text: "벗어야 합니다" }, { key: "C", text: "버려야 합니다" }, { key: "D", text: "사야 합니다" }], correct: "A", explanation: "안전모를 써야 합니다 — kaska kiyish kerak." },
    { text: "[EPS] 이 기계는 하루에 8시간 ___ .", options: [{ key: "A", text: "사용합니다" }, { key: "B", text: "읽습니다" }, { key: "C", text: "먹습니다" }, { key: "D", text: "잡니다" }], correct: "A", explanation: "8시간 사용합니다 — 8 soat ishlatiladi." },
    { text: "[EPS] 월급은 매달 25일에 ___ .", options: [{ key: "A", text: "입금됩니다" }, { key: "B", text: "사라집니다" }, { key: "C", text: "나옵니다" }, { key: "D", text: "끝납니다" }], correct: "A", explanation: "입금됩니다 — hisobga tushadi." },
    { text: "[EPS] 위험할 때는 비상벨을 ___ .", options: [{ key: "A", text: "누르세요" }, { key: "B", text: "버리세요" }, { key: "C", text: "닦으세요" }, { key: "D", text: "끄세요" }], correct: "A", explanation: "비상벨을 누르세요 — favqulodda qo'ng'iroqni bosing." },
    { text: "[EPS] 계약서를 잘 ___ 서명하세요.", options: [{ key: "A", text: "읽고" }, { key: "B", text: "먹고" }, { key: "C", text: "자고" }, { key: "D", text: "보고" }], correct: "A", explanation: "읽고 서명하세요 — o'qib imzo cheking." },
  ],
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = requireAdmin(req);
  const wantSolutions = admin || new URL(req.url).searchParams.get("solutions") === "1";
  if (id.startsWith("seed_")) {
    const qs = SEED_QUESTIONS[id] ?? SEED_QUESTIONS.seed_topik1_reading;
    if (id === "seed_topik1_full") {
      const all = [...SEED_QUESTIONS.seed_topik1_reading, ...SEED_QUESTIONS.seed_topik1_listening];
      return Response.json({
        id, title: "TOPIK I — Full Mock (30 savol)", level: "TOPIK I", type: "Full", time: "80 daq",
        questions: all.map((q, i) => ({
          id: String(i + 1), text: q.text, audio: q.audio, options: q.options,
          ...(wantSolutions ? { correct: q.correct, explanation: q.explanation } : {}),
        })),
      });
    }
    if (id === "seed_eps_reading") {
      return Response.json({
        id, title: "EPS-TOPIK — Mehnat xavfsizligi", level: "EPS", type: "Reading", time: "20 daq",
        questions: qs.map((q, i) => ({
          id: String(i + 1), text: q.text, audio: q.audio, options: q.options,
          ...(wantSolutions ? { correct: q.correct, explanation: q.explanation } : {}),
        })),
      });
    }
    return Response.json({
      id,
      title: id.includes("listening") ? "TOPIK I — Listening (15 savol)" : id.includes("topik2") ? "TOPIK II — Reading" : id.includes("eps") ? "EPS-TOPIK" : "TOPIK I — Reading (15 savol)",
      level: id.startsWith("seed_topik2") ? "TOPIK II" : id.startsWith("seed_eps") ? "EPS" : "TOPIK I",
      type: id.includes("full") ? "Full" : id.includes("listening") ? "Listening" : "Reading",
      time: id.includes("full") ? "80 daq" : id.includes("eps") ? "20 daq" : "40 daq",
      questions: qs.map((q, i) => ({
        id: String(i + 1), text: q.text, audio: q.audio, options: q.options,
        ...(wantSolutions ? { correct: q.correct, explanation: q.explanation } : {}),
      })),
    });
  }
  try {
    const test = await prisma.test.findUnique({ where: { id }, include: { questions: { orderBy: { order: "asc" } } } });
    if (!test) return Response.json({ error: "Topilmadi" }, { status: 404 });
    return Response.json({
      id: test.id,
      title: test.title,
      level: test.level,
      type: test.type,
      questions: test.questions.map(q => {
        const base: Record<string, unknown> = {
          id: q.id,
          text: q.text,
          options: Array.isArray(q.options) ? (q.options as { key: string; text: string }[]) : [{ key: "A", text: String(q.options) }],
        };
        if (wantSolutions) { base.correct = q.correct; base.explanation = q.explanation ?? ""; }
        return base;
      }),
    });
  } catch (e) {
    console.error("GET /api/topik/[id]", e);
    return Response.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// ==== ADMIN: savol qo'shish / test o'chirish ====
import { verify, readAuthToken } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";

function requireAdmin(req: Request) {
  const token = readAuthToken(req);
  const d = verify(token);
  return !!d && d.role === "ADMIN" && isAdminEmail(String(d.email ?? ""));
}

// POST /api/topik/[id] — testga savol qo'shish (ADMIN)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  if (id.startsWith("seed_")) return Response.json({ error: "Seed testga savol qo'shib bo'lmaydi" }, { status: 400 });
  let body: { text?: string; options?: { key: string; text: string }[]; correct?: string; explanation?: string } = {};
  try { body = await req.json(); } catch {}
  const text = String(body.text ?? "").trim();
  if (!text) return Response.json({ error: "Savol matnini kiriting" }, { status: 400 });
  const options = Array.isArray(body.options) && body.options.length >= 2
    ? body.options.map((o, i) => ({ key: String(o.key || "ABCD"[i] || "A").toUpperCase(), text: String(o.text ?? "") }))
    : [{ key: "A", text: "—" }, { key: "B", text: "—" }, { key: "C", text: "—" }, { key: "D", text: "—" }];
  const correct = String(body.correct ?? "A").trim().toUpperCase() || "A";
  if (!options.some(o => o.key === correct)) {
    return Response.json({ error: "To'g'ri javob variantlardan biri bo'lishi kerak" }, { status: 400 });
  }
  try {
    const test = await prisma.test.findUnique({ where: { id }, select: { id: true } });
    if (!test) return Response.json({ error: "Test topilmadi" }, { status: 404 });
    const last = await prisma.question.findFirst({ where: { testId: id }, orderBy: { order: "desc" } });
    const q = await prisma.question.create({
      data: {
        testId: id,
        text,
        options,
        correct,
        explanation: String(body.explanation ?? "").trim() || undefined,
        order: (last?.order ?? -1) + 1,
      },
    });
    return Response.json({ ok: true, question: q });
  } catch (e) {
    console.error("POST /api/topik/[id] savol", e);
    return Response.json({ error: "Saqlab bo'lmadi" }, { status: 500 });
  }
}

// DELETE /api/topik/[id] — testni o'chirish; ?question=qid — faqat savolni o'chirish (ADMIN)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  if (id.startsWith("seed_")) return Response.json({ error: "Seed testni o'chirib bo'lmaydi" }, { status: 400 });
  const questionId = new URL(req.url).searchParams.get("question");
  try {
    if (questionId) {
      const q = await prisma.question.findUnique({ where: { id: questionId }, select: { testId: true } });
      if (!q) return Response.json({ error: "Savol topilmadi" }, { status: 404 });
      if (q.testId !== id) return Response.json({ error: "Savol bu testga tegishli emas" }, { status: 400 });
      await prisma.question.delete({ where: { id: questionId } });
      return Response.json({ ok: true });
    }
    const test = await prisma.test.findUnique({ where: { id }, select: { id: true } });
    if (!test) return Response.json({ error: "Test topilmadi" }, { status: 404 });
    await prisma.testAttempt.deleteMany({ where: { testId: id } });
    await prisma.question.deleteMany({ where: { testId: id } });
    await prisma.test.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/topik/[id]", e);
    return Response.json({ error: "O'chirib bo'lmadi" }, { status: 500 });
  }
}
