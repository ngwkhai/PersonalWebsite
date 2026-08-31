import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

const KEYS = ['SITE_URL', 'VERCEL_PROJECT_PRODUCTION_URL', 'VERCEL_URL', 'PORT'] as const;

/** The module reads env at import time, so each case needs a fresh import. */
async function load(env: Partial<Record<(typeof KEYS)[number], string>>) {
  for (const key of KEYS) delete process.env[key];
  Object.assign(process.env, env);
  vi.resetModules();
  return import('../site');
}

describe('SITE_URL', () => {
  const original = { ...process.env };
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    process.env = { ...original };
  });

  it('prefers an explicit setting', async () => {
    const { SITE_URL } = await load({
      SITE_URL: 'https://khai.dev',
      VERCEL_PROJECT_PRODUCTION_URL: 'ignored.vercel.app',
    });
    expect(SITE_URL).toBe('https://khai.dev');
  });

  it('strips a trailing slash so paths never double up', async () => {
    const { absoluteUrl } = await load({ SITE_URL: 'https://khai.dev/' });
    expect(absoluteUrl('/en/projects')).toBe('https://khai.dev/en/projects');
  });

  it('falls back to the stable production domain, not the deployment host', async () => {
    // A preview must not publish a canonical URL pointing at itself.
    const { SITE_URL } = await load({
      VERCEL_PROJECT_PRODUCTION_URL: 'ngwkhai.vercel.app',
      VERCEL_URL: 'ngwkhai-git-branch-x.vercel.app',
    });
    expect(SITE_URL).toBe('https://ngwkhai.vercel.app');
  });

  it('uses the deployment host when there is no production domain yet', async () => {
    const { SITE_URL } = await load({ VERCEL_URL: 'ngwkhai-abc123.vercel.app' });
    expect(SITE_URL).toBe('https://ngwkhai-abc123.vercel.app');
  });

  it('never invents a domain when nothing is configured', async () => {
    // The old default was a real-looking address that is not registered, so a
    // missing variable silently advertised someone else's domain.
    const { SITE_URL } = await load({});
    expect(SITE_URL).toMatch(/^http:\/\/localhost:\d+$/);
  });

  it('joins paths with exactly one slash', async () => {
    const { absoluteUrl } = await load({ SITE_URL: 'https://khai.dev' });
    expect(absoluteUrl('en/projects')).toBe('https://khai.dev/en/projects');
    expect(absoluteUrl('/en/projects')).toBe('https://khai.dev/en/projects');
  });
});
