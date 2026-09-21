import Link from 'next/link';

/** Rendered outside the locale layout, so it carries its own brand styling. */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'Segoe UI, system-ui, sans-serif',
          display: 'grid',
          placeItems: 'center',
          minHeight: '100dvh',
          margin: 0,
          background: '#0B0B0B',
          color: '#ECEBE6',
        }}
      >
        <main style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', margin: 0, letterSpacing: '-0.02em' }}>404</h1>
          <p style={{ color: '#A3A09A' }}>Page not found.</p>
          <Link
            href="/en"
            style={{ color: '#D4AF37', fontWeight: 600, textDecoration: 'none' }}
          >
            Go to Safeen Trucks
          </Link>
        </main>
      </body>
    </html>
  );
}
