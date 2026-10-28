import { prisma } from "@/lib/db";
import { resolveSession } from "@/lib/session";
import { ensureStudentAccount } from "@/lib/reception-student";
import { sendEmail, emailShell } from "@/lib/email";
import { z } from "zod";
export const dynamic = "force-dynamic";

const schema = z.object({
  receptionId: z.string().regex(/^[a-f\d]{24}$/i),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  dueDate: z.string().trim().max(40).optional(),
});

// POST /api/reception/homework — admin qabul ro'yxatidagi O'ZGAR O'QUVCHIGA
// shaxsiy uy vazifasi yuboradi (guruhidan qat'i nazar).
// Javob: { ok, item, account } — account: talaba login/parol (agar yaratilgan bo'lsa).
export async function POST(req: Request) {
  const { session: user } = await resolveSession(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Mavzu va o'quvchi majburiy" }, { status: 400 });
  const { title } = parsed.data;
  const description = parsed.data.description ? parsed.data.description : undefined;
  const dueDate = parsed.data.dueDate ? parsed.data.dueDate : undefined;

  try {
    const rec = await prisma.reception.findUnique({ where: { id: parsed.data.receptionId } });
    if (!rec) return Response.json({ error: "O'quvchi topilmadi" }, { status: 404 });

    // Hisob (qabulda allaqachon yaratilgan bo'ladi; bo'lmasa — shu yerda yaratiladi)
    const acc = await ensureStudentAccount(rec.name, rec.phone);
    if (!acc) return Response.json({ error: "Talaba hisobini yaratib bo'lmadi" }, { status: 500 });

    // Guruh: qabulda ko'rsatilgan guruh → yo'q bo'lsa — talaba a'zo bo'lgan birinchi guruh
    let groupId: string | null = rec.groupId ?? null;
    if (!groupId) {
      const m = await prisma.groupMember.findFirst({ where: { userId: acc.id }, select: { groupId: true } });
      groupId = m?.groupId ?? null;
    }
    // Ustoz: guruh ustoz'i → yo'q bo'lsa — shu admin (Homework.teacherId majburiy)
    let teacherId = user.id || "";
    let groupName = "";
    if (groupId) {
      const g = await prisma.group.findUnique({ where: { id: groupId }, select: { name: true, teacherId: true } });
      groupName = g?.name ?? "";
      if (g?.teacherId) teacherId = g.teacherId;
    }
    if (!teacherId) {
      // env-admin'da Session.id bo'sh — email orqali DB qatorini topamiz
      const admin = user.id
        ? { id: user.id }
        : await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
      teacherId = admin?.id ?? "";
    }
    if (!teacherId) return Response.json({ error: "Vazifa uchun ustoz topilmadi" }, { status: 500 });

    const hw = await prisma.homework.create({
      data: {
        groupId,                       // talaba guruhida bo'lsa — ko'rinadi; bo'lmasa — shaxsiy
        studentId: acc.id,             // faqat shu o'quvchiga
        teacherId,
        title,
        description,
        dueDate,
      },
    });

    // ——— O'quvchiga bildirishnoma + email (xato bilan to'xtamasin) ———
    const dueTxt = dueDate ? `Topshirish sanasi: ${dueDate}.` : "";
    try {
      const u = await prisma.user.findUnique({ where: { id: acc.id }, select: { id: true, email: true, name: true } });
      if (u?.id) {
        await prisma.notification.create({
          data: {
            userId: u.id,
            title: `Shaxsiy uy vazifasi: ${title}`,
            body: `${groupName ? `Guruh: ${groupName}. ` : ""}${dueTxt} ${description ?? ""}`.trim().slice(0, 300),
          },
        }).catch(() => {});
        if (u.email) {
          const rows = `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;margin:4px 0 14px;">
              <tr><td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;"><span style="color:#64748b;font-size:13px;">Mavzu</span><div style="font-weight:bold;color:#0f1b3d;margin-top:2px;">${title}</div></td></tr>
              ${groupName ? `<tr><td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;"><span style="color:#64748b;font-size:13px;">Guruh</span><div style="color:#0f1b3d;margin-top:2px;">${groupName}</div></td></tr>` : ""}
              ${dueDate ? `<tr><td style="padding:14px 16px;"><span style="color:#64748b;font-size:13px;">Topshirish sanasi</span><div style="color:#b45309;font-weight:bold;margin-top:2px;">${dueDate}</div></td></tr>` : ""}
            </table>
            ${description ? `<p style="margin:0 0 8px;font-size:14px;color:#334155;">${description}</p>` : ""}`;
          const html = emailShell(
            "Shaxsiy uy vazifasi berildi",
            `Salom ${u.name ?? ""}! Sizga yangi shaxsiy uy vazifasi berildi.`,
            rows,
            { label: "Bildirishnomalarni ko‘rish", url: `${(process.env.NEXTAUTH_URL || "https://dream-korea.onrender.com").replace(/\/$/, "")}/notifications` },
          );
          sendEmail(u.email, `DREAM KOREA — uy vazifasi: ${title}`, html, `${title}. ${dueTxt}`).catch(() => {});
        }
      }
    } catch {}

    return Response.json({
      ok: true,
      item: hw,
      account: { email: acc.email, existing: acc.existing }, // login — adminga ko'rsatiladi
    }, { status: 201 });
  } catch (e) {
    console.error("reception homework", e);
    return Response.json({ error: "Yuborib bo'lmadi" }, { status: 500 });
  }
}
