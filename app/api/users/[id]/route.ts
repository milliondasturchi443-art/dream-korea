import { prisma } from "@/lib/db";
import { verify, readAuthToken } from "@/lib/token";
import { isAdminEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

function requireAdmin(req: Request) {
  const token = readAuthToken(req);
  const d = verify(token);
  if (!d || d.role !== "ADMIN" || !isAdminEmail(String(d.email ?? ""))) return null;
  return d;
}

// PATCH /api/users/[id] — rolni/nomni o'zgartirish (ADMIN)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(req);
  if (!admin) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  let body: { name?: string; role?: string; phone?: string; topikLevel?: string; banned?: boolean; bannedReason?: string; archived?: boolean } = {};
  try { body = await req.json(); } catch {}
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.role && ["STUDENT", "TEACHER", "ADMIN"].includes(body.role)) data.role = body.role;
  if (typeof body.phone === "string") data.phone = body.phone.trim();
  if (typeof body.topikLevel === "string") data.topikLevel = body.topikLevel;
  // Arxivlash — dublikat hisobni ro'yxatlardan yashirish. Moliyaviy tarix
  // (Payment/PaymentMonth) o'chirilmaydi va hisobotlarda qoladi.
  if (typeof body.archived === "boolean") data.archivedAt = body.archived ? new Date() : null;
  // Ban — o'zini/boshqaruvchi asosiy hisobni bloklash taqiqlanadi
  if (typeof body.banned === "boolean") {
    const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (!target) return Response.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
    const envAdmin = (process.env.ADMIN_EMAIL || "dreamkorea@adminstator.kr").trim().toLowerCase();
    if (target.email.trim().toLowerCase() === envAdmin) {
      return Response.json({ error: "Asosiy admin hisobini bloklab bo'lmaydi" }, { status: 400 });
    }
    data.banned = body.banned;
    data.bannedAt = body.banned ? new Date() : null;
    if (!body.banned) data.bannedReason = null;
  }
  if (typeof body.bannedReason === "string") data.bannedReason = body.bannedReason.trim().slice(0, 200) || null;
  if (!Object.keys(data).length) return Response.json({ error: "O'zgarish kiritilmadi" }, { status: 400 });
  try {
    const u = await prisma.user.update({ where: { id }, data });
    return Response.json({ ok: true, user: { id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone } });
  } catch (e) {
    console.error("PATCH /api/users/[id]", e);
    return Response.json({ error: "Saqlab bo'lmadi" }, { status: 500 });
  }
}

// DELETE /api/users/[id] — foydalanuvchini o'chirish (ADMIN, o'zini o'chirish taqiqlanadi)
//
// Muhim: PaymentMonth yozuvlari panel ochilganda har bir o'quvchi uchun avtomatik
// yaratiladi — bu moliyaviy tarix emas, shuning uchun o'chirishga to'sqinlik
// qilmaydi. Haqiqiy pul operatsiyasi (Payment) bo'lsa, o'chirish taqiqlanadi:
// bunday hisobni arxivlash kerak (PATCH { archived: true }).
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = requireAdmin(req);
  if (!admin) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const { id } = await params;
  if (admin.id && String(admin.id) === id) return Response.json({ error: "O'z hisobingizni o'chirib bo'lmaydi" }, { status: 400 });
  try {
    // Ustoz hali guruhlarga biriktirilgan yoki uy vazifalari muallifi bo'lsa —
    // o'chirishni to'xtatamiz: aks holda guruhlar ustozsiz qoladi va vazifalar
    // egasiz qoladi. Avval guruhlarni boshqa ustozga o'tkazish kerak.
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) return Response.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
    if (target.role === "TEACHER") {
      const [groups, homework] = await Promise.all([
        prisma.group.count({ where: { teacherId: id } }),
        prisma.homework.count({ where: { teacherId: id } }),
      ]);
      if (groups > 0 || homework > 0) {
        return Response.json({
          error: `Bu ustozda ${groups} ta guruh va ${homework} ta uy vazifasi bor. Avval guruhlarni boshqa ustozga o‘tkazing, keyin o‘chiring.`,
          code: "TEACHER_HAS_ASSIGNMENTS",
        }, { status: 409 });
      }
    }
    const financial = await prisma.payment.count({ where: { userId: id } });
    if (financial > 0) {
      return Response.json({
        error: "Bu hisobda to‘lov tarixi bor, shuning uchun butunlay o‘chirilmaydi. Dublikat bo‘lsa — «Arxivlash» dan foydalaning: o‘quvchi ro‘yxatdan yo‘qoladi, moliyaviy tarix saqlanadi.",
        code: "HAS_FINANCIAL_HISTORY",
      }, { status: 409 });
    }
    // Bog'liq yozuvlarni tozalash. PaymentMonth faqat bo'sh oylik hisoblar —
    // Payment yo'qligi yuqorida tekshirildi.
    await prisma.$transaction(async tx => {
      // Ixtiyoriy bog'lanishlar: yozuvni o'chirmaymiz, faqat havolani uzamiz.
      await tx.homework.updateMany({ where: { studentId: id }, data: { studentId: null } });
      await tx.admission.updateMany({ where: { userId: id }, data: { userId: null } });
      await tx.reception.updateMany({ where: { teacherId: id }, data: { teacherId: null } });
      await tx.course.updateMany({ where: { teacherId: id }, data: { teacherId: null } });
      await tx.group.updateMany({ where: { teacherId: id }, data: { teacherId: null } });

      await tx.paymentMonth.deleteMany({ where: { userId: id } });
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
    }, { maxWait: 15000, timeout: 45000 });
    return Response.json({ ok: true, deleted: true });
  } catch (e) {
    console.error("DELETE /api/users/[id]", e);
    return Response.json({ error: "O'chirib bo'lmadi" }, { status: 500 });
  }
}
