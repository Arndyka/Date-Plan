import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync } from 'node:fs';
test('dashboard contrast and accessible controls', async ({ page }, info) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Jelajahi demo' }).click();
  await expect(page.getByRole('heading', { name: 'Waktu berdua, dibuat istimewa.' })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  writeFileSync(
    info.outputPath('axe.json'),
    JSON.stringify(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
      null,
      2,
    ),
  );
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

test('date ideas and profile choices remain accessible on narrow screens', async ({
  page,
}, info) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Jelajahi demo' }).click();
  await page.getByRole('link', { name: 'Jelajahi ide date' }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(
    page.getByRole('region', { name: 'Date minggu ini' }).getByRole('article'),
  ).toHaveCount(6);
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
  await page.screenshot({ path: info.outputPath('recommendations.png'), animations: 'disabled' });
  await page.getByRole('region', { name: 'Date minggu ini' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('weekly-cards.png'), animations: 'disabled' });
  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.goto('./#/settings');
  await page.getByText('Nama kecil Arnold & Angel', { exact: true }).click();
  await page.getByRole('button', { name: 'Angel Angel Lastriani Munthe', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Nama panggilanmu diperbarui');
  await page.reload();
  await expect(page.locator('.member-list strong').first()).toHaveText('Angel');
  const profileAudit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(profileAudit.violations.map((v) => v.id)).toEqual([]);
});
