import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { accountTotals, currentBillingMonth, operationSchema, paymentBillingMonth } from "@/lib/payment-accounting";
import type { z } from "zod";

export class PaymentError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const ledgerId = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 24);
export const monthId = (userId: string, month: string) => ledgerId(`payment-month:${userId}:${month}`);

export const studentSelect = {
  id: true, name: true, email: true, role: true, monthlyFee: true, lessonHours: true, createdAt: true,
  groupMembers: { select: { group: { select: { name: true, teacherId: true, teacher: { select: { id: true, name: true } } } } } },
} satisfies Prisma.UserSelect;

export function teacherSnapshot(student: Prisma.UserGetPayload<{ select: typeof studentSelect }>) {
  const teachers = new Map<string, string>();
  for (const m of student.groupMembers) if (m.group.teacher) teachers.set(m.group.teacher.id, m.group.teacher.name);
  return { teacherIds: [...teachers.keys()], teacherNames: [...teachers.values()] };
}

// Mongo transaction retries are bounded. All mutations touch the monthly
// revision, serializing payments/refunds/voids for one student-month so concurrent
// refunds cannot both spend the same balance.
export async function financialTransaction<T>(run: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await prisma.$transaction(run, { maxWait: 10000, timeout: 20000 }); }
    catch (error) {
      const code = (error as { code?: string }).code;
      if (attempt >= 4 || !["P2034", "P2002"].includes(code ?? "")) throw error;
    }
  }
}

export async function initializePaymentMonth(billingMonth: string) {
  const students = await prisma.user.findMany({ where: { role: "STUDENT", OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }] }, select: studentSelect });
  const existing = await prisma.paymentMonth.findMany({ where: { billingMonth }, select: { userId: true } });
  const have = new Set(existing.map(row => row.userId));
  // Lazy, durable month opening: each student gets an independent snapshot.
  // Historical months do not inherit today's tariff or lesson hours.
  for (const s of students) {
    if (have.has(s.id) || s.createdAt.toISOString().slice(0, 7) > billingMonth) continue;
    await financialTransaction(async tx => {
      const id = monthId(s.id, billingMonth);
      if (await tx.paymentMonth.findUnique({ where: { id } })) return;
      await tx.paymentMonth.create({ data: {
        id, userId: s.id, billingMonth,
        tuition: billingMonth >= currentBillingMonth() ? s.monthlyFee : null,
        lessonHours: billingMonth >= currentBillingMonth() ? s.lessonHours : null,
        ...teacherSnapshot(s),
      } });
    });
  }
}

