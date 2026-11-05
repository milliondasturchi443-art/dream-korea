import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { prisma } from "../lib/db";
import { monthId } from "../lib/payment-ledger";

// Faqat izolyatsiyalangan test bazasi.
const url = new URL(process.env.DATABASE_URL ?? "");
if (!/^dreamkorea_payment_test_\d+$/.test(url.pathname.slice(1))) throw new Error("Isolated test database required");

async function main() {
  // Dublikat juftligi: ikkalasida ham 2026-10 uchun 300 000 to'lov.
  const keep = await prisma.user.create({ data: { name: "Abdumajidov Hasanboy", email: `keep-${randomUUID()}@example.test`, password: "x", role: "STUDENT" } });
  const dup = await prisma.user.create({ data: { name: "Abdumajidov Husanboy", email: `dup-${randomUUID()}@example.test`, password: "x", role: "STUDENT" } });
  await prisma.paymentMonth.create({ data: { id: monthId(keep.id, "2026-10"), userId: keep.id, billingMonth: "2026-10", tuition: 300000, teacherIds: [], teacherNames: [] } });
  await prisma.paymentMonth.create({ data: { id: monthId(dup.id, "2026-10"), userId: dup.id, billingMonth: "2026-10", tuition: 300000, teacherIds: [], teacherNames: [] } });
  const real = await prisma.payment.create({ data: { userId: keep.id, amount: 300000, method: "cash", status: "PAID", month: "2026-10", billingMonth: "2026-10", operationType: "PAYMENT", operationDate: "2026-10-17" } });
  const duplicate = await prisma.payment.create({ data: { userId: dup.id, amount: 300000, method: "cash", status: "PAID", month: "2026-10", billingMonth: "2026-10", operationType: "PAYMENT", operationDate: "2026-11-04" } });

  const base = ["--source=" + dup.id, "--target=" + keep.id, "--void=" + duplicate.id, "--month=2026-10"];

  // 1. Dry-run: hech narsa o'zgarmasligi kerak.
  const dry = spawnSync("./node_modules/.bin/tsx", ["scripts/fix-student-duplicate.ts", ...base], { env: process.env, encoding: "utf8" });
  assert.equal(dry.status, 0, dry.stderr || dry.stdout);
  assert.match(dry.stdout, /QURUQ SINOV/);
  assert.equal(await prisma.user.count({ where: { id: dup.id } }), 1, "dry-run must not delete anything");
  // Eslatma: `voidedAt: null` MongoDB'da maydoni yo'q hujjatni topmaydi.
  assert.equal(await prisma.payment.count({ where: { id: duplicate.id, OR: [{ voidedAt: null }, { voidedAt: { isSet: false } }] } }), 1, "dry-run must not void anything");

  // 2. Haqiqiy bajarish.
  const run = spawnSync("./node_modules/.bin/tsx", ["scripts/fix-student-duplicate.ts", ...base, "--apply", "--yes"], { env: process.env, encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr || run.stdout);

  // 3. Natija: dublikat yo'q, tarix saqlangan, takroriy to'lov bekor qilingan.
  assert.equal(await prisma.user.count({ where: { id: dup.id } }), 0, "duplicate account removed");
  assert.equal(await prisma.user.count({ where: { id: keep.id } }), 1, "main account kept");
  assert.equal(await prisma.payment.count({ where: { userId: keep.id } }), 2, "both receipts remain on the main account");
  const voided = await prisma.payment.findUniqueOrThrow({ where: { id: duplicate.id } });
  assert.ok(voided.voidedAt, "duplicate receipt is voided, not deleted");
  const kept = await prisma.payment.findUniqueOrThrow({ where: { id: real.id } });
  assert.equal(kept.voidedAt, null, "the real receipt stays valid");

  // 4. Balans 300 000 bo'lishi kerak (600 000 emas).
  const payments = await prisma.payment.findMany({ where: { userId: keep.id } });
  const net = payments.filter(p => !p.voidedAt && p.status === "PAID")
    .reduce((s, p) => s + (p.operationType === "REFUND" ? -p.amount : p.amount), 0);
  assert.equal(net, 300000, "net for the month must be 300000, not 600000");

  // 5. Takroriy ishga tushirish xavfsiz bo'lishi kerak.
  const again = spawnSync("./node_modules/.bin/tsx", ["scripts/fix-student-duplicate.ts", ...base, "--apply", "--yes"], { env: process.env, encoding: "utf8" });
  assert.equal(again.status, 0, again.stderr || again.stdout);
  assert.match(again.stdout, /allaqachon/);
  assert.equal(await prisma.payment.count({ where: { userId: keep.id } }), 2, "second run must not duplicate or delete anything");

  console.log("PASS: dry-run safe, merge moves receipts, duplicate voided not deleted, net stays 300000, rerun idempotent");
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
