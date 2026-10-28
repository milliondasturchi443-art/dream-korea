import { prisma } from "@/lib/db";
import { encryptPassword } from "@/lib/vault";
import * as bcrypt from "bcryptjs";
import crypto from "node:crypto";

// ---- Talaba hisobini avtomatik yaratish (Qabul bo'limi uchun) ----
// Email: dreamkoreastudent0001@gmail.com — faqat oxirgi 4 raqam o'zgaradi.
// Parol: tasodifiy 10 belgi (admin ko'rsatadi, talaba keyin o'zgartiradi).
const STUDENT_EMAIL_PREFIX = "dreamkoreastudent";
const STUDENT_EMAIL_DOMAIN = "gmail.com";

// Keyingi bo'sh raqam: mavjud max raqam + 1 (0001, 0002, …)
async function nextStudentEmail(): Promise<string> {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: STUDENT_EMAIL_PREFIX } },
    select: { email: true },
  });
  let max = 0;
  for (const u of users) {
    const m = /^dreamkoreastudent(\d+)@/i.exec(u.email || "");
    const n = m ? parseInt(m[1], 10) : NaN;
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${STUDENT_EMAIL_PREFIX}${String(max + 1).padStart(4, "0")}@${STUDENT_EMAIL_DOMAIN}`;
}

export type StudentAccount = { id: string; email: string; password: string | null; existing: boolean };

// Telefon bo'yicha mavjud talaba hisobini topadi (+998/bo'shliqlarni hisobga olgan holda)
export async function findStudentByPhone(phone: string) {
  const tail = phone.replace(/\D/g, "").slice(-9);
  return prisma.user.findFirst({
    where: { OR: [{ phone }, ...(tail ? [{ phoneKey: tail }, { phone: { contains: tail } }] : [])] },
    select: { id: true, email: true },
  });
}

// Hisob yo'q bo'lsa — yangi yaratadi; bo'lsa — mavjudini qaytaradi (parol null)
export async function ensureStudentAccount(name: string, phone: string): Promise<StudentAccount | null> {
  const existing = await findStudentByPhone(phone);
  if (existing) return { id: existing.id, email: existing.email, password: null, existing: true };

  const password = crypto.randomBytes(9).toString("base64url").slice(0, 10);
  const hash = await bcrypt.hash(password, 10);
  const tail = phone.replace(/\D/g, "").slice(-9) || null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const email = await nextStudentEmail();
    try {
      const u = await prisma.user.create({
        data: { name, phone, phoneKey: tail, email, password: hash, vaultPassword: encryptPassword(password), role: "STUDENT", emailVerified: true },
        select: { id: true, email: true },
      });
      return { id: u.id, email: u.email, password, existing: false };
    } catch {
      // raqam band (parallel yozuv) — kim yutdi: mavjudni qaytaramiz, aks holda keyingi raqam
      const byEmail = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
      if (byEmail) return { id: byEmail.id, email: byEmail.email, password: null, existing: true };
    }
  }
  return null;
}

// ---- Dars vaqti: "13:30" yoki "10:00 - 12:00" — doim aniq shu ko'rinishda saqlanadi ----
// Kirishda qabul qilinadi: "1:30", "1.30", "13:30", "10:00-12:00", "10:00 - 12:00".
// Natija: "01:30", "01:30", "13:30", "10:00 - 12:00". Vaqt mintaqasi TESHALMAYDI —
// yozilgan vaqt aynan yozilgan holda qoladi. Noto'g'ri bo'lsa — null.
const TIME_PART = /^(\d{1,2}):(\d{2})$/;
export function normalizeReceptionTime(raw: string): string | null {
  const parts = String(raw ?? "").trim().split(/\s*[-–]\s*/).filter(Boolean);
  if (parts.length === 0 || parts.length > 2) return null;
  const out: string[] = [];
  for (const p of parts) {
    const m = TIME_PART.exec(p.trim().replace(/[.,]/g, ":"));
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (hh > 23 || mm > 59) return null;
    out.push(`${String(hh).padStart(2, "0")}:${m[2]}`);
  }
  return out.join(" - ");
}
