import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/db";
import { DELETE, PATCH } from "../app/api/users/[id]/route";
import { POST as MERGE } from "../app/api/users/[id]/merge/route";
import { monthId } from "../lib/payment-ledger";
import { signAdminSession } from "../lib/session";

// Faqat izolyatsiyalangan test bazasi. Production'da hech qachon ishlamaydi.
const url = new URL(process.env.DATABASE_URL ?? "");
if (!/^dreamkorea_payment_test_\d+$/.test(url.pathname.slice(1))) throw new Error("Isolated test database required");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dreamkorea@adminstator.kr";

function request(method: string, id: string, body?: unknown) {
  return new Request(`http://localhost/api/users/${id}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.TEST_ADMIN_TOKEN}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });

async function main() {
  process.env.ADMIN_EMAIL = ADMIN_EMAIL;
  process.env.TEST_ADMIN_TOKEN = await signAdminSession();
  // 1. Faqat bo'sh PaymentMonth (paneldan avtomatik yaratilgan) — o'chirish ishlashi kerak.
  const empty = await prisma.user.create({ data: { name: "Empty Ledger", email: `del-${randomUUID()}@example.test`, password: "x", role: "STUDENT" } });
  await prisma.paymentMonth.create({ data: { id: monthId(empty.id, "2026-11"), userId: empty.id, billingMonth: "2026-11", teacherIds: [], teacherNames: [] } });
  const res1 = await DELETE(request("DELETE", empty.id), params(empty.id));
  assert.equal(res1.status, 200, "student with only empty month accounts must be deletable");
  assert.equal(await prisma.user.count({ where: { id: empty.id } }), 0);
  assert.equal(await prisma.paymentMonth.count({ where: { userId: empty.id } }), 0);

  // 2. To'lov tarixi bor hisob — o'chirilmaydi, arxivlanadi.
  const paid = await prisma.user.create({ data: { name: "Paid Student", email: `paid-${randomUUID()}@example.test`, password: "x", role: "STUDENT" } });
  await prisma.paymentMonth.create({ data: { id: monthId(paid.id, "2026-10"), userId: paid.id, billingMonth: "2026-10", tuition: 300000, teacherIds: [], teacherNames: [] } });
  await prisma.payment.create({ data: { userId: paid.id, amount: 300000, method: "cash", status: "PAID", month: "2026-10", billingMonth: "2026-10", operationType: "PAYMENT" } });

  const res2 = await DELETE(request("DELETE", paid.id), params(paid.id));
  assert.equal(res2.status, 409);
  assert.equal((await res2.json()).code, "HAS_FINANCIAL_HISTORY");
  assert.equal(await prisma.user.count({ where: { id: paid.id } }), 1, "financial history must block deletion");

  const res3 = await PATCH(request("PATCH", paid.id, { archived: true }), params(paid.id));
  assert.equal(res3.status, 200);
  const archived = await prisma.user.findUniqueOrThrow({ where: { id: paid.id } });
  assert.ok(archived.archivedAt, "archive timestamp must be stored");
  assert.equal(await prisma.payment.count({ where: { userId: paid.id } }), 1, "payments must survive archiving");

  // 3. Arxivdan qaytarish.
  const res4 = await PATCH(request("PATCH", paid.id, { archived: false }), params(paid.id));
  assert.equal(res4.status, 200);
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: paid.id } })).archivedAt, null);

  // 4. Dublikatni birlashtirish: to'lovlar nishon hisobga ko'chadi, manba o'chadi.
  const dupA = await prisma.user.create({ data: { name: "Abdumajidov Hasanboy", email: `dup-a-${randomUUID()}@example.test`, password: "x", role: "STUDENT" } });
  const dupB = await prisma.user.create({ data: { name: "Abdumajidov Husanboy", email: `dup-b-${randomUUID()}@example.test`, password: "x", role: "STUDENT" } });
  await prisma.paymentMonth.create({ data: { id: monthId(dupA.id, "2026-10"), userId: dupA.id, billingMonth: "2026-10", tuition: 300000, teacherIds: [], teacherNames: [] } });
  await prisma.paymentMonth.create({ data: { id: monthId(dupB.id, "2026-10"), userId: dupB.id, billingMonth: "2026-10", tuition: 450000, teacherIds: [], teacherNames: [] } });
  await prisma.payment.create({ data: { userId: dupA.id, amount: 300000, method: "cash", status: "PAID", month: "2026-10", billingMonth: "2026-10", operationType: "PAYMENT" } });

  const merged = await MERGE(
    new Request(`http://localhost/api/users/${dupA.id}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.TEST_ADMIN_TOKEN}` },
      body: JSON.stringify({ targetId: dupB.id }),
    }),
    params(dupA.id),
  );
  assert.equal(merged.status, 200);
  const mergeBody = await merged.json();
  assert.equal(mergeBody.movedPayments, 1, "payment must be moved to target");
  assert.equal(await prisma.user.count({ where: { id: dupA.id } }), 0, "duplicate must be removed");
  assert.equal(await prisma.payment.count({ where: { userId: dupA.id } }), 0, "no orphan payments left behind");
  assert.equal(await prisma.payment.count({ where: { userId: dupB.id } }), 1, "payment now belongs to target");
  const mergedMonth = await prisma.paymentMonth.findUniqueOrThrow({ where: { id: monthId(dupB.id, "2026-10") } });
  assert.equal(mergedMonth.tuition, 450000, "target tariff must win on merge");
  assert.equal(await prisma.paymentMonth.count({ where: { userId: dupA.id } }), 0, "source month accounts removed");

  console.log("PASS: empty-month student deleted, financial history protected, archive/restore keeps payments, duplicate merge moves payments");
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
