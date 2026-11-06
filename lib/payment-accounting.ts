import { z } from "zod";

export const monthSchema = z.string().regex(/^(20\d{2})-(0[1-9]|1[0-2])$/);
export const moneySchema = z.number().int().min(0).max(1_000_000_000);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Sana noto‘g‘ri");
export const operationSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(["PAYMENT", "REFUND", "TARIFF", "VOID", "CONFIRM", "ASSIGN", "REMINDER", "EDIT"]),
  userId: z.string().regex(/^[a-f\d]{24}$/i),
  billingMonth: monthSchema,
  tuition: moneySchema.optional(),
  amount: moneySchema.refine(n => n > 0).optional(),
  operationDate: dateSchema.optional(),
  lessonHours: z.number().min(0).max(744).optional(),
  paymentId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  note: z.string().trim().max(1000).default(""),
  method: z.enum(["cash", "card", "transfer"]).default("cash"),
  setDefault: z.boolean().default(false),
});

export function currentBillingMonth() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);
}

export type LedgerPayment = {
  userId: string; amount: number; status: string; month: string | null;
  billingMonth?: string | null; operationType?: string | null; voidedAt?: Date | string | null;
};

// Only an explicit legacy YYYY-MM value is trustworthy. Never derive a billing
// month from createdAt/paidAt: a November receipt can pay October's debt.
export function paymentBillingMonth(payment: Pick<LedgerPayment, "billingMonth" | "month">) {
  if (monthSchema.safeParse(payment.billingMonth).success) return payment.billingMonth!;
  if (monthSchema.safeParse(payment.month).success) return payment.month!;
  return null;
}

export function accountTotals(tuition: number | null, payments: LedgerPayment[]) {
  let received = 0, refunded = 0;
  for (const p of payments) {
    if (p.status !== "PAID" || p.voidedAt) continue;
    if (p.operationType === "REFUND") refunded += p.amount;
    else received += p.amount;
  }
  const net = received - refunded;
  return { tuition, received, refunded, net, debt: tuition === null ? null : Math.max(0, tuition - net), overpaid: tuition === null ? null : Math.max(0, net - tuition) };
}

export function monthlyTotals(accounts: ReturnType<typeof accountTotals>[]) {
  return accounts.reduce((s, a) => ({
    received: s.received + a.received, refunded: s.refunded + a.refunded,
    net: s.net + a.net, debt: s.debt + (a.debt ?? 0),
    paidCount: s.paidCount + Number(a.debt === 0),
    debtCount: s.debtCount + Number(a.debt !== null && a.debt > 0),
    unknownCount: s.unknownCount + Number(a.tuition === null),
  }), { received: 0, refunded: 0, net: 0, debt: 0, paidCount: 0, debtCount: 0, unknownCount: 0 });
}
