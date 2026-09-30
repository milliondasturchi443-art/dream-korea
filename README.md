# DREAM KOREA — Korean Language Learning Center

Premium EdTech platforma: koreys tili, TOPIK / EPS-TOPIK, universitetlarga qabul, video darslar, lug‘at, grammatika va AI yordamchi.

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui + lucide-react
- Framer Motion, Recharts, Zustand, Zod, React Hook Form, Sonner
- Prisma 5 + PostgreSQL, bcryptjs

## Ishga tushirish

```bash
npm install
cp .env.example .env   # DATABASE_URL ni to‘ldiring
npx prisma migrate dev --name init
npx prisma generate
npm run seed           # yoki: npx tsx prisma/seed.ts (tsx o‘rnating: npm i -D tsx)
npm run dev            # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

## Demo akkauntlar (development)

| Rol     | Email                    | Parol       | Kirishdan keyin |
|---------|--------------------------|-------------|----------------|
| Student | student@dreamkorea.uz    | password123 | /dashboard     |
| Teacher | teacher@dreamkorea.uz    | password123 | /teacher       |
| Admin   | admin@dreamkorea.uz      | password123 | /admin         |

Auth — mock (localStorage), keyin NextAuth/JWT ga almashtirishga tayyor. `lib/auth.ts` dagi `roleHome()` ga qarang.

## Sahifalar

- `/` — Landing (hero, features, kurslar, TOPIK, stats, FAQ)
- `/dashboard` — Student dashboard (streak, progress, tezkor amallar)
- `/courses`, `/courses/[id]`, `/lessons/[id]` — Kurslar va dars player
- `/topik`, `/topik/exam`, `/topik/result` — Test tizimi (timer, progress, natija + Recharts)
- `/vocabulary`, `/grammar`, `/books`, `/videos`, `/media`
- `/universities`, `/admission`, `/profile`, `/payment`, `/notifications`, `/ai`
- `/teacher`, `/admin`

## Prisma

```bash
npx prisma studio
npx prisma migrate dev
npx prisma db push
```

Seed: `prisma/seed.ts` — users, courses, lessons, vocab, grammar, universities, test.

## Env

`.env.example` ga qarang: `DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, `CLICK_API_KEY`, `PAYME_API_KEY`.


## Деплой на Vercel

1. Импортируй репозиторий на https://vercel.com/new
2. В Vercel → Settings → Environment Variables добавь:
   - `DATABASE_URL` = `mongodb+srv://dreamkorea795_db_user:<pass>@cluster0.c9fhrmg.mongodb.net/dreamkorea?retryWrites=true&w=majority&appName=Cluster0`
   - `AUTH_SECRET` (= `NEXTAUTH_SECRET`) — `openssl rand -base64 32`
   - `NEXTAUTH_URL` = `https://<твой-домен>.vercel.app`
   - опционально: `OPENAI_API_KEY`, `CLICK_API_KEY`, `PAYME_API_KEY`
3. Deploy. После первого деплоя засейдь базу локально:
   ```bash
   DATABASE_URL="mongodb+srv://..." npm run seed
   ```
   Или через `vercel env pull` и затем `npm run seed`.

## Что нужно для бекенда

- **База:** MongoDB Atlas уже подключена (`cluster0.c9fhrmg.mongodb.net/dreamkorea`). Коллекции создаются `prisma db push`.
- **Auth:** сейчас mock (localStorage). Для продакшна поставь NextAuth/Auth.js или JWT (access+refresh), хеш уже `bcryptjs`. Env: `AUTH_SECRET`.
- **API:** Route Handlers в `app/api/**` (пока нет — фронт на mock-data; добавлять по мере готовности).
- **Платежи:** Click/Payme/Uzum — мок UI в `/payment`, нужен webhook + `Payment` статусы.
- **AI:** `/ai` — мок, подключи `OPENAI_API_KEY` (OpenAI-compatible).
