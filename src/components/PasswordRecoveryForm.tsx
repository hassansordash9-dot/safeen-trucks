'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/i18n/I18nProvider';

export function PasswordRecoveryForm({ reset = false }: { reset?: boolean }) {
  const { t, locale } = useI18n();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password') ?? '');
    if (reset && password !== data.get('confirm')) { setError(t('auth.passwordMismatch')); return; }
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      if (reset) {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session.session) { setError(t('auth.recoveryExpired')); return; }
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) { setError(updateError.message); return; }
        await supabase.auth.signOut();
      } else {
        const { error: sendError } = await supabase.auth.resetPasswordForEmail(String(data.get('email') ?? '').trim(), {
          redirectTo: `${window.location.origin}/${locale}/reset-password`,
        });
        if (sendError) { setError(sendError.message); return; }
      }
      setSent(true);
    } catch { setError(t('auth.networkError')); }
    finally { setPending(false); }
  }
  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      {!sent && (reset ? <>
        <label className="label" htmlFor="new-password">{t('auth.newPassword')}</label>
        <input id="new-password" name="password" type="password" className="field" required minLength={8} autoComplete="new-password" />
        <label className="label" htmlFor="confirm-password">{t('auth.confirmPassword')}</label>
        <input id="confirm-password" name="confirm" type="password" className="field" required minLength={8} autoComplete="new-password" />
      </> : <>
        <label className="label" htmlFor="recovery-email">{t('auth.email')}</label>
        <input id="recovery-email" name="email" type="email" className="field" required autoComplete="email" />
      </>)}
      {error && <p role="alert" className="text-sm text-[var(--color-bad)]">{error}</p>}
      {sent ? <p role="status">{t(reset ? 'auth.passwordUpdated' : 'auth.recoverySent')}</p> :
        <button type="submit" disabled={pending} className="btn btn-primary w-full">{t(pending ? 'common.loading' : reset ? 'auth.savePassword' : 'auth.sendRecovery')}</button>}
      <Link href={`/${locale}/login`} className="block text-center font-semibold hover:underline">{t('auth.login')}</Link>
    </form>
  );
}
