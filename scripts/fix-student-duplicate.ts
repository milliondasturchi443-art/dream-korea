/**
 * Bir martalik: dublikat o'quvchini birlashtirish va takroriy to'lovni bekor qilish.
 *
 * Ishlatish (avval quruq sinov, hech narsa o'zgarmaydi):
 *   npx tsx scripts/fix-student-duplicate.ts --source=<id> --target=<id> --void=<paymentId>
 *
 * Haqiqiy bajarish:
 *   npx tsx scripts/fix-student-duplicate.ts --source=... --target=... --void=... --apply --yes
 *
 * Skript ataylab ehtiyotkor:
 *  - `--apply` bo'lmasa faqat hisobot chiqaradi;
 *  - `--yes` bo'lmasa yozmaydi;
 *  - manba hisobda qoladigan to'lov bo'lsa to'xtaydi (ular yo'qolmasligi kerak);
 *  - bekor qilinadigan to'lov manba yoki nishon hisobga tegishli bo'lishi shart;
 *  - hech qanday yozuv fizik o'chirilmaydi: to'lov `voidedAt` bilan belgilanadi.
 */
import { prisma } from "../lib/db";
import { POST as MERGE } from "../app/api/users/[id]/merge/route";
import { mutateLedger } from "../lib/payment-ledger";
import { signAdminSession } from "../lib/session";
import { accountTotals, paymentBillingMonth } from "../lib/payment-accounting";
import { randomUUID } from "node:crypto";

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : "true"];
  }),
);

const source = String(args.source ?? "");
const target = String(args.target ?? "");
const voidId = String(args.void ?? "");
const apply = args.apply === "true";
const confirmed = args.yes === "true";
const month = String(args.month ?? "2026-10");

const OBJECT_ID = /^[a-f\d]{24}$/i;
if (!OBJECT_ID.test(source) || !OBJECT_ID.test(target) || !OBJECT_ID.test(voidId)) {
  console.error("--source, --target va --void MongoDB ObjectId bo'lishi kerak");
  process.exit(1);
}
if (source === target) {
  console.error("Manba va nishon bir xil bo'lmasligi kerak");
  process.exit(1);
}

async function monthTotals(userId: string, billingMonth: string) {
  const [account, payments] = await Promise.all([
    prisma.paymentMonth.findFirst({ where: { userId, billingMonth } }),
    prisma.payment.findMany({ where: { userId } }),
  ]);
  return accountTotals(account?.tuition ?? null, payments.filter(p => paymentBillingMonth(p) === billingMonth));
}

async function main() {
  const [src, dst] = await Promise.all([
    prisma.user.findUnique({ where: { id: source }, select: { id: true, name: true, email: true, role: true, archivedAt: true } }),
    prisma.user.findUnique({ where: { id: target }, select: { id: true, name: true, email: true, role: true, archivedAt: true } }),
  ]);

  console.log("=== Dublikatni tuzatish ===");
  console.log("manba :", src ? `${src.name} <${src.email}>${src.archivedAt ? " [arxivlangan]" : ""}` : "(yo'q — allaqachon birlashtirilgan)");
  console.log("nishon:", dst ? `${dst.name} <${dst.email}>` : "(TOPILMADI)");
  console.log("oy    :", month);

  if (!dst) { console.error("Nishon hisob topilmadi — to'xtatildi"); process.exit(1); }
  if (dst.role !== "STUDENT") { console.error("Nishon o'quvchi emas — to'xtatildi"); process.exit(1); }

  const voidPayment = await prisma.payment.findUnique({ where: { id: voidId } });
  if (!voidPayment) { console.error("Bekor qilinadigan to'lov topilmadi — to'xtatildi"); process.exit(1); }
  if (voidPayment.userId !== source && voidPayment.userId !== target) {
    console.error("Bekor qilinadigan to'lov bu ikki hisobga tegishli emas — to'xtatildi");
    process.exit(1);
  }
  if (voidPayment.voidedAt) console.log("eslatma: bu to'lov allaqachon bekor qilingan");
  console.log("bekor :", `${voidPayment.id} ${voidPayment.amount} UZS, sana ${voidPayment.operationDate ?? "noma'lum"}, egasi ${voidPayment.userId === source ? "manba" : "nishon"}`);

  const before = await monthTotals(target, month);
  console.log("\noldin (nishon, %s):", month, JSON.stringify(before));

  if (src) {
    const srcPayments = await prisma.payment.findMany({ where: { userId: source } });
    console.log(`manbadagi to'lovlar: ${srcPayments.length}`);
    const unexpected = srcPayments.filter(p => p.id !== voidId);
    if (unexpected.length > 0) {
      console.error("Manbada boshqa to'lovlar ham bor:", unexpected.map(p => `${p.id} ${p.amount}`).join(", "));
      console.error("Ularni ham bekor qilish kerakmi yoki ular nishonga ko'chishi kerakmi — avval aniqlang.");
      process.exit(1);
    }
  }

  if (!apply || !confirmed) {
    console.log("\nQURUQ SINOV. Hech narsa o'zgartirilmadi.");
    console.log("Bajarish uchun: --apply --yes");
    return;
  }

  const adminToken = await signAdminSession("Duplicate Fix Script");
  process.env.TEST_ADMIN_TOKEN = adminToken;

  // 1. Birlashtirish: to'lovlar va oylik hisoblar nishonga ko'chadi.
  if (src) {
    const res = await MERGE(
      new Request(`http://localhost/api/users/${source}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ targetId: target }),
      }),
      { params: Promise.resolve({ id: source }) },
    );
    const body = await res.json();
    if (!res.ok) { console.error("Birlashtirish muvaffaqiyatsiz:", body); process.exit(1); }
    console.log("\nbirlashtirildi:", JSON.stringify(body));
  } else {
    console.log("\nmanba allaqachon yo'q — birlashtirish o'tkazib yuborildi");
  }

  // 2. Takroriy to'lovni bekor qilish (yozuv saqlanadi, faqat voidedAt qo'yiladi).
  const fresh = await prisma.payment.findUnique({ where: { id: voidId } });
  if (fresh && !fresh.voidedAt) {
    await mutateLedger({
      requestId: randomUUID(),
      action: "VOID",
      userId: target,
      billingMonth: month,
      paymentId: voidId,
      note: "Dublikat hisob uchun kiritilgan takroriy to'lov — birlashtirishdan keyin bekor qilindi",
      method: "cash",
      setDefault: false,
    }, "duplicate-fix-script");
    console.log("takroriy to'lov bekor qilindi:", voidId);
  } else {
    console.log("to'lov allaqachon bekor qilingan — o'tkazib yuborildi");
  }

  const after = await monthTotals(target, month);
  console.log("\nkeyin (nishon, %s):", month, JSON.stringify(after));
  console.log("\nqo'shni tekshiruv:");
  console.log("  o'quvchilar soni:", await prisma.user.count({ where: { role: "STUDENT" } }));
  console.log("  manba hisob qoldi:", await prisma.user.count({ where: { id: source } }));
  // `voidedAt: null` eski hujjatlarni (maydon yo'q) topmaydi — OR bilan sanaymiz.
  console.log("  bekor qilinmagan to'lovlar:", await prisma.payment.count({
    where: { OR: [{ voidedAt: null }, { voidedAt: { isSet: false } }] },
  }));
}

main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
