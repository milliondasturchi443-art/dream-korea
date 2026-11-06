/* eslint-disable @typescript-eslint/no-require-imports */
// Production smoke test for the users page controls (archive / merge / delete).
// Read-only: it never mutates production data — the merge dialog is opened and cancelled.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const BASE = 'https://dream-korea.onrender.com';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('ADMIN_EMAIL/ADMIN_PASSWORD required');

  // The admin panel is gated by its own key cookie (dk_admin), not the login token.
  // /api/auth/admin-key is rate limited (5 per 15 min per IP), so an existing
  // token can be supplied via DK_ADMIN_TOKEN and is preferred when present.
  let adminToken = process.env.DK_ADMIN_TOKEN || '';
  if (!adminToken) {
    const keyRes = await fetch(`${BASE}/api/auth/admin-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: password }),
    });
    const session = await keyRes.json();
    if (keyRes.status === 429) {
      const waitSec = Number(keyRes.headers.get('retry-after') || 900);
      console.log(`rate limited, waiting ${waitSec}s before retrying once…`);
      await new Promise(r => setTimeout(r, (waitSec + 5) * 1000));
      const retry = await fetch(`${BASE}/api/auth/admin-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: password }),
      });
      const retryBody = await retry.json();
      assert.equal(retry.status, 200, `admin key rejected after wait: ${JSON.stringify(retryBody)}`);
      adminToken = retryBody.token;
    } else {
      assert.equal(keyRes.status, 200, `admin key rejected: ${JSON.stringify(session)}`);
      adminToken = session.token;
    }
  }
  assert.ok(adminToken, 'admin key must yield a token');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const errors = [];
  try {
    await context.addCookies([{ name: 'dk_admin', value: adminToken, url: BASE }]);
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));

    // Users page: archive + merge + delete controls must exist for students.
    await page.goto(`${BASE}/adminstrationpanelofdreamkorea/users`, { waitUntil: 'domcontentloaded' });
    await page.getByText('O‘quvchilar').first().waitFor({ timeout: 40000 });
    await page.waitForSelector('text=Jami:', { timeout: 40000 });

    const archiveButtons = await page.locator('button[title*="Arxivlash"]').count();
    const mergeButtons = await page.locator('button[title*="birlashtirish"]').count();
    const deleteButtons = await page.locator('button[title*="o‘chirish"]').count();
    console.log('archive:', archiveButtons, '| merge:', mergeButtons, '| delete:', deleteButtons);
    assert.ok(archiveButtons > 0, 'archive button must be present');
    assert.ok(mergeButtons > 0, 'merge button must be present');
    assert.ok(deleteButtons > 0, 'delete button must be present');

    // Archived toggle must keep the list rendering.
    const before = await page.locator('text=Jami:').first().innerText();
    await page.getByRole('button', { name: /Arxivni ko‘rsatish|Arxivni yashirish/ }).first().click();
    await page.waitForTimeout(700);
    const after = await page.locator('text=Jami:').first().innerText();
    console.log('list count toggle:', before, '->', after);
    assert.ok(await page.locator('text=Jami:').first().isVisible(), 'list must still render after toggling archive');
    await page.getByRole('button', { name: /Arxivni ko‘rsatish|Arxivni yashirish/ }).first().click();

    // Merge dialog opens, lists candidates, and is cancelled (no mutation).
    await page.locator('button[title*="birlashtirish"]').first().click();
    await page.getByText('Dublikatni birlashtirish').waitFor({ timeout: 20000 });
    const candidates = await page.locator('button:has-text("@")').count();
    console.log('merge candidates:', candidates);
    assert.ok(candidates > 0, 'merge dialog must list candidate students');
    await page.getByRole('button', { name: 'Bekor qilish' }).click();
    await page.getByText('Dublikatni birlashtirish').waitFor({ state: 'hidden', timeout: 15000 });

    // Payments panel must still be healthy after the deploy. The table is
    // paginated (25 rows), so the merged student is searched for explicitly.
    await page.goto(`${BASE}/adminstrationpanelofdreamkorea/payments`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'To‘lov qo‘shish', exact: true }).waitFor({ timeout: 40000 });
    await page.getByLabel('Ism va familiya bo‘yicha qidirish').fill('Abdumajidov');
    // Wait for the filtered row itself rather than a fixed delay: the table is
    // only rendered once the ledger response has arrived.
    await page.locator('table').first().locator('tbody tr').first().waitFor({ timeout: 40000 });
    const rows = await page.locator('table').first().locator('tbody tr').count();
    const abd = await page.getByText(/Abdumajidov/i).count();
    console.log('payment panel rows for Abdumajidov:', rows, '| mentions:', abd);
    assert.ok(abd > 0, 'merged student must appear in the payment panel');
    assert.equal(rows, 1, 'duplicate must be gone: exactly one Abdumajidov row');

    assert.deepEqual(errors, [], `runtime errors: ${errors.join(' | ')}`);
    console.log('PASS: production users page has archive/merge/delete, archive toggle works, merge dialog lists candidates and cancels, payment panel healthy, no runtime errors');
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exitCode = 1; });
