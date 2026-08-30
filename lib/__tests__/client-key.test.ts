import { describe, expect, it } from 'vitest';
import { clientKey } from '../rate-limit';

const h = (init: Record<string, string>) => new Headers(init);

describe('clientKey', () => {
  it('prefers the header the platform sets over the one a client can forge', () => {
    // A caller sending its own x-forwarded-for must not be able to pick its
    // own rate-limit bucket and rotate out of the limit.
    expect(
      clientKey(
        h({
          'x-vercel-forwarded-for': '203.0.113.9',
          'x-forwarded-for': '198.51.100.1',
          'x-real-ip': '198.51.100.2',
        }),
      ),
    ).toBe('203.0.113.9');
  });

  it('falls back to x-real-ip before the forgeable header', () => {
    expect(clientKey(h({ 'x-real-ip': '198.51.100.2', 'x-forwarded-for': '1.2.3.4' }))).toBe(
      '198.51.100.2',
    );
  });

  it('takes the first hop from x-forwarded-for when nothing better exists', () => {
    expect(clientKey(h({ 'x-forwarded-for': '203.0.113.5, 70.41.3.18' }))).toBe('203.0.113.5');
  });

  it('shares one bucket among unidentifiable callers rather than giving each its own', () => {
    expect(clientKey(h({}))).toBe('anonymous');
    expect(clientKey(h({ 'x-forwarded-for': '  ' }))).toBe('anonymous');
  });
});
