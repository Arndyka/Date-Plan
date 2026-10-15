import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Jelajahi demo' }).click();
});

test('weekly suggestions, city persistence and a library idea become a real plan', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Jelajahi ide date' }).click();
  const weekly = page.getByRole('region', { name: 'Date minggu ini' });
  const library = page.getByRole('region', { name: 'Pustaka ide date' });
  await expect(weekly.getByRole('article')).toHaveCount(6);
  await expect(page.getByLabel('Kota rekomendasi')).toHaveValue('Bandung');
  await page.getByLabel('Cari ide').fill('Geologi');
  await expect(library.getByRole('article')).toHaveCount(1);
  await expect(library.getByRole('link', { name: 'Lihat di Maps' })).toHaveAttribute(
    'href',
    /Museum\+Geologi/,
  );
  await library.getByRole('button', { name: 'Jadikan rencana' }).click();
  await expect(page.getByLabel('Area / kota')).toHaveValue(/Museum Geologi/);
  await expect(page.getByLabel('Porsi anggota pertama (%)')).toHaveCount(0);
  await page.getByRole('button', { name: 'Simpan rencana' }).click();
  await expect(page.locator('h1')).toHaveText('Fosil, batuan, dan rasa penasaran');
  await expect(page.getByText(/Patungan|perlu mengganti/)).toHaveCount(0);
  await page.goto('./#/ideas');
  await page.getByLabel('Kota rekomendasi').fill('Yogyakarta');
  await page.getByRole('button', { name: 'Simpan lokasi' }).click();
  await expect(page.getByRole('status')).toContainText('Lokasi rekomendasi disimpan');
  await page.reload();
  await expect(page.getByLabel('Kota rekomendasi')).toHaveValue('Yogyakarta');
  await expect(
    page.getByRole('region', { name: 'Date minggu ini' }).getByRole('article'),
  ).toHaveCount(6);
  await page.getByLabel('Cari ide').fill('Geologi');
  await expect(library.getByRole('article')).toHaveCount(0);
  await expect(page.getByText('Belum ada ide yang cocok.')).toBeVisible();
});

test('free home ideas save to wishlist and shared city changes preserve local drafts', async ({
  page,
  context,
}) => {
  await page.goto('./#/ideas');
  await page.getByLabel('Suasana tempat').selectOption('Di rumah');
  await page.getByLabel('Batas anggaran berdua (Rp)').fill('0');
  const library = page.getByRole('region', { name: 'Pustaka ide date' });
  const first = library.getByRole('article').first();
  const title = await first.getByRole('heading').innerText();
  await first.getByRole('button', { name: 'Simpan wishlist' }).click();
  await expect(first.getByRole('button', { name: 'Sudah di wishlist' })).toBeDisabled();
  await page.goto('./#/wishlist');
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await page.goto('./#/ideas');
  await page.getByLabel('Kota rekomendasi').fill('Draft kota');
  const partner = await context.newPage();
  await partner.goto('./');
  await partner.getByRole('button', { name: 'Jelajahi demo' }).click();
  await partner.goto('./#/ideas');
  await partner.getByLabel('Kota rekomendasi').fill('Bogor');
  await partner.getByRole('button', { name: 'Simpan lokasi' }).click();
  await expect(partner.getByRole('status')).toContainText('Lokasi rekomendasi disimpan');
  await page.bringToFront();
  await expect(page.getByText('Pilihan bersama untuk Bogor', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Simpan lokasi' }).click();
  await expect(page.getByRole('alert')).toContainText('diubah');
  await expect(page.getByLabel('Kota rekomendasi')).toHaveValue('Draft kota');
});
