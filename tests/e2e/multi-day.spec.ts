import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('multi-day trip, dated and overnight activities, calendar and shrink protection', async ({
  page,
}, info) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Jelajahi demo' }).click();
  await page.getByRole('button', { name: 'Buat date baru', exact: true }).first().click();
  await page.getByLabel('Judul date').fill('Bandung 23–25');
  await page.getByLabel('Tanggal mulai', { exact: true }).fill('2026-10-23');
  await page.getByLabel('Tanggal selesai', { exact: true }).fill('2026-10-25');
  await page.getByLabel('Jam mulai (WIB)', { exact: true }).fill('23:00');
  await page.getByLabel('Jam selesai (WIB)', { exact: true }).fill('18:00');
  await page.getByRole('button', { name: 'Simpan rencana' }).click();
  const planUrl = page.url();
  await expect(page.getByRole('heading', { name: 'Bandung 23–25', exact: true })).toBeVisible();
  const google = page.getByRole('link', { name: 'Save to Google Calendar' });
  expect(new URL((await google.getAttribute('href'))!).searchParams.get('dates')).toBe(
    '20261023T160000Z/20261025T110000Z',
  );
  for (const [title, day, endDay, start, end] of [
    ['Kereta malam', '23', '24', '23:30', '02:00'],
    ['Sarapan Sabtu', '24', '', '08:00', '09:00'],
    ['Sarapan Minggu', '25', '', '08:00', '09:00'],
  ]) {
    await page.getByRole('button', { name: 'Tambah kegiatan', exact: true }).click();
    const date = page.getByLabel('Tanggal kegiatan', { exact: true });
    await expect(date).toHaveAttribute('min', '2026-10-23');
    await expect(date).toHaveAttribute('max', '2026-10-25');
    await page.getByLabel('Nama kegiatan').fill(title);
    await date.fill(`2026-10-${day}`);
    if (endDay) await page.getByLabel('Tanggal selesai kegiatan').fill(`2026-10-${endDay}`);
    await page.getByLabel('Mulai (WIB)', { exact: true }).fill(start);
    await page.getByLabel('Selesai (WIB)', { exact: true }).fill(end);
    await page.getByRole('button', { name: 'Simpan kegiatan' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await page.reload();
  for (const day of ['23', '24', '25'])
    await expect(
      page.getByRole('heading', { name: `${day} Oktober 2026`, exact: true }),
    ).toBeVisible();
  await expect(page.getByText(/Ada jam kegiatan yang tumpang tindih/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Naikkan Sarapan Minggu' })).toBeDisabled();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([]);
  await page.screenshot({ path: info.outputPath('multi-day.png'), fullPage: true });
  await page.getByRole('button', { name: 'Edit rencana' }).click();
  await page.getByLabel('Tanggal selesai', { exact: true }).fill('2026-10-24');
  await page.getByRole('button', { name: 'Simpan rencana' }).click();
  await expect(page.getByRole('alert')).toContainText('kegiatan di luar rentang');
  await page.keyboard.press('Escape');
  await page.goto('./#/calendar');
  // Navigate independently of the machine's current month.
  while (!(await page.getByRole('heading', { name: 'Oktober 2026', exact: true }).count())) {
    const title = await page.locator('.calendar-heading h2').innerText();
    const currentYear = Number(title.match(/\d{4}/)?.[0]);
    await page
      .getByRole('button', {
        name:
          currentYear > 2026 || (currentYear === 2026 && /November|Desember/i.test(title))
            ? 'Bulan sebelumnya'
            : 'Bulan berikutnya',
      })
      .click();
  }
  for (const day of ['23', '24', '25']) {
    await page.getByRole('button', { name: new RegExp(`^${day} Oktober 2026,`) }).click();
    await expect(
      page.locator('.day-detail').getByRole('heading', { name: 'Bandung 23–25' }),
    ).toBeVisible();
  }
  await page.goto(planUrl);
  await expect(page.getByRole('heading', { name: 'Sarapan Minggu', exact: true })).toBeVisible();
});
