import Link from 'next/link';

export default function LocaleNotFound() {
  return (
    <div className="container-page max-w-lg py-20 text-center">
      <p className="text-5xl font-extrabold text-[var(--color-text)]">404</p>
      <h1 className="mt-3 text-xl font-bold text-[var(--color-text)]">Page not found</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        The page you are looking for does not exist or was removed.
      </p>
      <Link href="/" className="btn btn-primary mt-6">
        Go to homepage
      </Link>
    </div>
  );
}
