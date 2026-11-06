# Monthly payment ledger

## Data and compatibility

- The existing MongoDB database, `User`, `Group`, `GroupMember`, and `Payment` are retained.
- New `Payment` fields are optional. Existing documents do not require a destructive migration.
- An explicit `billingMonth`, or a legacy `month` strictly matching `YYYY-MM`, determines the billing month. Receipt/creation dates never determine it.
- Unknown months remain in the history's **Hisob oyi noma’lum** filter. Administrators can assign them only with a supporting explanation; the change is audited.
- Legacy unknown receipt dates and tuition are displayed as unknown. Do not infer tuition from payments: they may be partial payments.
- Refunds are separate `Payment` documents with `operationType=REFUND`. They reduce income only in their billing month.
- `PaymentMonth` snapshots tuition, monthly lesson hours and teachers. Its deterministic Mongo `_id` enforces one account per student/month without unsafe nullable unique indexes on legacy payments.
- Opening a month initializes missing accounts lazily, with zero receipts. Current/future months copy a student's configured default tariff/hours; old months never inherit today's tariff. Already-created months are never overwritten by default changes.
- Tuition and hours must initially be configured in **Tarif / soatlar**. Use the default checkbox for future newly opened months. Unknown tuition is excluded from debt totals and prominently reported as incomplete.
- Financial entries are not deleted. **Bekor qilish** preserves the original and records a reason in `ActivityLog`; incorrect entries can then be replaced. Refunds prevent invalid cancellation of spent receipts.
- Teachers retain read access to their students' receipt/reminder list, but financial writes are administrator-only.

## Students, duplicates and archiving

Deleting a student is intentionally conservative, because the same account can own real money.

| Action | Behaviour |
|---|---|
| `DELETE /api/users/[id]` | Works only when the student has **no** `Payment`. Empty `PaymentMonth` rows do not block it: the panel creates them automatically, so they are not financial history. Related progress rows are removed in one transaction. |
| `DELETE` on an account with payments | Returns `409` with `code: HAS_FINANCIAL_HISTORY`. Nothing is deleted. |
| `PATCH /api/users/[id] { archived: true }` | Sets `User.archivedAt`. The student disappears from lists and from the payment panel, but every `Payment` stays intact and is still included in history and totals. |
| `POST /api/users/[id]/merge { targetId }` | Moves all `Payment` and `PaymentMonth` rows to the target student, then removes the duplicate account. Writes an `ActivityLog` entry `STUDENT_MERGED`. |

Archived accounts are hidden by default. The admin users page requests `/api/users?archived=1` and shows an "Arxivni ko'rsatish" toggle.

**Important MongoDB detail:** `archivedAt: null` does **not** match documents where the field is missing, and every pre-existing student lacks that field. Every archive filter therefore uses
`OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }]`. Using only `null` silently hides the entire student body.

Deleting a teacher is blocked while they still own groups or homework (`code: TEACHER_HAS_ASSIGNMENTS`), so groups never end up without a teacher.

## Deployment

1. Take the normal MongoDB backup/snapshot before releasing financial changes.
2. Run a read-only baseline audit against the configured database:
   `npx tsx scripts/payment-audit.ts` (с переменными окружения из `.env`).
3. Deploy with the normal `npm run build` (`prisma generate` is included). No reset, collection deletion, or `db push --accept-data-loss` is needed.
4. Optionally add only the ledger's non-unique indexes:
   `npx tsx scripts/payment-audit.ts --indexes`.
   This never rewrites payment documents. Primary `_id` indexes already protect accounts and request receipts.
5. Repeat the read-only audit before live financial operations. Count and fingerprint must match the baseline.
6. Open the panel, configure verified monthly tuition/hours, and check old-month totals. Opening the panel creates monthly accounts but does not modify existing payments.

## API

`GET /api/payments/ledger?billingMonth=YYYY-MM` returns backend-computed student balances, month summary, monthly comparison and operation history. Optional `userId` returns one month's balances for a form.

`POST /api/payments/ledger` accepts `action`, UUID `requestId`, `userId`, `billingMonth`, and action fields. Actions: `PAYMENT`, `REFUND`, `TARIFF`, `REMINDER`, `CONFIRM`, `VOID`, `ASSIGN`.

Amounts are integer UZS, 0–1,000,000,000 (payments/refunds strictly positive). Dates are validated calendar dates. Every mutation, audit record, notification and idempotency receipt commits in one Mongo transaction. Each operation touches its month's revision to serialize concurrent balance changes. Repeated identical requests return the original result; reuse with different data returns 409. Invalid refunds return 409 without changes.

The old `/api/payments` reader stays compatible. Old mutation routes reject writes; clients must use the ledger so they cannot bypass refund/idempotency checks. Physical DELETE is disabled.

## Tests

- Unit scenarios: `npx tsx --test tests/payment-accounting.test.ts`.
- Database integration: point `DATABASE_URL` at an **isolated** database named `dreamkorea_payment_test_<digits>`, then `npx tsx tests/payment-ledger.integration.ts`. The test refuses other database names. Uses real MongoDB transactions; no mocks. Test databases are retained for inspection.
- Student lifecycle: `npx tsx tests/student-delete.integration.ts` (isolated database) covers deletion of a student with only empty month accounts, the `HAS_FINANCIAL_HISTORY` block, archive/restore keeping payments, and duplicate merge moving payments to the target.
- Duplicate fix: `npx tsx tests/fix-student-duplicate.integration.ts` (isolated database) covers `scripts/fix-student-duplicate.ts` — dry-run safety, merge, void-instead-of-delete, the month staying at 300000 and a safe rerun.
- Browser: `node --env-file=.env tests/payment-panel.browser.cjs`. This creates an isolated test database, starts the production build on port 3197 and tests real API/database flows. Requires Playwright/Chromium. Set `PLAYWRIGHT_MODULE` if Playwright is not installed as a project dependency. Screenshots go to `/tmp/opencode/`.
- Production smoke: `node --env-file=.env tests/production-users-ui.cjs`. Read-only check against `https://dream-korea.onrender.com`: verifies the users page archive/merge/delete controls, the archive toggle, that the merge dialog lists candidates and can be cancelled, and that the payment panel shows exactly one row for a merged student. It signs in with the admin key (`POST /api/auth/admin-key`), which is rate limited to 5 attempts per 15 minutes per IP — set `DK_ADMIN_TOKEN` to reuse a token and avoid the limit. It never mutates production data.
- Payment corrections: an administrator can use `O‘zgartirish` on an active paid operation to correct its amount, factual payment date, or note. The old values are saved in `ActivityLog`; the payment is not physically deleted. Cancelled, refunded, or pending operations cannot be edited.
- Standard checks: `npm run typecheck`, targeted ESLint, `npm run build`.

The panel paginates rendered students/history (25 rows), supports combined name/teacher/monthly-hours filters and a mobile scrollable table. The current API returns the complete ledger for centre-wide comparisons; for substantially larger deployments, move history pagination and chart aggregation into database queries rather than truncating financial totals.
