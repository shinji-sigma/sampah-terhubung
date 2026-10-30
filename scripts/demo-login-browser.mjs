import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
// Local production server with synthetic DEMO_PASSWORD; Cloud is never contacted.
const base = process.env.QA_BASE || 'http://127.0.0.1:3006';
// Supply synthetic public/server env when starting the local QA server.
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const width of [1440, 360]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.route('**/api/public*', route => route.fulfill({ json: { regions: [], schedules: [], exceptions: [], runs: [], incidents: [], events: [] } }));
    let authRequests = 0;
    page.on('request', request => { if (new URL(request.url()).pathname === '/api/auth') authRequests++; });
    await page.goto(base);
    await page.getByRole('button', { name: 'Masuk', exact: true }).first().click();
    for (const [name, email] of [['Admin Demo', 'admin@demo.invalid'], ['User Demo', 'pelapor.a@demo.invalid']]) {
      await page.getByRole('button', { name, exact: true }).click();
      await page.getByText('Akun simulasi terisi. Tekan Masuk untuk melanjutkan.').waitFor();
      assert.equal(await page.locator('input[name=email]').inputValue(), email);
      assert.equal(await page.locator('input[name=password]').inputValue(), 'synthetic-browser-test-only');
      assert.equal(authRequests, 0);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('input[name=password]').fill('');
    mkdirSync('output/demo-login', { recursive: true });
    await page.screenshot({ path: `output/demo-login/login-${width}.png`, fullPage: true });
    results.push({ width, autofill: 'both accounts pass', authRequests, overflow: false, backend: 'public data mocked; no Cloud auth' });
    await page.close();
  }
  writeFileSync('output/demo-login/browser.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally { await browser.close(); }
