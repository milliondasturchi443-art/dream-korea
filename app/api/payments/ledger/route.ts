import { prisma } from "@/lib/db";
import { resolveSession } from "@/lib/session";
import { accountTotals, currentBillingMonth, monthlyTotals, monthSchema, operationSchema, paymentBillingMonth } from "@/lib/payment-accounting";
import { financialTransaction, initializePaymentMonth, monthId, mutateLedger, PaymentError, studentSelect, teacherSnapshot } from "@/lib/payment-ledger";

export const dynamic = "force-dynamic";

async function authorize(req: Request) {
  const { session, reason } = await resolveSession(req);
  if (!session) return Response.json({ error: reason === "DB_ERROR" ? "Baza bilan aloqa yo‘q" : "Kirish talab qilinadi" }, { status: reason === "DB_ERROR" ? 503 : 401 });
  if (session.role !== "ADMIN") return Response.json({ error: "Faqat administrator" }, { status: 403 });
  return session;
}

export async function GET(req: Request) {
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;
  const month = new URL(req.url).searchParams.get("billingMonth") ?? currentBillingMonth();
  if (!monthSchema.safeParse(month).success) return Response.json({ error: "Hisob oyi YYYY-MM formatida bo‘lsin" }, { status: 400 });
  try {
    const userId = new URL(req.url).searchParams.get("userId");
    if (userId) {
      if (!/^[a-f\d]{24}$/i.test(userId)) return Response.json({ error: "ID noto‘g‘ri" }, { status: 400 });
      const student = await prisma.user.findUnique({ where: { id: userId }, select: { monthlyFee: true, role: true } });
      if (!student || student.role !== "STUDENT") return Response.json({ error: "O‘quvchi topilmadi" }, { status: 404 });
      const totals = await financialTransaction(async tx => {
        const account = await tx.paymentMonth.findUnique({ where: { id: monthId(userId, month) } });
        const payments = await tx.payment.findMany({ where: { userId } });
        return accountTotals(account?.tuition ?? (month >= currentBillingMonth() ? student.monthlyFee : null), payments.filter(p => paymentBillingMonth(p) === month));
      });
      return Response.json(totals, { headers: { "Cache-Control": "no-store" } });
    }
    await initializePaymentMonth(month);
    const [students, accounts, payments] = await financialTransaction(async tx => Promise.all([
      tx.user.findMany({ where: { role: "STUDENT", OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }] }, select: studentSelect, orderBy: { name: "asc" } }),
      tx.paymentMonth.findMany(),
      tx.payment.findMany({ orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
    ]));
    const rows = students.map(student => {
      const account = accounts.find(a => a.userId === student.id && a.billingMonth === month);
      const snapshot = account ?? teacherSnapshot(student);
      return {
        id: student.id, name: student.name, email: student.email,
        teacherIds: snapshot.teacherIds, teacherNames: snapshot.teacherNames,
        groups: student.groupMembers.map(m => m.group.name),
        lessonHours: account?.lessonHours ?? null,
        ...accountTotals(account?.tuition ?? null, payments.filter(p => p.userId === student.id && paymentBillingMonth(p) === month)),
      };
    });
    const months = [...new Set([month, ...accounts.map(a => a.billingMonth), ...payments.map(paymentBillingMonth).filter((m): m is string => !!m)])].sort();
    const chart = months.map(billingMonth => {
      const userIds = new Set([...accounts.filter(a => a.billingMonth === billingMonth).map(a => a.userId), ...payments.filter(p => paymentBillingMonth(p) === billingMonth).map(p => p.userId)]);
      return { billingMonth, ...monthlyTotals([...userIds].map(userId => accountTotals(
        accounts.find(a => a.userId === userId && a.billingMonth === billingMonth)?.tuition ?? null,
        payments.filter(p => p.userId === userId && paymentBillingMonth(p) === billingMonth),
      ))) };
    });
    const teachers = new Map<string, string>();
    for (const row of rows) row.teacherIds.forEach((id, i) => teachers.set(id, row.teacherNames[i]));
    return Response.json({ billingMonth: month, students: rows, summary: chart.find(c => c.billingMonth === month), chart,
      teachers: [...teachers].map(([id, name]) => ({ id, name })),
      history: payments.map(p => ({ id: p.id, userId: p.userId, studentName: p.user.name, billingMonth: paymentBillingMonth(p), legacyMonth: p.month,
        type: p.operationType === "REFUND" ? "REFUND" : "PAYMENT", amount: p.amount, status: p.status,
        operationDate: p.operationDate ?? p.paidAt?.toISOString().slice(0, 10) ?? null,
        createdAt: p.createdAt, note: p.note, voidedAt: p.voidedAt,
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("payment ledger read", error);
    return Response.json({ error: "Moliyaviy ma’lumotlarni yuklab bo‘lmadi" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;
  const parsed = operationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Operatsiya maydonlarini tekshiring", details: parsed.error.flatten() }, { status: 400 });
  try { return Response.json(await mutateLedger(parsed.data, auth.id || auth.email)); }
  catch (error) {
    if (error instanceof PaymentError) return Response.json({ error: error.message }, { status: error.status });
    console.error("payment ledger write", error);
    return Response.json({ error: "Operatsiya saqlanmadi. Qayta urinish xavfsiz." }, { status: 503 });
  }
}
