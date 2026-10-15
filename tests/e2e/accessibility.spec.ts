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
