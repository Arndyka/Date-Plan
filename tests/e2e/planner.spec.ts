import { test, expect } from '@playwright/test';

test('concurrent plan edits preserve the draft and reject stale saves', async ({
  page,
  context,
}) => {
  await page.getByRole('link', { name: 'Lihat rencana kita', exact: true }).click();
  const partner = await context.newPage();
  await partner.goto('./');
  await partner.getByRole('button', { name: 'Jelajahi demo' }).click();
  await partner.getByRole('link', { name: 'Lihat rencana kita', exact: true }).click();
  await page.bringToFront();
  await page.getByRole('button', { name: 'Edit rencana' }).click();
  await page.getByLabel('Judul date').fill('Draft milikku');
  await partner.bringToFront();
  await partner.getByRole('button', { name: 'Edit rencana' }).click();
  await partner.getByLabel('Judul date').fill('Disimpan pasangan');
  await partner.getByRole('button', { name: 'Simpan rencana' }).click();
  await expect(partner.getByRole('dialog')).toHaveCount(0);
  await page.bringToFront();
  await expect(page.locator('h1')).toHaveText('Disimpan pasangan');
  await page.getByRole('button', { name: 'Simpan rencana' }).click();
  await expect(page.getByRole('alert')).toContainText('diubah');
  await expect(page.getByLabel('Judul date')).toHaveValue('Draft milikku');
  await page.getByRole('button', { name: 'Simpan rencana' }).click();
  await expect(page.getByRole('alert')).toContainText('diubah');
  await partner.reload();
  await expect(partner.locator('h1')).toHaveText('Disimpan pasangan');
});

test('concurrent space edits preserve the draft and reject stale saves', async ({
  page,
  context,
}) => {
  await page.goto('./#/settings');
  const partner = await context.newPage();
  await partner.goto('./');
  await partner.getByRole('button', { name: 'Jelajahi demo' }).click();
  await partner.goto('./#/settings');
  await page.bringToFront();
  await page.getByRole('button', { name: 'Edit ruang' }).click();
  await page.getByLabel('Nama ruang').fill('Draft ruangku');
  await partner.bringToFront();
  await partner.getByRole('button', { name: 'Edit ruang' }).click();
  await partner.getByLabel('Nama ruang').fill('Ruang pasangan');
  await partner.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(partner.getByRole('dialog')).toHaveCount(0);
  await page.bringToFront();
  await expect(page.locator('.space-display h3')).toHaveText('Ruang pasangan');
  await page.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('diubah');
  await expect(page.getByLabel('Nama ruang')).toHaveValue('Draft ruangku');
  await partner.reload();
  await expect(partner.locator('.space-display h3')).toHaveText('Ruang pasangan');
});

test('single member rooms do not allocate a debt to an absent partner', async ({ page }) => {
  await page.evaluate(() => {
    const key = 'our-little-date.demo.v1';
    const data = JSON.parse(localStorage.getItem(key)!);
    data.members = data.members.slice(0, 1);
    data.tables.activities[0].data.actual = 300000;
    data.tables.activities[0].data.paidFirst = 300000;
    localStorage.setItem(key, JSON.stringify(data));
  });
  await page.reload();
  await page.getByRole('link', { name: 'Lihat rencana kita', exact: true }).click();
  await expect(page.getByText(/Patungan/)).toHaveCount(0);
  await expect(page.getByText(/perlu mengganti/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit rencana' }).click();
  await expect(page.getByLabel('Porsi anggota pertama (%)')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Tambah kegiatan' }).click();
  await expect(page.getByLabel('Dibayar kamu (Rp)')).toHaveCount(0);
});

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Jelajahi demo' }).click();
});

for (const editor of [
  { button: 'Edit rencana', label: 'Judul date', submit: 'Simpan rencana' },
  { button: 'Tambah kegiatan', label: 'Nama kegiatan', submit: 'Simpan kegiatan' },
  { button: 'Edit Alas piknik dan snack', label: 'Barang / tugas', submit: 'Simpan checklist' },
]) {
  test(`remote deletion preserves ${editor.submit} draft without resurrection`, async ({
    page,
    context,
  }) => {
    await page.getByRole('link', { name: 'Lihat rencana kita', exact: true }).click();
    const partner = await context.newPage();
    await partner.goto('./');
    await partner.getByRole('button', { name: 'Jelajahi demo' }).click();
    await partner.getByRole('link', { name: 'Lihat rencana kita', exact: true }).click();
    await page.bringToFront();
    await page.getByRole('button', { name: editor.button, exact: true }).click();
    await page.getByLabel(editor.label).fill('Draft jangan hilang');
    await partner.bringToFront();
    await partner.getByRole('button', { name: 'Hapus rencana', exact: true }).click();
    await partner.getByRole('button', { name: 'Hapus', exact: true }).click();
    await expect(partner.getByRole('heading', { name: 'Cerita berikutnya masih kosong.' })).toBeVisible();
    await page.bringToFront();
    await expect(page.getByRole('dialog').getByText(/Rencana ini sudah dihapus/)).toBeVisible();
    await expect(page.getByLabel(editor.label)).toHaveValue('Draft jangan hilang');
    await page.getByRole('button', { name: editor.submit, exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('dihapus');
    await page.keyboard.press('Escape');
    await expect(page.getByText('Rencana tidak ditemukan.')).toBeVisible();
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('our-little-date.demo.v1')!).tables.plans.length,
      ),
    ).toBe(0);
  });
}

test('plans, activity budgets, completion and persistence', async ({ page }) => {
  await page.getByRole('button', { name: 'Buat date baru', exact: true }).first().click();
  await page.getByLabel('Judul date').fill('Museum bersama');
  await page.getByLabel('Tanggal mulai', { exact: true }).fill('2026-12-20');
  await page.getByLabel('Batas budget (Rp)').fill('300000');
  await page.getByRole('button', { name: 'Simpan rencana' }).click();
  await expect(page.getByRole('heading', { name: 'Museum bersama' })).toBeVisible();
  await page.getByRole('button', { name: 'Tambah kegiatan' }).click();
  await page.getByLabel('Nama kegiatan').fill('Kopi sore');
  await page.getByLabel('Estimasi (Rp)').fill('80000');
  await page.getByLabel('Aktual (Rp)').fill('60000');
  await expect(page.getByLabel(/Dibayar/)).toHaveCount(0);
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
  await page.getByLabel('Penanggung jawab').selectOption({ label: 'Angel' });
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
