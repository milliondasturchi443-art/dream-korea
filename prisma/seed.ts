import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  // Единственный админ — как запрошено. Исходный email с !# — нормализуем.
  const rawAdminEmail = process.env.ADMIN_EMAIL || "dreamkorea@adminstator.kr";
  const rawAdminEmailAlt = "dreamkorea!@#@!@adminstator.kr";
  const adminPassword = process.env.ADMIN_PASSWORD || "ahd@123WHDI";
  const adminHash = await bcrypt.hash(adminPassword, 10);

  function normEmail(s: string): string {
    const t = (s || "").trim().toLowerCase();
    const at = t.lastIndexOf("@");
    if (at === -1) return t.replace(/[!#]/g, "");
    const local = t.slice(0, at).replace(/[!#]/g, "").replace(/[^a-z0-9._%+-]/g, "");
    const domain = t.slice(at + 1).replace(/[!#]/g, "").replace(/[^a-z0-9.-]/g, "");
    return `${local}@${domain}`;
  }
  const adminEmail = normEmail(rawAdminEmail);
  const adminEmailAlt = normEmail(rawAdminEmailAlt);

  // Удаляем демо-учётки: студент/учитель/старый админ — сайт должен быть чистым, без демо
  // Оставляем только реального админа. Курсы — бесплатные.
  for (const email of ["student@dreamkorea.uz", "teacher@dreamkorea.uz", "admin@dreamkorea.uz", adminEmailAlt]) {
    if (email === adminEmail) continue;
    try { await prisma.user.delete({ where: { email } }); console.log(`Removed demo user: ${email}`); } catch {}
  }
  // Также удаляем старый админ если email отличается от нового
  if (adminEmailAlt !== adminEmail) {
    try { await prisma.user.delete({ where: { email: adminEmailAlt } }); } catch {}
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: adminHash, name: "Administrator", role: "ADMIN", phone: "+998943280513" },
    create: { email: adminEmail, name: "Administrator", password: adminHash, role: "ADMIN", phone: "+998943280513" },
  });
  console.log(`Admin ready: ${adminEmail} (raw input: ${rawAdminEmail})`);

  // Курсы — бесплатные (price 0). Если нет курсов — создаём; если есть со старой ценой — обнуляем
  const existing = await prisma.course.findMany();
  if (existing.length === 0) {
    const c1 = await prisma.course.create({ data: { title: "Koreys tili 1-daraja", subtitle: "Boshlang‘ich (A1)", level: "A1", teacherName: "Administrator", description: "Админ добавит контент. Курсы бесплатные.", price: 0 } });
    await prisma.course.create({ data: { title: "TOPIK I tayyorgarlik", subtitle: "Rasmiy imtihon", level: "TOPIK I", teacherName: "Administrator", price: 0 } });
    for (let i = 1; i <= 6; i++) {
      await prisma.lesson.create({ data: { courseId: c1.id, order: i, title: `${i}-dars — админ добавит`, duration: "—" } });
    }
    console.log("Created free courses (admin will fill content)");
  } else {
    for (const c of existing) {
      if (c.price !== 0) await prisma.course.update({ where: { id: c.id }, data: { price: 0 } });
    }
    console.log(`Updated ${existing.length} courses to free (price=0)`);
  }

  // Контент по умолчанию — если пусто, админ сам добавит. Не сидим демо-контент.
  console.log("Seed done — real mode, no demo, all free");
}
main().finally(() => prisma.$disconnect());
