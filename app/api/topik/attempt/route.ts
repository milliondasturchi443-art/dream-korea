import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
export const dynamic = "force-dynamic";

const SEED_CORRECT: Record<string, Record<string, string>> = {
  seed_topik1_reading: { "1":"C","2":"B","3":"B","4":"C","5":"A","6":"A","7":"B","8":"A","9":"B","10":"B","11":"A","12":"A","13":"A","14":"A","15":"A" },
  seed_topik1_listening: { "1":"A","2":"B","3":"A","4":"B","5":"A","6":"A","7":"A","8":"A","9":"A","10":"A","11":"B","12":"B","13":"A","14":"A","15":"A" },
  seed_topik2_reading: { "1":"A","2":"A","3":"A","4":"A","5":"A" },
  seed_eps_reading: { "1":"A","2":"A","3":"A","4":"A","5":"A" },
};

function seedMapFor(testId: string): Record<string,string>|null {
  if (testId==="seed_topik1_full") {
    const full: Record<string,string> = {};
    let i=1;
    for (const c of Object.values(SEED_CORRECT.seed_topik1_reading)) full[String(i++)]=c;
    for (const c of Object.values(SEED_CORRECT.seed_topik1_listening)) full[String(i++)]=c;
    return full;
  }
  return SEED_CORRECT[testId] ?? null;
}

export async function POST(req: Request) {
  let body: { testId?: string; answers?: Record<string,string> } = {};
  try { body = await req.json(); } catch {}
  const testId = String(body.testId ?? "").trim();
  const rawAns = body.answers ?? {};
  if (!testId) return Response.json({ error:"testId kerak" }, { status:400 });
  const answers: Record<string,string> = {};
  for (const [k,v] of Object.entries(rawAns)) {
    if (typeof k==="string" && typeof v==="string" && k.length<=64 && v.length<=8) answers[k]=v.trim().toUpperCase();
  }
  const token = readAuthToken(req);
  const data = token ? verify(token) : null;
  const userId = data ? String((data as Record<string,unknown>).id ?? "") : "";
  let score=0, total=0;
  try {
    if (testId.startsWith("seed_")) {
      const map = seedMapFor(testId);
      if (!map) return Response.json({ error:"Test topilmadi" }, { status:404 });
      total=Object.keys(map).length;
      score=Object.entries(answers).filter(([k,v])=>map[k]===v).length;
    } else {
      const qs = await prisma.question.findMany({ where:{ testId }, select:{ id:true, correct:true } });
      if (!qs.length) return Response.json({ error:"Test topilmadi yoki savollari yo'q" }, { status:404 });
      const byId = Object.fromEntries(qs.map(q=>[q.id, String(q.correct).trim().toUpperCase()]));
      total=qs.length;
      for (const [qid, ans] of Object.entries(answers)) if (byId[qid] && ans===byId[qid]) score++;
    }
  } catch(e){ console.error("attempt scoring",e); return Response.json({ error:"Saqlab bo'lmadi" }, { status:500 }); }
  if (userId && !testId.startsWith("seed_")) {
    try { await prisma.testAttempt.create({ data:{ userId, testId, score, total, answers } }); } catch(e){ console.error("attempt save",e); }
  }
  const pct = total ? Math.round(score/total*100) : 0;
  return Response.json({ ok:true, score, total, pct, isSeed:testId.startsWith("seed_") });
}

export async function GET(req: Request) {
  const token = readAuthToken(req);
  const data = token ? verify(token) : null;
  if (!data) return Response.json({ error:"Auth kerak" }, { status:401 });
  const userId = String((data as Record<string,unknown>).id ?? "");
  if (!userId) return Response.json({ attempts:[] });
  try {
    const atts = await prisma.testAttempt.findMany({ where:{ userId }, orderBy:{ createdAt:"desc" }, take:20, include:{ test:{ select:{ title:true, level:true } } } });
    return Response.json({ attempts:atts });
  } catch(e){ console.error("GET attempts",e); return Response.json({ attempts:[] }); }
}