export async function mutateLedger(input: z.infer<typeof operationSchema>, actorId: string) {
  const receiptId = ledgerId(`payment-request:${input.requestId}`);
  const fingerprint = createHash("sha256").update(JSON.stringify({ ...input, actorId })).digest("hex");
  return financialTransaction(async tx => {
    const previous = await tx.paymentRequest.findUnique({ where: { id: receiptId } });
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new PaymentError("So‘rov kaliti boshqa operatsiya uchun ishlatilgan", 409);
      return previous.result;
    }
    const student = await tx.user.findUnique({ where: { id: input.userId }, select: studentSelect });
    if (!student || student.role !== "STUDENT") throw new PaymentError("O‘quvchi topilmadi", 404);
    const id = monthId(input.userId, input.billingMonth);
    let account = await tx.paymentMonth.findUnique({ where: { id } });
    if (!account) account = await tx.paymentMonth.create({ data: {
      id, userId: input.userId, billingMonth: input.billingMonth,
      tuition: input.tuition ?? (input.billingMonth >= currentBillingMonth() ? student.monthlyFee : null),
      lessonHours: input.lessonHours ?? (input.billingMonth >= currentBillingMonth() ? student.lessonHours : null),
      ...teacherSnapshot(student),
    } });
    await tx.paymentMonth.update({ where: { id }, data: { revision: { increment: 1 } } });
    const payments = await tx.payment.findMany({ where: { userId: input.userId } });
    const monthly = payments.filter(p => paymentBillingMonth(p) === input.billingMonth);
    const totals = accountTotals(account.tuition, monthly);
    const actor = /^[a-f\d]{24}$/i.test(actorId) ? actorId : undefined;
    let paymentId: string | null = null;
    if (input.action === "TARIFF") {
      if (input.tuition === undefined) throw new PaymentError("Oylik narxni kiriting");
      await tx.paymentMonth.update({ where: { id }, data: { tuition: input.tuition, ...(input.lessonHours !== undefined ? { lessonHours: input.lessonHours } : {}) } });
      if (input.setDefault) await tx.user.update({ where: { id: student.id }, data: { monthlyFee: input.tuition, ...(input.lessonHours !== undefined ? { lessonHours: input.lessonHours } : {}) } });
    } else if (["PAYMENT", "REFUND", "REMINDER"].includes(input.action)) {
      if (input.amount === undefined || !input.operationDate) throw new PaymentError("Summa va operatsiya sanasi kerak");
      if (input.action === "REFUND" && input.amount > totals.net) throw new PaymentError("Qaytarish summasi mavjud to‘lovdan oshmasligi kerak", 409);
      if (input.action !== "REFUND") {
        if (account.tuition === null && input.tuition === undefined) throw new PaymentError("Bu oy uchun oylik narxni belgilang");
        if (input.tuition !== undefined && account.tuition !== null && input.tuition !== account.tuition) throw new PaymentError("Tarif o‘zgargan. Avval oylik narxni alohida saqlang", 409);
        if (account.tuition === null) await tx.paymentMonth.update({ where: { id }, data: { tuition: input.tuition } });
      }
      const p = await tx.payment.create({ data: {
        userId: input.userId, billingMonth: input.billingMonth, month: input.billingMonth,
        amount: input.amount, method: input.action === "REMINDER" ? "reminder" : input.method,
        operationType: input.action === "REFUND" ? "REFUND" : "PAYMENT",
        status: input.action === "REMINDER" ? "PENDING" : "PAID",
        operationDate: input.operationDate, paidAt: input.action === "REMINDER" ? null : new Date(`${input.operationDate}T00:00:00Z`),
        note: input.note || null, createdById: actor, paidById: input.action === "REMINDER" ? undefined : actor,
      } });
      paymentId = p.id;
      await tx.notification.create({ data: { userId: student.id,
        title: input.action === "REFUND" ? "Mablag‘ qaytarildi" : input.action === "REMINDER" ? "To‘lov eslatmasi" : "To‘lov qabul qilindi",
        body: `${input.billingMonth}: ${input.amount.toLocaleString("uz-UZ")} UZS. ${input.note}`,
      } });
    } else {
      const p = payments.find(p => p.id === input.paymentId);
      if (!p) throw new PaymentError("Operatsiya topilmadi", 404);
      if (input.action === "ASSIGN") {
        if (paymentBillingMonth(p)) throw new PaymentError("Hisob oyi allaqachon belgilangan", 409);
        if (!input.note) throw new PaymentError("Hisob oyini tasdiqlovchi ma’lumotni izohda ko‘rsating");
        await tx.payment.update({ where: { id: p.id }, data: { billingMonth: input.billingMonth } });
      } else {
        if (paymentBillingMonth(p) !== input.billingMonth || p.voidedAt) throw new PaymentError("Operatsiya boshqa oyga tegishli yoki bekor qilingan", 409);
        if (input.action === "VOID") {
          if (!input.note) throw new PaymentError("Bekor qilish sababini kiriting");
          if (p.status === "PAID" && p.operationType !== "REFUND" && totals.net < p.amount) throw new PaymentError("Avval qaytarishlarni tekshiring: qoldiq manfiy bo‘lishi mumkin", 409);
          await tx.payment.update({ where: { id: p.id }, data: { voidedAt: new Date() } });
        } else if (input.action === "EDIT") {
          if (p.operationType === "REFUND" || p.status !== "PAID") throw new PaymentError("Faqat tasdiqlangan to‘lovni o‘zgartirish mumkin", 409);
          if (input.amount === undefined || !input.operationDate) throw new PaymentError("Summa va operatsiya sanasi kerak");
          const otherPayments = monthly.filter(other => other.id !== p.id);
          const otherTotals = accountTotals(account.tuition, otherPayments);
          if (otherTotals.net + input.amount < 0) throw new PaymentError("To‘lov summasi qaytarilgan mablag‘dan kam bo‘lishi mumkin emas", 409);
          await tx.payment.update({ where: { id: p.id }, data: {
            amount: input.amount,
            operationDate: input.operationDate,
            paidAt: new Date(`${input.operationDate}T00:00:00Z`),
            note: input.note || null,
          } });
          await tx.activityLog.create({ data: { action: "PAYMENT_EDIT", meta: {
            actorId, paymentId: p.id, userId: input.userId, billingMonth: input.billingMonth,
            oldAmount: p.amount, newAmount: input.amount,
            oldOperationDate: p.operationDate, newOperationDate: input.operationDate,
            oldNote: p.note, newNote: input.note || null,
          } } });
        } else {
          if (p.status !== "PENDING" || !input.operationDate) throw new PaymentError("Faqat kutilayotgan to‘lovni sana bilan tasdiqlash mumkin");
          if (account.tuition === null) throw new PaymentError("Avval oylik narxni belgilang");
          await tx.payment.update({ where: { id: p.id }, data: { status: "PAID", billingMonth: input.billingMonth, operationDate: input.operationDate, paidAt: new Date(`${input.operationDate}T00:00:00Z`), paidById: actor } });
          await tx.notification.create({ data: { userId: student.id, title: "To‘lov tasdiqlandi", body: `${input.billingMonth}: ${p.amount.toLocaleString("uz-UZ")} UZS` } });
        }
      }
      paymentId = p.id;
    }
    const result = { ok: true, paymentId, billingMonth: input.billingMonth };
    await tx.activityLog.create({ data: { action: `PAYMENT_${input.action}`, meta: { actorId, ...input, paymentId } } });
    await tx.paymentRequest.create({ data: { id: receiptId, fingerprint, result } });
    return result;
  });
}
