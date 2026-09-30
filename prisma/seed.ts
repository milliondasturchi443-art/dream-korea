import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const pw = await bcrypt.hash("password123", 10);

  const student = await prisma.user.upsert({
    where: { email: "student@dreamkorea.uz" },
    update: {},
    create: { email: "student@dreamkorea.uz", name: "Bobur Karimov", password: pw, role: "STUDENT", phone: "+998901234567" },
  });
  await prisma.user.upsert({
    where: { email: "teacher@dreamkorea.uz" },
    update: {},
    create: { email: "teacher@dreamkorea.uz", name: "Kim Ji-Hoon", password: pw, role: "TEACHER" },
  });
  await prisma.user.upsert({
    where: { email: "admin@dreamkorea.uz" },
    update: {},
    create: { email: "admin@dreamkorea.uz", name: "Admin", password: pw, role: "ADMIN" },
  });

  // MongoDB: id генерируется автоматически (ObjectId), не указываем вручную
  let c1 = await prisma.course.findFirst({ where: { title: "Koreys tili 1-daraja" } });
  if (!c1) c1 = await prisma.course.create({ data: { title: "Koreys tili 1-daraja", subtitle: "Boshlang‘ich (A1)", level: "A1", teacherName: "Kim Ji-Hoon", description: "Noldan boshlab koreys tili", price: 890000 } });
  let c2 = await prisma.course.findFirst({ where: { title: "TOPIK I tayyorgarlik" } });
  if (!c2) c2 = await prisma.course.create({ data: { title: "TOPIK I tayyorgarlik", subtitle: "Rasmiy imtihon", level: "TOPIK I", teacherName: "Lee Min-Jung", price: 1200000 } });

  const existingLessons = await prisma.lesson.count({ where: { courseId: c1.id } });
  if (existingLessons === 0) {
    for (let i = 1; i <= 6; i++) {
      await prisma.lesson.create({ data: { courseId: c1.id, order: i, title: `${i}-dars`, duration: "18 daq" } });
    }
  }

  if ((await prisma.vocabulary.count()) === 0) {
    for (const v of [
      { ko: "사랑", tr: "sarang", uz: "sevgi", level: "A1" },
      { ko: "학교", tr: "hakgyo", uz: "maktab", level: "A1" },
      { ko: "꿈", tr: "kkum", uz: "orzu", level: "A1" },
    ]) await prisma.vocabulary.create({ data: v });
  }

  if ((await prisma.grammar.count()) === 0) {
    for (const g of [
      { title: "입니다", desc: "Bo‘lishlik", level: "A1" },
      { title: "은/는", desc: "Mavzu yuklamasi", level: "A1" },
    ]) await prisma.grammar.create({ data: g });
  }

  if ((await prisma.university.count()) === 0) {
    await prisma.university.createMany({
      data: [
        { name: "Seoul National University", city: "Seoul", programs: ["Korean Language", "Engineering"], topik: "TOPIK 4", tuition: "$4,200 / yil" },
        { name: "Korea University", city: "Seoul", programs: ["Business", "Law"], topik: "TOPIK 4", tuition: "$5,100 / yil" },
        { name: "Yonsei University", city: "Seoul", programs: ["Business"], topik: "TOPIK 3", tuition: "$4,800 / yil" },
      ],
    });
  }

  if ((await prisma.test.count()) === 0) {
    const test = await prisma.test.create({ data: { title: "TOPIK I — Reading", level: "TOPIK I", type: "Reading" } });
    await prisma.question.create({
      data: {
        testId: test.id, order: 1, text: "다음 중 맞는 것을 고르십시오.", correct: "C",
        options: [{ key: "A", text: "학생입니다." }, { key: "B", text: "요리사입니다." }, { key: "C", text: "선생님입니다." }, { key: "D", text: "회사원입니다." }],
        explanation: "O‘qituvchi"
      }
    });
  }

  const alreadyEnrolled = await prisma.enrollment.findFirst({ where: { userId: student.id, courseId: c1.id } });
  if (!alreadyEnrolled) await prisma.enrollment.create({ data: { userId: student.id, courseId: c1.id, progress: 72 } });

  console.log("Seed done (MongoDB)");
}
main().finally(() => prisma.$disconnect());
