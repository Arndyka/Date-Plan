import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Jelajahi demo' }).click();
});

test('plans, activity budgets, completion and persistence', async ({ page }) => {
  await page.getByRole('button', { name: 'Buat date baru', exact: true }).first().click();
  await page.getByLabel('Judul date').fill('Museum bersama');
  await page.getByLabel('Tanggal', { exact: true }).fill('2026-12-20');
  await page.getByLabel('Batas budget (Rp)').fill('300000');
  await page.getByRole('button', { name: 'Simpan rencana' }).click();
  await expect(page.getByRole('heading', { name: 'Museum bersama' })).toBeVisible();
  await page.getByRole('button', { name: 'Tambah kegiatan' }).click();
  await page.getByLabel('Nama kegiatan').fill('Kopi sore');
  await page.getByLabel('Estimasi (Rp)').fill('80000');
  await page.getByLabel('Aktual (Rp)').fill('60000');
  await page.getByLabel('Dibayar kamu (Rp)').fill('60000');
  await page.getByRole('button', { name: 'Simpan kegiatan' }).click();
  await expect(page.getByText('Kopi sore', { exact: true })).toBeVisible();
  await expect(page.getByTestId('actual-total')).toContainText('60.000');
  await page.reload();
  await expect(page.getByText('Kopi sore', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit rencana' }).click();
  await page.getByLabel('Status').selectOption('selesai');
  await page.getByRole('button', { name: 'Simpan rencana' }).click();
  await expect(page.getByText('Date selesai, kenangan bertambah!')).toBeVisible();
});

test('calendar notes and safe TikTok references', async ({ page }) => {
  await page.getByRole('link', { name: 'Kalender', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah catatan' }).click();
  await page.getByLabel('Judul catatan').fill('Anniversary kita');
  await page.getByRole('button', { name: 'Simpan catatan' }).click();
  await expect(page.getByRole('heading', { name: 'Anniversary kita', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Inspirasi', exact: true }).click();
  await page.getByRole('button', { name: 'Simpan inspirasi', exact: true }).click();
  await page.getByLabel('Judul inspirasi').fill('Ide lucu');
  await page.getByLabel('Tautan TikTok').fill('https://tiktok.com.evil.test/video/1');
  await page.getByRole('button', { name: 'Simpan referensi' }).click();
  await expect(page.getByRole('alert')).toContainText('TikTok');
  await page.getByLabel('Tautan TikTok').fill('https://vt.tiktok.com/abcdef/');
  await page.getByRole('button', { name: 'Simpan referensi' }).click();
  await expect(page.getByRole('heading', { name: 'Ide lucu', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buka di TikTok' }).last()).toHaveAttribute(
    'href',
    'https://vt.tiktok.com/abcdef/',
  );
});

test('wishlist, vote, random idea and reduced motion layout', async ({ page }) => {
  if (await page.getByRole('button', { name: 'Lainnya', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Lainnya', exact: true }).click();
  await page.getByRole('link', { name: 'Wishlist', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah wishlist' }).click();
  await page.getByLabel('Nama tempat / ide').fill('Piknik gemas');
  await page.getByRole('button', { name: 'Simpan wishlist' }).click();
  const card = page
    .locator('article')
    .filter({ has: page.getByText('Piknik gemas', { exact: true }) });
  await card.getByRole('button', { name: 'Suka ide ini' }).click();
  await expect(card.getByRole('button', { name: 'Batalkan suka' })).toContainText('1');
  await page.getByRole('button', { name: 'Pilihkan ide date' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('responsive visual review, no runtime errors, keyboard dialog', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await expect(page.getByRole('heading', { name: 'Waktu berdua, dibuat istimewa.' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: info.outputPath('dashboard.png'),
    fullPage: true,
    animations: 'disabled',
  });
  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.getByRole('button', { name: 'Buat date baru', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Buat date baru', exact: true })).toBeFocused();
  expect(errors).toEqual([]);
});

test('edits checklist details and connects an inspiration to a plan', async ({ page }) => {
  await page.getByRole('link', { name: 'Lihat rencana kita', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Alas piknik dan snack', exact: true }).click();
  await page.getByLabel('Barang / tugas').fill('Bawa payung lipat');
  await page.getByLabel('Penanggung jawab').selectOption({ label: 'Dia' });
  await page.getByRole('button', { name: 'Simpan checklist' }).click();
  await expect(page.getByRole('checkbox', { name: /Bawa payung lipat/ })).toBeVisible();
  await page.getByRole('link', { name: 'Inspirasi', exact: true }).click();
  await page.getByRole('button', { name: 'Simpan inspirasi', exact: true }).click();
  await page.getByLabel('Judul inspirasi').fill('Piknik referensi');
  await page.getByLabel('Tautan TikTok').fill('https://vt.tiktok.com/linked/');
  await page.getByLabel('Untuk rencana').selectOption('demo-picnic');
  await page.getByRole('button', { name: 'Simpan referensi' }).click();
  await expect(
    page.getByRole('link', { name: 'A little picnic, a lot of us', exact: true }),
  ).toHaveAttribute('href', '#/plans/demo-picnic');
});
