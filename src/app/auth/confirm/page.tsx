import { defaultLocale } from '@/i18n/config';

type ConfirmPageProps = {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
};

/**
 * Email scanners can open links before the recipient does. This page is safe
 * to open: the one-time Supabase token is only redeemed after the person
 * presses the confirmation button.
 */
export default async function ConfirmEmailPage({ searchParams }: ConfirmPageProps) {
  const { token_hash: tokenHash, type } = await searchParams;
  const valid = Boolean(tokenHash) && type === 'email';

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="card w-full max-w-md p-6 text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-[var(--color-gold-dark)]">SAFEEN TRUCKS</p>
        <h1 className="mt-3 text-2xl font-bold">Confirm your email</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          {valid
            ? 'Press the button below to finish creating your account.'
            : 'This confirmation link is missing information. Please request a new one.'}
        </p>
        {valid && (
          <form action="/auth/confirm/verify" method="post" className="mt-6">
            <input name="token_hash" type="hidden" value={tokenHash} />
            <button className="btn btn-primary w-full" type="submit">
              Confirm email
            </button>
          </form>
        )}
        <a className="mt-4 inline-block text-sm font-semibold hover:underline" href={`/${defaultLocale}/login`}>
          Go to login
        </a>
      </section>
    </main>
  );
}
