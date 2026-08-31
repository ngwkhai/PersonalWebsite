import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: 'avatars.githubusercontent.com' }],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'motion'],
  },

  // Velite writes to .velite during `next dev`; ignore it in the watcher-driven
  // type check so a mid-write partial file never fails the build.
  typescript: { ignoreBuildErrors: false },

  // The section was called "work" until it was renamed; links to a case study
  // are the kind of URL people paste into applications, so the old paths keep
  // resolving rather than 404ing.
  async redirects() {
    return [
      { source: '/:locale(en|vi)/work', destination: '/:locale/projects', permanent: true },
      {
        source: '/:locale(en|vi)/work/:slug',
        destination: '/:locale/projects/:slug',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), geolocation=(), microphone=(self)',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
