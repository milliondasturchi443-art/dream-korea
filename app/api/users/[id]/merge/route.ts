import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";
import { monthId } from "@/lib/payment-ledger";

export const dynamic = "force-dynamic";

function requireAdmin(req: Request) {
  const token = readAuthToken(req);
  const d = verify(token);
  if (!d || d.role !== "ADMIN" || !isAdminEmail(String(d.email ?? ""))) return null;
  return d;
}

const OBJECT_ID = /^[a-f\d]{24}$/i;

// POST /api/users/[id]/merge — dublikat o'quvchini asosiy hisobga qo'shish.
//
// Bu "o'chirish" emas: barcha to'lovlar (Payment) va oylik hisoblar
// (PaymentMonth) manba hisobdan nishon hisobga KO'CHIRILADI, so'ng manba
// o'quvchi o'chiriladi. Shu tariqa dublikat yo'qoladi, lekin pul tarixi
// saqlanadi va qarzdorlik to'g'ri hisoblanadi.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(req);
  if (!admin) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  if (!OBJECT_ID.test(id)) return Response.json({ error: "ID noto'g'ri" }, { status: 400 });

  let body: { targetId?: string; keepTargetData?: boolean } = {};
  try { body = await req.json(); } catch {}
  const targetId = String(body.targetId ?? "").trim();
  if (!OBJECT_ID.test(targetId)) return Response.json({ error: "Nishon o'quvchi ID noto'g'ri" }, { status: 400 });
  if (targetId === id) return Response.json({ error: "Hisobni o'ziga birlashtirib bo'lmaydi" }, { status: 400 });

  try {
    const [source, target] = await Promise.all([
      prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, monthlyFee: true, lessonHours: true } }),
      prisma.user.findUnique({ where: { id: targetId }, select: { id: true, name: true, email: true, role: true, monthlyFee: true, lessonHours: true } }),
    ]);
    if (!source) return Response.json({ error: "Manba o'quvchi topilmadi" }, { status: 404 });
    if (!target) return Response.json({ error: "Nishon o'quvchi topilmadi" }, { status: 404 });
    if (source.role !== "STUDENT" || target.role !== "STUDENT") {
      return Response.json({ error: "Faqat o'quvchilarni birlashtirish mumkin" }, { status: 400 });
    }

    const result = await prisma.$transaction(async tx => {
      // 1. Oylik hisoblarni birlashtirish: bir oyda ikkita hisob bo'lsa,
      //    tarif/soatlar nishon hisobdan olinadi, manbadagisi faqat bo'sh joyni to'ldiradi.
      const sourceMonths = await tx.paymentMonth.findMany({ where: { userId: id } });
      let mergedMonths = 0;
      for (const sm of sourceMonths) {
        const targetMonthId = monthId(targetId, sm.billingMonth);
        const existing = await tx.paymentMonth.findUnique({ where: { id: targetMonthId } });
        if (existing) {
          const teacherIds = [...new Set([...(existing.teacherIds ?? []), ...(sm.teacherIds ?? [])])];
          const teacherNames = [...new Set([...(existing.teacherNames ?? []), ...(sm.teacherNames ?? [])])];
          await tx.paymentMonth.update({
            where: { id: targetMonthId },
            data: {
              tuition: existing.tuition ?? sm.tuition,
              lessonHours: existing.lessonHours ?? sm.lessonHours,
              teacherIds,
              teacherNames,
              revision: { increment: 1 },
            },
          });
          await tx.paymentMonth.delete({ where: { id: sm.id } });
        } else {
          // MongoDB'da _id o'zgartirilmaydi — nishon ID bilan yangi yozuv yaratamiz.
          await tx.paymentMonth.create({
            data: {
              id: targetMonthId,
              userId: targetId,
              billingMonth: sm.billingMonth,
              tuition: sm.tuition,
              lessonHours: sm.lessonHours,
              teacherIds: sm.teacherIds ?? [],
              teacherNames: sm.teacherNames ?? [],
              revision: sm.revision,
            },
          });
          await tx.paymentMonth.delete({ where: { id: sm.id } });
        }
        mergedMonths++;
      }

      // 2. Barcha to'lov/refund yozuvlarini ko'chirish. Bu net summani
      //    o'zgartirmaydi: refund limiti ham to'g'ri qoladi.
      const movedPayments = await tx.payment.updateMany({ where: { userId: id }, data: { userId: targetId } });

      // 3. Nishon hisobda tarif bo'sh bo'lsa, manbadan to'ldiramiz.
      if (target.monthlyFee == null && source.monthlyFee != null) {
        await tx.user.update({ where: { id: targetId }, data: { monthlyFee: source.monthlyFee } });
      }
      if (target.lessonHours == null && source.lessonHours != null) {
        await tx.user.update({ where: { id: targetId }, data: { lessonHours: source.lessonHours } });
      }

      // 4. Manba hisobning qolgan bog'liq yozuvlarini tozalash.
      await tx.homework.updateMany({ where: { studentId: id }, data: { studentId: null } });
      await tx.admission.updateMany({ where: { userId: id }, data: { userId: null } });
      await tx.enrollment.deleteMany({ where: { userId: id } });
      await tx.lessonProgress.deleteMany({ where: { userId: id } });
      await tx.testAttempt.deleteMany({ where: { userId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.achievement.deleteMany({ where: { userId: id } });
      await tx.certificate.deleteMany({ where: { userId: id } });
      await tx.groupMember.deleteMany({ where: { userId: id } });
      await tx.attendance.deleteMany({ where: { studentId: id } });
      await tx.homeworkDone.deleteMany({ where: { studentId: id } });
      await tx.writingAttempt.deleteMany({ where: { userId: id } });
      await tx.topikWritingAttempt.deleteMany({ where: { userId: id } });
      await tx.darsProgress.deleteMany({ where: { userId: id } });
      await tx.darsExamBest.deleteMany({ where: { userId: id } });
      await tx.alifboProgress.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });

      await tx.activityLog.create({
        data: {
          action: "STUDENT_MERGED",
          meta: {
            actorId: String(admin.id || admin.email),
            sourceId: source.id, sourceEmail: source.email, sourceName: source.name,
            targetId: target.id, targetEmail: target.email, targetName: target.name,
            movedPayments: movedPayments.count, mergedMonths,
          },
        },
      });

      return { movedPayments: movedPayments.count, mergedMonths };
    }, { maxWait: 15000, timeout: 60000 });

    return Response.json({
      ok: true,
      merged: true,
      target: { id: target.id, name: target.name, email: target.email },
      ...result,
    });
  } catch (e) {
    console.error("POST /api/users/[id]/merge", e);
    return Response.json({ error: "Birlashtirib bo'lmadi" }, { status: 500 });
  }
}
