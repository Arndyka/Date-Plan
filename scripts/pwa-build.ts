import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

export function pwaBuild(): Plugin {
  return {
    name: 'date-plan-pwa',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = [
        'offline.html',
        'manifest.webmanifest',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/apple-touch-icon.png',
      ];
      const template = readFileSync('scripts/sw-template.js', 'utf8');
      const hash = createHash('sha256').update(template);
      for (const file of files) hash.update(readFileSync(`public/${file}`));
      for (const [name, output] of Object.entries(bundle).sort()) {
        if (!name.startsWith('assets/') || !/\.(js|css|woff2?|png|svg)$/.test(name)) continue;
        files.push(name);
        hash.update(name).update(output.type === 'chunk' ? output.code : output.source);
      }
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template
          .replace('__VERSION__', hash.digest('hex').slice(0, 16))
          .replace('__FILES__', JSON.stringify(files)),
      });
    },
  };
}
