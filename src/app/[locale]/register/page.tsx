import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { getSessionUser } from '@/lib/auth';
import { routes } from '@/lib/routes';

export default async function RegisterPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const user = await getSessionUser();
  if (user) redirect(routes.account(locale));

  const t = createTranslator(await getDictionary(locale));

  return (
    <div className="container-page max-w-md py-10">
      <h1 className="mb-5 text-2xl font-bold text-[var(--color-text)]">{t('auth.register')}</h1>
      <Suspense fallback={<div className="card h-96 animate-pulse" />}>
        <AuthForm mode="register" />
      </Suspense>
    </div>
  );
}
