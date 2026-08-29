import Link from 'next/link';

/**
 * Root-level fallback for paths that never reach a locale segment — the
 * localised version lives at app/[locale]/not-found.tsx.
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          background: '#f7f6f9',
          color: '#16131f',
        }}
      >
        <main style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>No page here</h1>
          <p style={{ color: '#5a5468', marginTop: '0.5rem' }}>
            That link does not lead anywhere on this site.
          </p>
          <Link
            href="/en"
            style={{ color: '#3b528b', marginTop: '1.5rem', display: 'inline-block' }}
          >
            Back to the start
          </Link>
        </main>
      </body>
    </html>
  );
}
