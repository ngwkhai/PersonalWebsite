import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';

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
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
