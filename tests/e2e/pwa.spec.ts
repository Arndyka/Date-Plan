import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

test('installable manifest and app guidance work under the repository path', async ({
  page,
  request,
}, info) => {
  await page.goto('./');
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  const manifestUrl = new URL(
    (await page.locator('link[rel="manifest"]').getAttribute('href'))!,
    page.url(),
  );
  const manifest = await (await request.get(manifestUrl.href)).json();
  expect(new URL(manifest.start_url, manifestUrl).pathname).toBe('/Date-Plan/');
  expect(new URL(manifest.scope, manifestUrl).pathname).toBe('/Date-Plan/');
  expect(manifest.display).toBe('standalone');
  for (const size of [192, 512]) {
    const icon = manifest.icons.find((x: { sizes: string }) => x.sizes === `${size}x${size}`);
    expect(icon).toBeTruthy();
    const response = await request.get(new URL(icon.src, manifestUrl).href);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
    const png = await response.body();
    expect(png.readUInt32BE(16)).toBe(size);
    expect(png.readUInt32BE(20)).toBe(size);
  }
  await page.getByRole('button', { name: 'Jelajahi demo' }).click();
  await page.goto('./#/settings');
  await page.getByRole('heading', { name: 'Date-Plan di layar utama.' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('install-app.png') });
  await expect(page.getByRole('button', { name: 'Pasang di HP', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cara memasang', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Tambahkan ke Layar Utama');
  await page.keyboard.press('Escape');
  // Simulate the browser event; actual OS installation still requires a real device.
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        document.body.dataset.installPromptOpened = 'yes';
      },
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    });
    window.dispatchEvent(event);
  });
  await page.getByRole('button', { name: 'Pasang di HP', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-install-prompt-opened', 'yes');
  await expect(page.getByRole('status')).toContainText('Pemasangan dibatalkan');
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(page.getByRole('button', { name: 'Pasang di HP', exact: true })).toHaveCount(0);
});

test('a new worker preserves drafts in both tabs until each explicitly reloads', async ({
  page,
  context,
}) => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Service worker requires the production build.');
  let release = 1;
  const dist = resolve('dist');
  const server = createServer(async (req, res) => {
    const path = new URL(req.url || '/', 'http://localhost').pathname;
    if (!path.startsWith('/Date-Plan/')) {
      res.writeHead(404).end();
      return;
    }
    const file = resolve(dist, path.slice('/Date-Plan/'.length) || 'index.html');
    if (!file.startsWith(dist + sep)) {
      res.writeHead(404).end();
      return;
    }
    try {
      let data = await readFile(file);
      if (file.endsWith('sw.js'))
        data = Buffer.from(
          data
            .toString()
            .replace(/date-plan-shell-([a-f0-9]+)/, `date-plan-shell-$1-test${release}`),
        );
      const mime: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.webmanifest': 'application/manifest+json',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
      };
      res
        .writeHead(200, {
          'Content-Type': mime[extname(file)] || 'application/octet-stream',
          'Cache-Control': 'no-store',
        })
        .end(data);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Test server failed');
    await page.goto(`http://127.0.0.1:${address.port}/Date-Plan/`);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      await caches.open('spendly-shell-keep');
    });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.getByRole('button', { name: 'Jelajahi demo' }).click();
    await page.getByRole('button', { name: 'Buat date baru', exact: true }).first().click();
    await page.getByLabel('Judul date').fill('Draft sebelum update');
    const partner = await context.newPage();
    await partner.goto(page.url());
    await partner.getByRole('button', { name: 'Jelajahi demo' }).click();
    await partner.getByRole('button', { name: 'Buat date baru', exact: true }).first().click();
    await partner.getByLabel('Judul date').fill('Draft tab kedua');
    await page.bringToFront();
    release = 2;
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.ready).update();
    });
    await expect(page.getByLabel('Pembaruan aplikasi')).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel('Judul date')).toHaveValue('Draft sebelum update');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Muat ulang versi baru' }).click();
    await expect(
      page.getByRole('heading', { name: 'Waktu berdua, dibuat istimewa.' }),
    ).toBeVisible();
    await expect(page.getByLabel('Pembaruan aplikasi')).toHaveCount(0);
    const keys = await page.evaluate(() => caches.keys());
    expect(keys).toContain('spendly-shell-keep');
    expect(keys.some((key) => key.endsWith('-test1'))).toBe(false);
    expect(keys.some((key) => key.endsWith('-test2'))).toBe(true);
    await partner.bringToFront();
    await expect(partner.getByLabel('Judul date')).toHaveValue('Draft tab kedua');
    await partner.keyboard.press('Escape');
    await partner.getByRole('button', { name: 'Muat ulang versi baru' }).click();
    await expect(partner.getByLabel('Pembaruan aplikasi')).toHaveCount(0);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((done) => server.close(() => done()));
  }
});

test('offline fallback and static cache never store cloud data or touch sibling apps', async ({
  page,
  context,
}) => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'Service worker requires the production build.');
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    await caches.open('spendly-shell-test');
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.evaluate(async () => {
    await fetch('https://rwdwbvnunsnampznfhyv.supabase.co/auth/v1/settings').catch(() => {});
    await fetch('./?private-test-token=do-not-cache');
  });
  const cacheState = await page.evaluate(async () => {
    const keys = await caches.keys();
    const urls: string[] = [];
    for (const key of keys.filter((k) => k.startsWith('date-plan-shell-'))) {
      const requests = await (await caches.open(key)).keys();
      urls.push(...requests.map((r) => r.url));
    }
    return { keys, urls };
  });
  expect(cacheState.keys).toContain('spendly-shell-test');
  expect(cacheState.urls.length).toBeGreaterThan(0);
  expect(cacheState.urls.every((url) => new URL(url).pathname.startsWith('/Date-Plan/'))).toBe(
    true,
  );
  expect(cacheState.urls.some((url) => /supabase|private-test-token/.test(url))).toBe(false);
  await context.setOffline(true);
  await page.goto('./#/plans');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sebentar, koneksinya terputus.' })).toBeVisible();
  await expect(page.getByText(/Login dan sinkronisasi memerlukan internet/)).toBeVisible();
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Coba lagi' }).click();
  await expect(page.getByRole('button', { name: 'Jelajahi demo' })).toBeVisible();
});
