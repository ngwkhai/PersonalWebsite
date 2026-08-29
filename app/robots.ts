import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ngwkhai.dev';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /match echoes visitor-pasted job descriptions; the API routes are
        // metered and have nothing to index.
        disallow: ['/api/', '/en/match', '/vi/match'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
