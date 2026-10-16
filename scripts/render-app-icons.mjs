// Rasterize the repo-native SVG using the browser; no generated-image dependency.
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const browser = await chromium.launch({
  channel: process.platform === 'win32' ? 'msedge' : undefined,
});
try {
  const svg = await readFile('public/icons/app.svg', 'utf8');
  for (const [size, name] of [
    [192, 'icon-192'],
    [512, 'icon-512'],
    [180, 'apple-touch-icon'],
  ]) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<style>body{margin:0}svg{width:100vw;height:100vh;display:block}</style>${svg}`,
    );
    await page.screenshot({ path: `public/icons/${name}.png` });
    await page.close();
  }
} finally {
  await browser.close();
}
