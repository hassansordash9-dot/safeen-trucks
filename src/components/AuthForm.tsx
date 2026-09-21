'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { createClient } from '@/lib/supabase/client';
import { routes } from '@/lib/routes';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const next = params.get('next');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');

    setError(null);
    setInfo(null);

    if (mode === 'register' && password.length < 8) {
      setError(t('auth.weakPassword'));
      return;
    }

    setPending(true);
    const supabase = createClient();

    if (mode === 'login') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setPending(false);
      if (signInError) {
        setError(t('auth.invalid'));
        return;
      }
      router.push(next?.startsWith('/') ? next : routes.account(locale));
      router.refresh();
      return;
    }

    const { data: signUp, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: String(data.get('full_name') ?? '').trim(),
          phone: String(data.get('phone') ?? '').trim(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?locale=${locale}${
          next ? `&next=${encodeURIComponent(next)}` : ''
        }`,
      },
    });
    setPending(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (signUp.session) {
      router.push(next?.startsWith('/') ? next : routes.account(locale));
      router.refresh();
      return;
    }
    setInfo(t('auth.checkEmail'));
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      {mode === 'register' && (
        <>
          <div>
            <label className="label" htmlFor="full_name">
              {t('auth.fullName')}
            </label>
            <input id="full_name" name="full_name" className="field" required autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              {t('auth.phone')}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              className="field"
              autoComplete="tel"
              placeholder="0750 000 0000"
            />
          </div>
        </>
      )}

      <div>
        <label className="label" htmlFor="email">
          {t('auth.email')}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="field"
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          {t('auth.password')}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          required
          minLength={mode === 'register' ? 8 : undefined}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-[var(--color-bad)]">
          {error}
        </p>
      )}
      {info && (
        <p role="status" className="text-sm text-[var(--color-ok)]">
          {info}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? t('common.loading') : mode === 'login' ? t('auth.signIn') : t('auth.signUp')}
      </button>

      <p className="text-center text-sm text-[var(--color-muted)]">
        {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
        <Link
          href={mode === 'login' ? routes.register(locale) : routes.login(locale)}
          className="font-semibold text-[var(--color-text)] hover:underline"
        >
          {mode === 'login' ? t('auth.register') : t('auth.login')}
        </Link>
      </p>
    </form>
  );
}
