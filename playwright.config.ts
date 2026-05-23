import { defineConfig, devices } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Vite auto-loads .env for the browser bundle, but the Playwright test runner
// runs in Node and needs it loaded explicitly so test.skip() checks against
// VITE_SUPABASE_URL behave correctly. Tiny inline loader avoids a dotenv dep.
// Project is ESM ("type": "module") so __dirname is unavailable; cwd works
// because playwright runs from the repo root.
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] === undefined) {
      // Strip surrounding quotes if present.
      process.env[key] = rawValue.replace(/^["'](.*)["']$/, '$1');
    }
  }
}

/**
 * Smoke-test config. Boots the Shipstack dev server (Express + Vite) and runs
 * tests against http://localhost:3000. Workers are pinned to 1 because some
 * tests toggle the simulated network offline/online state, which is per-context
 * but shares the underlying dev server.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'off',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/api/health',
    reuseExistingServer: true,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
