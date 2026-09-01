import { defineConfig, devices } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

/**
 * `next start` reads .env.local; this process does not.
 *
 * Without it the agent spec computes `live` from an empty environment, decides
 * the server cannot serve, and runs the spend-guard tests against a server that
 * is in fact fully configured — so they assert a refusal that never comes and
 * fail on every local run. Read the same file the server will, without
 * overriding anything already set.
 */
for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const entry = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!entry) continue;
    const key = entry[1]!;
    if (process.env[key] !== undefined) continue;
    process.env[key] = entry[2]!.trim().replace(/^["']|["']$/g, '');
  }
}

const PORT = 3100;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL,
    trace: 'on-first-retry',
    // Lenis and the restore animation are timing-sensitive, so assertions are
    // stabler with motion off — and this exercises the reduced-motion path a
    // real reader can enable. @playwright/test 1.62 takes it as a context
    // option rather than a top-level `use` key.
    contextOptions: { reducedMotion: 'reduce' },
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
  ],

  // Tests run against a production build: dev-mode React double-renders and
  // Turbopack's overlay both produce failures that never reach a visitor.
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
