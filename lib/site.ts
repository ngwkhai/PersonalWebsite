/**
 * The site's own origin, used for canonical URLs, the sitemap, JSON-LD and OG
 * image URLs.
 *
 * Read only on the server, so it deliberately carries no NEXT_PUBLIC_ prefix:
 * that prefix inlines a value into the browser bundle, and Vercel rightly warns
 * about it. Nothing here needs to reach the client.
 *
 * Resolution order:
 *   1. SITE_URL              — an explicit setting always wins
 *   2. VERCEL_PROJECT_PRODUCTION_URL — the stable production domain. Used even
 *      on preview deployments, so a preview never publishes a canonical URL
 *      pointing at itself.
 *   3. VERCEL_URL            — the per-deployment host, for a project with no
 *      production domain yet
 *   4. localhost             — development
 *
 * The previous default was a hardcoded domain that is not actually registered.
 * A missing variable would then have published canonical tags and a sitemap
 * pointing at someone else's address, which is worse than any visible failure.
 */
function resolve(): string {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (vercelHost) return `https://${vercelHost.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const SITE_URL = resolve();

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
