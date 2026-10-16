import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { pwaBuild } from './scripts/pwa-build';
export default defineConfig({
  plugins: [react(), pwaBuild()],
  base: '/Date-Plan/',
  test: { include: ['src/**/*.test.ts', 'tests/**/*.test.ts'], testTimeout: 30000 },
});
